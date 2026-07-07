from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.lawyers.models import LawyerProfile
from .models import Review
from .serializers import ReviewSerializer, ReviewWriteSerializer


class ReviewListCreateView(APIView):
    """
    GET  /api/v1/lawyers/{lawyer_id}/reviews/  — public list
    POST /api/v1/lawyers/{lawyer_id}/reviews/  — authenticated client submits review
    """

    def _get_lawyer(self, lawyer_id):
        try:
            return LawyerProfile.objects.get(id=lawyer_id)
        except LawyerProfile.DoesNotExist:
            pass
        try:
            return LawyerProfile.objects.get(user_id=lawyer_id)
        except LawyerProfile.DoesNotExist:
            return None

    def get(self, request, lawyer_id):
        lawyer = self._get_lawyer(lawyer_id)
        if lawyer is None:
            return Response({'error': 'Lawyer not found'}, status=status.HTTP_404_NOT_FOUND)
        reviews = Review.objects.filter(lawyer=lawyer).select_related()
        return Response({
            'count': reviews.count(),
            'average_rating': float(lawyer.average_rating),
            'results': ReviewSerializer(reviews, many=True).data,
        })

    def post(self, request, lawyer_id):
        auth = getattr(request, 'auth_payload', None)
        if not auth:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        caller_id = str(auth.get('user_id', ''))
        caller_name = auth.get('full_name') or auth.get('name') or auth.get('email', '')
        caller_role = auth.get('role', '')

        if caller_role in ('lawyer', 'partner', 'associate', 'firm_admin', 'owner', 'admin'):
            return Response(
                {'error': 'Only clients can submit reviews'},
                status=status.HTTP_403_FORBIDDEN,
            )

        lawyer = self._get_lawyer(lawyer_id)
        if lawyer is None:
            return Response({'error': 'Lawyer not found'}, status=status.HTTP_404_NOT_FOUND)

        if str(lawyer.user_id) == caller_id:
            return Response({'error': 'Cannot review yourself'}, status=status.HTTP_400_BAD_REQUEST)

        if Review.objects.filter(lawyer=lawyer, client_id=caller_id).exists():
            return Response(
                {'error': 'You have already reviewed this lawyer'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ser = ReviewWriteSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        review = ser.save(lawyer=lawyer, client_id=caller_id, client_name=caller_name)
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)
