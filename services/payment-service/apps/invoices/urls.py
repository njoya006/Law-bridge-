from django.urls import path
from .views import InvoiceListView, InvoiceCreateView

urlpatterns = [
    path('', InvoiceCreateView.as_view(), name='invoice-create'),
    path('<uuid:case_id>/', InvoiceListView.as_view(), name='invoice-list'),
]
