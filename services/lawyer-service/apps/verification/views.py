import logging
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.lawyers.models import LawyerProfile
from .models import VerificationRequest
from .serializers import VerificationRequestSerializer, VerificationSubmitSerializer

logger = logging.getLogger(__name__)

STAFF_ROLES = {'associate', 'partner', 'firm_admin', 'owner', 'guest', 'lawyer'}


def _get_lawyer_profile(request):
    user_id = str(request.auth_payload.get('user_id', ''))
    return LawyerProfile.objects.filter(user_id=user_id).first()


class VerificationSubmitView(APIView):
    """
    POST — lawyer submits or resubmits a verification request
    GET  — lawyer checks their own verification status
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        lawyer = _get_lawyer_profile(request)
        if not lawyer:
            return Response({'detail': 'Lawyer profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        already_verified = lawyer.verified_at is not None
        try:
            vr = VerificationRequest.objects.get(lawyer=lawyer)
            return Response({
                'is_verified': already_verified,
                'request': VerificationRequestSerializer(vr).data,
            })
        except VerificationRequest.DoesNotExist:
            return Response({'is_verified': already_verified, 'request': None})

    def post(self, request):
        role = request.auth_payload.get('role', '')
        if role not in STAFF_ROLES:
            return Response({'detail': 'Only lawyers can submit verification requests.'}, status=status.HTTP_403_FORBIDDEN)

        lawyer = _get_lawyer_profile(request)
        if not lawyer:
            return Response({'detail': 'Lawyer profile not found. Complete your profile first.'}, status=status.HTTP_404_NOT_FOUND)

        if lawyer.verified_at is not None:
            return Response({'detail': 'Your profile is already verified.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = VerificationSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        vr, created = VerificationRequest.objects.update_or_create(
            lawyer=lawyer,
            defaults={
                'bar_number': serializer.validated_data['bar_number'],
                'bar_council': serializer.validated_data['bar_council'],
                'year_called': serializer.validated_data['year_called'],
                'notes': serializer.validated_data.get('notes', ''),
                'status': VerificationRequest.STATUS_PENDING,
                'rejection_reason': '',
            },
        )
        lawyer.bar_number = serializer.validated_data['bar_number']
        lawyer.save(update_fields=['bar_number'])

        return Response(VerificationRequestSerializer(vr).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class VerificationQueueView(APIView):
    """GET — admin sees all pending verification requests"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.auth_payload.get('role') != 'admin':
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        filter_status = request.query_params.get('status', 'pending')
        qs = VerificationRequest.objects.select_related('lawyer')
        if filter_status in ('pending', 'approved', 'rejected'):
            qs = qs.filter(status=filter_status)

        serializer = VerificationRequestSerializer(qs, many=True)
        return Response({'count': qs.count(), 'results': serializer.data})


class VerificationActionView(APIView):
    """POST /verification/{id}/approve/ or /verification/{id}/reject/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, action):
        if request.auth_payload.get('role') != 'admin':
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            vr = VerificationRequest.objects.select_related('lawyer').get(pk=pk)
        except VerificationRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if vr.status != VerificationRequest.STATUS_PENDING:
            return Response({'detail': f'Request is already {vr.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        admin_id = str(request.auth_payload.get('user_id', ''))
        now = timezone.now()

        if action == 'approve':
            vr.status = VerificationRequest.STATUS_APPROVED
            vr.reviewed_by_id = admin_id
            vr.reviewed_at = now
            vr.save(update_fields=['status', 'reviewed_by_id', 'reviewed_at'])
            vr.lawyer.verified_at = now
            vr.lawyer.save(update_fields=['verified_at'])
            return Response({'detail': 'Verified.', 'request': VerificationRequestSerializer(vr).data})

        elif action == 'reject':
            reason = request.data.get('reason', '').strip()
            if not reason:
                return Response({'detail': 'Rejection reason is required.'}, status=status.HTTP_400_BAD_REQUEST)
            vr.status = VerificationRequest.STATUS_REJECTED
            vr.reviewed_by_id = admin_id
            vr.reviewed_at = now
            vr.rejection_reason = reason
            vr.save(update_fields=['status', 'reviewed_by_id', 'reviewed_at', 'rejection_reason'])
            return Response({'detail': 'Rejected.', 'request': VerificationRequestSerializer(vr).data})

        return Response({'detail': 'Unknown action.'}, status=status.HTTP_400_BAD_REQUEST)
