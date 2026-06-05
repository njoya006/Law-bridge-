from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from .models import ClientProfile
from .serializers import ClientProfileSerializer, ClientProfileUpdateSerializer
from .tasks import compute_eligibility_score


class ClientProfileView(APIView):
    """Get or create/update current client profile"""
    
    def get(self, request):
        """GET /api/v1/clients/me/ - Get current client profile"""
        try:
            profile = ClientProfile.objects.get(user_id=request.user.id)
            serializer = ClientProfileSerializer(profile)
            return Response(serializer.data)
        except ClientProfile.DoesNotExist:
            return Response(
                {'error': 'Client profile not found. Please create one.'},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        """POST /api/v1/clients/me/ - Create client profile"""
        # Check if profile already exists
        if ClientProfile.objects.filter(user_id=request.user.id).exists():
            return Response(
                {'error': 'Profile already exists. Use PUT to update.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ClientProfileUpdateSerializer(data=request.data)
        if serializer.is_valid():
            profile = ClientProfile.objects.create(
                user_id=request.user.id,
                **serializer.validated_data
            )
            
            # Trigger eligibility scoring asynchronously
            compute_eligibility_score.delay(str(profile.id))
            
            return Response(
                ClientProfileSerializer(profile).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        """PUT /api/v1/clients/me/ - Update client profile"""
        try:
            profile = ClientProfile.objects.get(user_id=request.user.id)
        except ClientProfile.DoesNotExist:
            return Response(
                {'error': 'Client profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ClientProfileUpdateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Recompute eligibility score when profile changes
            compute_eligibility_score.delay(str(profile.id))
            
            return Response(ClientProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClientEligibilityView(APIView):
    """Check legal aid eligibility"""
    
    def get(self, request):
        """GET /api/v1/clients/eligibility/ - Get eligibility status"""
        try:
            profile = ClientProfile.objects.get(user_id=request.user.id)
            return Response({
                'user_id': profile.user_id,
                'eligibility_score': profile.eligibility_score,
                'qualifies_for_aid': profile.qualifies_for_aid(),
                'last_computed': profile.eligibility_computed_at,
            })
        except ClientProfile.DoesNotExist:
            return Response(
                {'error': 'Client profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health(request):
    """Health check endpoint"""
    return Response({'status': 'ok'})
