from django.urls import path
from .views import LawyerBrowseView, LawyerSearchView, LawyerMatchingView

urlpatterns = [
    path('', LawyerBrowseView.as_view(), name='lawyer-browse'),
    path('search/', LawyerSearchView.as_view(), name='lawyer-search'),
    path('match/', LawyerMatchingView.as_view(), name='lawyer-match'),
]
