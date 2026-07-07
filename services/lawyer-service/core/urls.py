from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/lawyers/', include('apps.lawyers.urls')),
    path('api/v1/lawyers/', include('apps.discovery.urls')),
    path('api/v1/lawyers/', include('apps.reviews.urls')),
    path('api/v1/lawyers/', include('apps.verification.urls')),
    path('api/v1/firms/', include('apps.firms.urls')),
    path('api/v1/health/', health),
]
