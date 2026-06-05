from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/cases/', include('apps.cases.urls')),
    path('api/v1/conflicts/', include('apps.conflicts.urls')),
    path('api/v1/deadlines/', include('apps.deadlines.urls')),
    path('api/v1/health/', health),
]
