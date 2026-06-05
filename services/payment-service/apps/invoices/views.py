from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Invoice
from .serializers import InvoiceSerializer


class InvoiceListView(APIView):
    """List invoices for a case"""
    
    def get(self, request, case_id):
        """GET /api/v1/invoices/{case_id}/ - List invoices"""
        invoices = Invoice.objects.filter(case_id=case_id)
        serializer = InvoiceSerializer(invoices, many=True)
        return Response({
            'count': invoices.count(),
            'results': serializer.data
        })


class InvoiceCreateView(APIView):
    """Create an invoice"""
    
    def post(self, request):
        """POST /api/v1/invoices/ - Create invoice"""
        serializer = InvoiceSerializer(data=request.data)
        if serializer.is_valid():
            invoice = Invoice.objects.create(**serializer.validated_data)
            return Response(
                InvoiceSerializer(invoice).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
