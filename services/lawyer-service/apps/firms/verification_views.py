import uuid
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Firm, FirmMembership, FirmVerificationRequest
from .verification_serializers import FirmVerificationRequestSerializer, FirmVerificationSubmitSerializer

OWNER_ROLES = {'owner', 'firm_admin'}


def _get_user_id(request) -> str:
    return str(request.auth_payload.get('user_id', ''))


def _get_role(request) -> str:
    return request.auth_payload.get('role', '')


def _get_firm_for_user(user_id: str):
    """Return the Firm the user administers (owner or firm_admin role), or None."""
    membership = FirmMembership.objects.filter(
        user_uuid=user_id, role__in=OWNER_ROLES, is_active=True,
    ).select_related('firm').first()
    return membership.firm if membership else None


class FirmVerificationSubmitView(APIView):
    """
    GET  — firm owner checks their firm's verification status
    POST — firm owner submits or resubmits a verification request
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_id = _get_user_id(request)
        firm = _get_firm_for_user(user_id)
        if not firm:
            return Response({'detail': 'No firm found for this user.'}, status=status.HTTP_404_NOT_FOUND)

        is_verified = firm.verified_at is not None
        try:
            vr = FirmVerificationRequest.objects.get(firm=firm)
            return Response({'is_verified': is_verified, 'request': FirmVerificationRequestSerializer(vr).data})
        except FirmVerificationRequest.DoesNotExist:
            return Response({'is_verified': is_verified, 'request': None})

    def post(self, request):
        user_id = _get_user_id(request)
        firm = _get_firm_for_user(user_id)
        if not firm:
            return Response({'detail': 'No firm found. Only firm owners and admins can submit verification.'}, status=status.HTTP_404_NOT_FOUND)

        if firm.verified_at is not None:
            return Response({'detail': 'This firm is already verified.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = FirmVerificationSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        d = serializer.validated_data
        vr, created = FirmVerificationRequest.objects.update_or_create(
            firm=firm,
            defaults={
                'registration_number': d['registration_number'],
                'firm_type': d['firm_type'],
                'founding_year': d['founding_year'],
                'number_of_partners': d.get('number_of_partners', 1),
                'notes': d.get('notes', ''),
                'status': FirmVerificationRequest.STATUS_PENDING,
                'submitted_by_id': uuid.UUID(user_id),
                'rejection_reason': '',
            },
        )
        return Response(
            FirmVerificationRequestSerializer(vr).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class FirmVerificationQueueView(APIView):
    """GET — admin retrieves firm verification requests filtered by status."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if _get_role(request) != 'admin':
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        filter_status = request.query_params.get('status', 'pending')
        qs = FirmVerificationRequest.objects.select_related('firm')
        if filter_status in ('pending', 'approved', 'rejected'):
            qs = qs.filter(status=filter_status)

        return Response({'count': qs.count(), 'results': FirmVerificationRequestSerializer(qs, many=True).data})


class FirmVerificationActionView(APIView):
    """POST /firms/verification/{id}/approve|reject/ — admin decision."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, action):
        if _get_role(request) != 'admin':
            return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            vr = FirmVerificationRequest.objects.select_related('firm').get(pk=pk)
        except FirmVerificationRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if vr.status != FirmVerificationRequest.STATUS_PENDING:
            return Response({'detail': f'Request is already {vr.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        admin_id = _get_user_id(request)
        now = timezone.now()

        if action == 'approve':
            vr.status = FirmVerificationRequest.STATUS_APPROVED
            vr.reviewed_by_id = uuid.UUID(admin_id) if admin_id else None
            vr.reviewed_at = now
            vr.save(update_fields=['status', 'reviewed_by_id', 'reviewed_at'])
            vr.firm.verified_at = now
            vr.firm.save(update_fields=['verified_at'])
            return Response({'detail': 'Firm verified.', 'request': FirmVerificationRequestSerializer(vr).data})

        elif action == 'reject':
            reason = request.data.get('reason', '').strip()
            if not reason:
                return Response({'detail': 'Rejection reason is required.'}, status=status.HTTP_400_BAD_REQUEST)
            vr.status = FirmVerificationRequest.STATUS_REJECTED
            vr.reviewed_by_id = uuid.UUID(admin_id) if admin_id else None
            vr.reviewed_at = now
            vr.rejection_reason = reason
            vr.save(update_fields=['status', 'reviewed_by_id', 'reviewed_at', 'rejection_reason'])
            return Response({'detail': 'Rejected.', 'request': FirmVerificationRequestSerializer(vr).data})

        return Response({'detail': 'Unknown action.'}, status=status.HTTP_400_BAD_REQUEST)
