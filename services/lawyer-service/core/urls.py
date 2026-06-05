from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.shortcuts import get_list_or_404

# internal-only endpoint to return a user's active firm memberships
def internal_user_memberships(request, user_id):
    # simple header check against INTERNAL_API_KEY
    if request.headers.get('X-Internal-Api-Key') != getattr(settings, 'INTERNAL_API_KEY', 'dev-internal-key'):
        return JsonResponse({'detail': 'Authentication credentials were not provided.'}, status=403)
    try:
        from apps.firms.models import FirmMembership
        from apps.firms.serializers import FirmMembershipSerializer
    except Exception:
        return JsonResponse({'detail': 'Service error'}, status=500)

    memberships = FirmMembership.objects.filter(user_id=user_id, is_active=True).select_related('firm')
    serializer = FirmMembershipSerializer(memberships, many=True)
    return JsonResponse(serializer.data, safe=False)


def health(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/lawyers/', include('apps.lawyers.urls')),
    path('api/v1/lawyers/', include('apps.discovery.urls')),
    # internal membership lookup (bypasses DRF auth for internal callers)
    path('api/v1/firms/internal/users/<uuid:user_id>/memberships/', internal_user_memberships),
    path('api/v1/firms/', include('apps.firms.urls')),
    path('api/v1/health/', health),
]
