"""
Unified AI client — uses Groq (cloud, free tier) when GROQ_API_KEY is set,
falls back to Ollama when available, or raises a clear error if neither works.
"""
import logging
from typing import Generator

logger = logging.getLogger(__name__)

LEGAL_SYSTEM_PROMPT = """You are LexAI, an expert AI legal assistant for LawBridge — a platform serving legal professionals in Cameroon and the CEMAC region.

You specialise in:
- Cameroonian Civil Law (droit civil, Code Civil, Francophone tradition)
- Cameroonian Common Law (Anglophone tradition — North West and South West regions)
- Bijural matters spanning both traditions
- OHADA Uniform Acts applicable across CEMAC member states
- Cameroonian Code of Civil Procedure, Code of Criminal Procedure
- CEMAC regulations and COBAC directives

Guidelines:
- Be precise, professional, and cite relevant legislation when possible
- When the question is in French, respond in French; English questions get English answers
- For bijural questions, address both traditions
- Do not provide advice that could constitute legal malpractice — always note that this is AI assistance and the lawyer should exercise their own professional judgement
- Keep responses concise but complete"""


class GroqClient:
    """Groq cloud inference — free tier, fast, no GPU required."""

    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        from groq import Groq
        self.client = Groq(api_key=api_key)
        self.model = model

    def stream(
        self,
        user_message: str,
        history: list,
        case_context: str = "",
    ) -> Generator[str, None, None]:
        system = LEGAL_SYSTEM_PROMPT
        if case_context:
            system += f"\n\n{case_context}"

        messages = [{"role": "system", "content": system}]
        for msg in history[-10:]:
            role = msg.get("role", "user")
            if role not in ("user", "assistant"):
                role = "user"
            messages.append({"role": role, "content": msg.get("content", "")})
        messages.append({"role": "user", "content": user_message})

        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            stream=True,
            max_tokens=2048,
            temperature=0.3,
        )

        for chunk in completion:
            token = chunk.choices[0].delta.content or ""
            if token:
                yield token


class OllamaFallbackClient:
    """Ollama local inference — used when Groq key is not set."""

    def __init__(self, base_url: str, model: str):
        import httpx
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.httpx = httpx

    def stream(
        self,
        user_message: str,
        history: list,
        case_context: str = "",
    ) -> Generator[str, None, None]:
        import json

        history_text = ""
        for msg in history[-10:]:
            role = "User" if msg.get("role") == "user" else "LexAI"
            history_text += f"{role}: {msg.get('content', '')}\n"

        prompt = f"{LEGAL_SYSTEM_PROMPT}\n\n"
        if case_context:
            prompt += f"{case_context}\n\n"
        if history_text:
            prompt += f"CONVERSATION HISTORY:\n{history_text}\n"
        prompt += f"User: {user_message}\nLexAI:"

        with self.httpx.Client(timeout=self.httpx.Timeout(120)) as client:
            with client.stream(
                "POST",
                f"{self.base_url}/api/generate",
                json={"model": self.model, "prompt": prompt, "stream": True},
            ) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if line:
                        data = json.loads(line)
                        token = data.get("response", "")
                        if token:
                            yield token
                        if data.get("done"):
                            break


def get_ai_client(settings):
    """
    Return the best available AI client based on current settings.
    Priority: Groq (if key set) → Ollama (if reachable) → error
    """
    groq_key = getattr(settings, "GROQ_API_KEY", None)
    if groq_key:
        model = getattr(settings, "GROQ_MODEL", "llama-3.1-70b-versatile")
        logger.info("AI backend: Groq (%s)", model)
        return GroqClient(api_key=groq_key, model=model)

    # Fall back to Ollama
    ollama_url = getattr(settings, "OLLAMA_URL", "http://ollama:11434")
    ollama_model = getattr(settings, "OLLAMA_CHAT_MODEL", "llama3")
    logger.warning("GROQ_API_KEY not set — trying Ollama at %s", ollama_url)
    return OllamaFallbackClient(base_url=ollama_url, model=ollama_model)
