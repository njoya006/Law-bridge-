from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import LawyerProfile
from .serializers import LawyerProfileSerializer, LawyerProfileUpdateSerializer


class LawyerProfileView(APIView):
    """Get or create/update current lawyer profile"""
    
    def get(self, request):
        """GET /api/v1/lawyers/me/ - Get current lawyer profile"""
        try:
            profile = LawyerProfile.objects.get(user_id=request.user.id)
            serializer = LawyerProfileSerializer(profile)
            return Response(serializer.data)
        except LawyerProfile.DoesNotExist:
            return Response(
                {'error': 'Lawyer profile not found. Please create one.'},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        """POST /api/v1/lawyers/me/ - Create lawyer profile"""
        if LawyerProfile.objects.filter(user_id=request.user.id).exists():
            return Response(
                {'error': 'Profile already exists. Use PUT to update.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = LawyerProfileUpdateSerializer(data=request.data)
        if serializer.is_valid():
            profile = LawyerProfile.objects.create(
                user_id=request.user.id,
                **serializer.validated_data
            )
            return Response(
                LawyerProfileSerializer(profile).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        """PUT /api/v1/lawyers/me/ - Update lawyer profile"""
        try:
            profile = LawyerProfile.objects.get(user_id=request.user.id)
        except LawyerProfile.DoesNotExist:
            return Response(
                {'error': 'Lawyer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = LawyerProfileUpdateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(LawyerProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
