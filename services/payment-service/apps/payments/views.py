from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import jwt
from decouple import config
from django.conf import settings
from .models import Payment
from .serializers import PaymentSerializer, PaymentWebhookSerializer
from .tasks import verify_payment


def extract_user_id_from_token(request):
    """Extract user_id UUID from JWT token"""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        try:
            token = auth_header.split(' ')[1]
            signing_key = settings.SIMPLE_JWT.get('SIGNING_KEY', settings.SECRET_KEY)
            payload = jwt.decode(token, signing_key, algorithms=['HS256'], options={'verify_aud': False})
            return payload.get('user_id')
        except Exception:
            pass
    return str(request.user.id)


def _token_role(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        try:
            token = auth_header.split(' ')[1]
            signing_key = settings.SIMPLE_JWT.get('SIGNING_KEY', settings.SECRET_KEY)
            payload = jwt.decode(token, signing_key, algorithms=['HS256'], options={'verify_aud': False})
            return payload.get('role', '')
        except Exception:
            pass
    return getattr(getattr(request, 'user', None), 'role', '')


class PaymentStatsView(APIView):
    """GET /api/v1/payments/stats/ — platform GMV metrics. Admin/support only."""
    permission_classes = [AllowAny]

    def get(self, request):
        if _token_role(request) not in ('admin', 'support'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        from django.db.models import Sum, Count
        from django.utils import timezone
        confirmed = Payment.objects.filter(status='confirmed')
        agg = confirmed.aggregate(gmv=Sum('amount'), n=Count('id'))
        now = timezone.now()
        month = confirmed.filter(confirmed_at__year=now.year, confirmed_at__month=now.month).aggregate(
            gmv=Sum('amount'), n=Count('id'))
        return Response({
            'gmv_total': float(agg['gmv'] or 0),
            'payments_confirmed': agg['n'] or 0,
            'gmv_this_month': float(month['gmv'] or 0),
            'payments_this_month': month['n'] or 0,
            'currency': 'XAF',
        })


class PaymentCreateView(APIView):
    """Create a payment request"""
    
    def post(self, request):
        """POST /api/v1/payments/ - Create payment"""
        user_id = extract_user_id_from_token(request)
        serializer = PaymentSerializer(data=request.data)
        if serializer.is_valid():
            payment = Payment.objects.create(
                client_id=user_id,
                idempotency_key=request.data.get('idempotency_key'),
                **serializer.validated_data
            )
            return Response(
                PaymentSerializer(payment).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PaymentListView(APIView):
    """List payments for a case"""
    
    def get(self, request, case_id):
        """GET /api/v1/payments/{case_id}/ - List case payments"""
        payments = Payment.objects.filter(case_id=case_id)
        serializer = PaymentSerializer(payments, many=True)
        return Response({
            'count': payments.count(),
            'results': serializer.data
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def mtn_webhook(request):
    """POST /api/v1/payments/webhook/mtn/ - MTN Money webhook"""
    serializer = PaymentWebhookSerializer(data=request.data)
    if serializer.is_valid():
        verify_payment.delay(
            reference=serializer.data['reference'],
            provider='mtn',
            status=serializer.data['status']
        )
        return Response({'status': 'received'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def orange_webhook(request):
    """POST /api/v1/payments/webhook/orange/ - Orange Money webhook"""
    serializer = PaymentWebhookSerializer(data=request.data)
    if serializer.is_valid():
        verify_payment.delay(
            reference=serializer.data['reference'],
            provider='orange',
            status=serializer.data['status']
        )
        return Response({'status': 'received'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
