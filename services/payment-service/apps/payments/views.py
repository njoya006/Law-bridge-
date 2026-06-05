from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import jwt
from decouple import config
from .models import Payment
from .serializers import PaymentSerializer, PaymentWebhookSerializer
from .tasks import verify_payment


def extract_user_id_from_token(request):
    """Extract user_id UUID from JWT token"""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, config('JWT_SECRET_KEY', default='dev-secret'), algorithms=['HS256'])
            return payload.get('user_id')
        except:
            pass
    return str(request.user.id)


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
