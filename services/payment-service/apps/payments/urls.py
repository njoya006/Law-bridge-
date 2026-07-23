from django.urls import path
from .views import PaymentCreateView, PaymentListView, mtn_webhook, orange_webhook, PaymentStatsView

urlpatterns = [
    path('', PaymentCreateView.as_view(), name='payment-create'),
    path('stats/', PaymentStatsView.as_view(), name='payment-stats'),
    path('webhooks/mtn/', mtn_webhook, name='mtn-webhook'),
    path('webhooks/orange/', orange_webhook, name='orange-webhook'),
    path('<uuid:case_id>/', PaymentListView.as_view(), name='payment-list'),
]
