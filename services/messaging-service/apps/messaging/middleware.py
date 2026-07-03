from channels.middleware import BaseMiddleware
from channels.auth import AuthMiddlewareStack
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs
from apps.auth_proxy import decode_token


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token = (params.get('token') or [''])[0]

        if token:
            payload = decode_token(token)
            scope['user_id'] = payload.get('user_id') or payload.get('uuid') or payload.get('sub', '')
            scope['user_role'] = payload.get('role', 'client')
            scope['display_name'] = payload.get('name') or payload.get('email', 'Unknown')
            scope['auth_payload'] = payload
        else:
            scope['user_id'] = ''
            scope['user_role'] = ''
            scope['display_name'] = ''
            scope['auth_payload'] = {}

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
