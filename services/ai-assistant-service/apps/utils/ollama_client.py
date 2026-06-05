import json
import time

import httpx
from django.conf import settings
import logging

from prometheus_client import Counter, Gauge
import redis as redis_lib


class OllamaClient:
    def __init__(self):
        self.base_url = settings.OLLAMA_URL
        # Increase timeout to allow larger models more time to respond
        timeout_seconds = getattr(settings, 'OLLAMA_CLIENT_TIMEOUT_SECONDS', 600)
        self.timeout = httpx.Timeout(timeout_seconds)
        # circuit breaker state (use Redis when available for multi-instance safety)
        self._failure_count = 0
        self._circuit_open_until = 0
        self._circuit_threshold = getattr(settings, 'OLLAMA_CIRCUIT_THRESHOLD', 5)
        self._circuit_open_seconds = getattr(settings, 'OLLAMA_CIRCUIT_OPEN_SECONDS', 60)
        self._redis = None
        self._failure_key = getattr(settings, 'OLLAMA_REDIS_FAILURE_KEY', 'ollama:failure_count')
        self._circuit_key = getattr(settings, 'OLLAMA_REDIS_CIRCUIT_KEY', 'ollama:circuit_open_until')
        try:
            redis_url = getattr(settings, 'REDIS_URL', None) or getattr(settings, 'REDIS_LOCATION', None) or getattr(settings, 'CACHES', None)
            if getattr(settings, 'REDIS_URL', None):
                self._redis = redis_lib.from_url(settings.REDIS_URL)
        except Exception:
            self._redis = None

        # Prometheus metrics with labels for finer alerting
        # labels: model (e.g., phi3) and endpoint (api path)
        label_names = ['model', 'endpoint']
        self._metric_retry_total = Counter('ollama_retry_total', 'Total Ollama retries', label_names)
        self._metric_failure_total = Counter('ollama_failure_total', 'Total Ollama failures', label_names)
        self._metric_circuit_open = Gauge('ollama_circuit_open', 'Ollama circuit open (1=open,0=closed)', label_names)

        # structured logger helper
        self._logger = logging.getLogger('apps.utils.ollama_client')

    def generate(self, model: str, prompt: str, system: str = None, stream: bool = False):
        payload = {
            'model': model,
            'prompt': prompt,
            'stream': stream,
        }
        if system:
            payload['system'] = system

        if stream:
            return self._stream_generate(payload)
        return self._sync_generate(payload)

    def _sync_generate(self, payload: dict) -> dict:
        model = payload.get('model', 'unknown')
        endpoint = '/api/generate'
        # simple retry loop for transient errors
        attempts = 3
        backoff = 1
        for attempt in range(1, attempts + 1):
            # circuit-breaker check (Redis-backed when available)
            now = time.time()
            if self._redis:
                try:
                    open_until = float(self._redis.get(self._circuit_key) or 0)
                    if open_until and now < open_until:
                        self._metric_circuit_open.labels(model=model, endpoint=endpoint).set(1)
                        self._logger.error({
                            'event': 'circuit_open', 'source': 'redis', 'open_until': open_until, 'model': model
                        })
                        raise RuntimeError('Ollama circuit open')
                    else:
                        self._metric_circuit_open.labels(model=model, endpoint=endpoint).set(0)
                except Exception:
                    # Redis errors should not prevent operation; fallback to in-process state
                    pass
            else:
                if self._circuit_open_until and now < self._circuit_open_until:
                    self._metric_circuit_open.labels(model=model, endpoint=endpoint).set(1)
                    self._logger.error({
                        'event': 'circuit_open', 'source': 'inprocess', 'open_until': self._circuit_open_until, 'model': model
                    })
                    raise RuntimeError('Ollama circuit open')
                else:
                    self._metric_circuit_open.labels(model=model, endpoint=endpoint).set(0)
            try:
                with httpx.Client(timeout=self.timeout) as client:
                    response = client.post(f'{self.base_url}/api/generate', json=payload)
                    response.raise_for_status()

                    full_response = ''
                    for line in response.text.strip().split('\n'):
                        if line:
                            data = json.loads(line)
                            full_response += data.get('response', '')
                            if data.get('done'):
                                break

                    # successful call -> reset failure/circuit state
                    if self._redis:
                        try:
                            self._redis.delete(self._failure_key)
                            self._redis.delete(self._circuit_key)
                        except Exception:
                            pass
                    self._failure_count = 0
                    self._circuit_open_until = 0
                    self._metric_circuit_open.labels(model=model, endpoint=endpoint).set(0)
                    return {'response': full_response, 'done': True}
            except Exception as e:
                # record retry/failure metrics and log
                if attempt < attempts:
                    self._metric_retry_total.labels(model=model, endpoint=endpoint).inc()
                    self._logger.warning({
                        'event': 'retry', 'attempt': attempt, 'backoff': backoff, 'error': str(e), 'model': model
                    })
                    time.sleep(backoff)
                    backoff *= 2
                    continue
                # final failure
                self._metric_failure_total.labels(model=model, endpoint=endpoint).inc()
                self._logger.error({'event': 'final_failure', 'error': str(e), 'model': model})
                # update circuit breaker state (Redis-backed when available)
                if self._redis:
                    try:
                        failures = self._redis.incr(self._failure_key)
                        if failures == 1:
                            # set a reasonable TTL so failures reset over time
                            self._redis.expire(self._failure_key, max(60, self._circuit_open_seconds))
                        if failures >= self._circuit_threshold:
                            open_until = time.time() + self._circuit_open_seconds
                            self._redis.set(self._circuit_key, open_until, ex=self._circuit_open_seconds)
                            self._logger.error({'event': 'circuit_open', 'source': 'redis', 'duration': self._circuit_open_seconds, 'model': model})
                            self._metric_circuit_open.labels(model=model, endpoint=endpoint).set(1)
                    except Exception:
                        # fallback to in-process
                        self._failure_count += 1
                        if self._failure_count >= self._circuit_threshold:
                            self._circuit_open_until = time.time() + self._circuit_open_seconds
                            self._logger.error({'event': 'circuit_open', 'source': 'inprocess', 'duration': self._circuit_open_seconds, 'model': model})
                            self._metric_circuit_open.labels(model=model, endpoint=endpoint).set(1)
                else:
                    self._failure_count += 1
                    if self._failure_count >= self._circuit_threshold:
                        self._circuit_open_until = time.time() + self._circuit_open_seconds
                        self._logger.error({'event': 'circuit_open', 'source': 'inprocess', 'duration': self._circuit_open_seconds, 'model': model})
                        self._metric_circuit_open.labels(model=model, endpoint=endpoint).set(1)
                raise

    def _stream_generate(self, payload: dict):
        # streaming generation: single attempt, let caller handle retries
        with httpx.Client(timeout=self.timeout) as client:
            with client.stream('POST', f'{self.base_url}/api/generate', json=payload) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if line:
                        data = json.loads(line)
                        yield data

    def health_check(self) -> bool:
        try:
            with httpx.Client(timeout=httpx.Timeout(5.0)) as client:
                response = client.get(f'{self.base_url}/api/tags')
                return response.status_code == 200
        except Exception:
            return False

    def list_models(self) -> list:
        with httpx.Client(timeout=self.timeout) as client:
            response = client.get(f'{self.base_url}/api/tags')
            response.raise_for_status()
            return response.json().get('models', [])


ollama = OllamaClient()
