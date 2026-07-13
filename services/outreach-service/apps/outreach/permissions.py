from rest_framework.permissions import BasePermission


class IsAdminOrSupport(BasePermission):
    """Allows access only to users with role 'admin' or 'support' in the JWT payload."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        token = getattr(request.auth, 'payload', {})
        role = token.get('role', '')
        return role in ('admin', 'support')
