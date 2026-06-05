from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            'id', 'case_id', 'client_id', 'lawyer_id', 'amount', 'currency',
            'payment_method', 'status', 'mtn_reference', 'orange_reference',
            'created_at', 'confirmed_at'
        )
        read_only_fields = ('id', 'created_at', 'confirmed_at', 'status', 'client_id')


class PaymentWebhookSerializer(serializers.Serializer):
    """Webhook payload from payment providers"""
    reference = serializers.CharField()
    status = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    timestamp = serializers.DateTimeField()

