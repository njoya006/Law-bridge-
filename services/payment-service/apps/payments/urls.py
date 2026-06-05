from django.urls import path
from .views import PaymentCreateView, PaymentListView, mtn_webhook, orange_webhook

urlpatterns = [
    path('', PaymentCreateView.as_view(), name='payment-create'),
    path('<uuid:case_id>/', PaymentListView.as_view(), name='payment-list'),
    path('webhooks/mtn/', mtn_webhook, name='mtn-webhook'),
    path('webhooks/orange/', orange_webhook, name='orange-webhook'),
]
