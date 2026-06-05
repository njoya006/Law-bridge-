from django.http import JsonResponse
from django.views import View
from django.conf import settings

from apps.utils.ollama_client import ollama
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from django.http import HttpResponse


class LivenessView(View):
    def get(self, request):
        return JsonResponse({"status": "ok"}, status=200)


class ReadinessView(View):
    def get(self, request):
        ok = True
        details = {}

        try:
            ollama_ok = ollama.health_check()
            details['ollama'] = ollama_ok
            if not ollama_ok:
                ok = False
        except Exception as e:
            details['ollama'] = False
            details['ollama_error'] = str(e)
            ok = False

        status = 200 if ok else 503
        return JsonResponse({"ready": ok, "details": details}, status=status)


class MetricsView(View):
    def get(self, request):
        data = generate_latest()
        return HttpResponse(data, content_type=CONTENT_TYPE_LATEST)
