from rest_framework import serializers
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = (
            'id', 'case_id', 'client_id', 'lawyer_id', 'invoice_number',
            'status', 'subtotal', 'tax_amount', 'total_amount', 'paid_amount',
            'items', 'issued_at', 'due_at', 'paid_at', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'paid_at')
