from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import jwt
from decouple import config


class CustomJWTAuthentication(BaseAuthentication):
    """
    Custom JWT authentication that extracts user_id without requiring
    a Django User object lookup. This is needed for UUID-based user IDs
    from the Auth service.
    """
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return None
        
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(
                token,
                config('JWT_SECRET_KEY', default='dev-secret'),
                algorithms=['HS256']
            )
            
            # Create a simple user object with the extracted user_id
            # This avoids Django trying to look up a User object with UUID
            user = type('User', (), {
                'id': payload.get('user_id'),
                'email': payload.get('email'),
                'role': payload.get('role'),
                'is_authenticated': True
            })()
            
            return (user, token)
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')
        except Exception as e:
            raise AuthenticationFailed(f'Authentication failed: {str(e)}')
