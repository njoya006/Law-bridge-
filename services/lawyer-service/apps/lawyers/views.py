import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import LawyerProfile, LawyerAvailability
from .serializers import (
    LawyerProfileSerializer, LawyerProfileUpdateSerializer,
    LawyerAvailabilitySerializer, LawyerAvailabilityWriteSerializer,
)


class LawyerPublicDetailView(APIView):
    """GET /api/v1/lawyers/{lawyer_id}/ — public full profile of a single lawyer."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, lawyer_id):
        try:
            # Try profile PK first, fall back to auth-service UUID (user_id)
            try:
                profile = LawyerProfile.objects.get(id=lawyer_id)
            except (LawyerProfile.DoesNotExist, ValueError):
                profile = LawyerProfile.objects.get(user_id=lawyer_id)
        except (LawyerProfile.DoesNotExist, ValueError):
            return Response({'error': 'Lawyer not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(LawyerProfileSerializer(profile).data)


def _lawyer_uuid(request):
    """Return the UUID of the authenticated lawyer from the JWT payload."""
    payload = getattr(request, 'auth_payload', {})
    uid = payload.get('user_id') or payload.get('sub')
    if uid:
        return uuid.UUID(str(uid))
    raise ValueError('Cannot determine user UUID from token')


class LawyerProfileView(APIView):
    """Get or create/update current lawyer profile"""

    def get(self, request):
        try:
            user_uuid = _lawyer_uuid(request)
        except (ValueError, AttributeError):
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            profile = LawyerProfile.objects.get(user_id=user_uuid)
            serializer = LawyerProfileSerializer(profile)
            return Response(serializer.data)
        except LawyerProfile.DoesNotExist:
            return Response(
                {'error': 'Lawyer profile not found. Please create one.'},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        try:
            user_uuid = _lawyer_uuid(request)
        except (ValueError, AttributeError):
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        if LawyerProfile.objects.filter(user_id=user_uuid).exists():
            return Response(
                {'error': 'Profile already exists. Use PUT to update.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = LawyerProfileUpdateSerializer(data=request.data)
        if serializer.is_valid():
            profile = LawyerProfile.objects.create(
                user_id=user_uuid,
                **serializer.validated_data
            )
            return Response(LawyerProfileSerializer(profile).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        try:
            user_uuid = _lawyer_uuid(request)
        except (ValueError, AttributeError):
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            profile = LawyerProfile.objects.get(user_id=user_uuid)
        except LawyerProfile.DoesNotExist:
            return Response({'error': 'Lawyer profile not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = LawyerProfileUpdateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(LawyerProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LawyerAvailabilityView(APIView):
    """Manage weekly availability slots — bulk replace with PUT, list with GET."""

    def _get_profile(self, request):
        try:
            user_uuid = _lawyer_uuid(request)
        except (ValueError, AttributeError):
            return None
        try:
            return LawyerProfile.objects.get(user_id=user_uuid)
        except LawyerProfile.DoesNotExist:
            return None

    def get(self, request):
        profile = self._get_profile(request)
        if not profile:
            return Response({'error': 'Lawyer profile not found'}, status=status.HTTP_404_NOT_FOUND)
        slots = LawyerAvailability.objects.filter(lawyer=profile)
        return Response(LawyerAvailabilitySerializer(slots, many=True).data)

    def put(self, request):
        """Replace all availability slots for the lawyer in one operation."""
        profile = self._get_profile(request)
        if not profile:
            return Response({'error': 'Lawyer profile not found'}, status=status.HTTP_404_NOT_FOUND)

        slots_data = request.data if isinstance(request.data, list) else request.data.get('slots', [])
        serializer = LawyerAvailabilityWriteSerializer(data=slots_data, many=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        LawyerAvailability.objects.filter(lawyer=profile).delete()
        LawyerAvailability.objects.bulk_create([
            LawyerAvailability(lawyer=profile, **item) for item in serializer.validated_data
        ])

        updated = LawyerAvailability.objects.filter(lawyer=profile)
        return Response(LawyerAvailabilitySerializer(updated, many=True).data)
