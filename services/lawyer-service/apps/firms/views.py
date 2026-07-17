from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse
from django.conf import settings
from io import BytesIO
from .models import Firm, FirmMembership, Invite, FirmActionLog, FirmPartnershipPolicy, PartnershipRequest, FirmGalleryImage
from .serializers import (
    FirmSerializer, FirmMembershipSerializer,
    InviteSerializer, FirmActionLogSerializer,
    FirmPartnershipPolicySerializer, PartnershipRequestSerializer,
    FirmGalleryImageSerializer,
)
from django.contrib.auth import get_user_model

User = get_user_model()


def _minio_client():
    from minio import Minio
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_USE_SSL,
    )


def _ensure_bucket(client):
    bucket = settings.MINIO_BUCKET_NAME
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
    return bucket


def user_has_firm_admin(user, firm):
    try:
        mem = FirmMembership.objects.get(user=user, firm=firm)
        return mem.role in ('owner', 'firm_admin')
    except FirmMembership.DoesNotExist:
        return False


def is_internal_request(request):
    from django.conf import settings
    return request.headers.get('X-Internal-Api-Key') == getattr(settings, 'INTERNAL_API_KEY', 'dev-internal-key')


def _actor_info(request):
    """Return (uuid_str, email) for the authenticated user from JWT payload."""
    payload = getattr(request, 'auth_payload', {})
    uid = str(payload.get('user_id') or payload.get('sub') or '')
    email = payload.get('email') or getattr(request.user, 'email', '')
    return uid, email


def _log_action(firm, request, action, target_email='', old_role='', new_role='', reason=''):
    uid, email = _actor_info(request)
    FirmActionLog.objects.create(
        firm=firm,
        performed_by_id=uid,
        performed_by_email=email,
        action=action,
        target_email=target_email,
        old_role=old_role,
        new_role=new_role,
        reason=reason,
    )


class FirmMembersView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, firm_id):
        # Require either a valid JWT (authenticated user) or internal service key
        has_jwt = bool(getattr(request, 'auth_payload', None))
        if not has_jwt and not is_internal_request(request):
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        firm = get_object_or_404(Firm, id=firm_id)
        members = FirmMembership.objects.filter(firm=firm, is_active=True).select_related('user')
        serializer = FirmMembershipSerializer(members, many=True)
        return Response(serializer.data)


def _resolve_member_uuid(member):
    """Return the auth-service UUID for a firm member.
    Uses cached user_uuid if present; otherwise queries auth-service by email and backfills."""
    import uuid as _uuid
    if member.user_uuid:
        return str(member.user_uuid)
    email = member.user.email
    if not email:
        return None
    try:
        import urllib.request as _req, json as _json
        from django.conf import settings as _s
        auth_url = getattr(_s, 'AUTH_SERVICE_URL', 'http://auth-service/api/v1/auth')
        url = f"{auth_url.rstrip('/')}/users/?email={email}"
        with _req.urlopen(_req.Request(url), timeout=3) as resp:
            data = _json.loads(resp.read())
            uid_str = str(data.get('id', ''))
            if uid_str:
                try:
                    member.user_uuid = _uuid.UUID(uid_str)
                    member.save(update_fields=['user_uuid'])
                except Exception:
                    pass
                return uid_str
    except Exception:
        pass
    return None


class FirmLawyersView(APIView):
    """GET /api/v1/firms/{firm_id}/lawyers/ — members with LawyerProfile enrichment where available."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, firm_id):
        from apps.lawyers.models import LawyerProfile
        from apps.discovery.serializers import LawyerDiscoverySerializer
        firm = get_object_or_404(Firm, id=firm_id)
        members = list(FirmMembership.objects.filter(firm=firm, is_active=True).select_related('user'))

        # Build uuid→member map for all active members
        uuid_to_member = {}
        for m in members:
            uid = _resolve_member_uuid(m)
            if uid:
                uuid_to_member[uid] = m

        # Members WITH a LawyerProfile — return full rich data
        profiles = LawyerProfile.objects.filter(user_id__in=list(uuid_to_member.keys()))
        profiled_uuids = {str(p.user_id) for p in profiles}
        result = list(LawyerDiscoverySerializer(profiles, many=True).data)

        # Members WITHOUT a LawyerProfile — return basic stub so team isn't empty
        for uid, m in uuid_to_member.items():
            if str(uid) not in profiled_uuids:
                result.append({
                    'id': uid,
                    'name': m.user.get_full_name() or m.user.email.split('@')[0],
                    'email': m.user.email,
                    'firm_name': firm.name,
                    'role': m.role,
                    'specialization': m.role.replace('_', ' ').title(),
                    'bio': '',
                    'years_of_experience': 0,
                    'consultation_fee': None,
                    'average_rating': 0,
                    'rating_count': 0,
                    'active_cases': 0,
                    'is_verified': False,
                    'availability_status': 'available',
                    'accepts_urgent_cases': False,
                    'practice_circuit': '',
                    'is_stub': True,
                })

        return Response(result)


class FirmBrowseView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.db.models import Count, Q, F
        name = request.query_params.get('q', '').strip()
        verified_only = request.query_params.get('verified_only') == 'true'
        query = Firm.objects.annotate(
            member_count=Count('members', filter=Q(members__is_active=True))
        )
        if name:
            query = query.filter(name__icontains=name)
        if verified_only:
            query = query.filter(verified_at__isnull=False)
        # Verified firms surface first, then alphabetical
        query = query.order_by(F('verified_at').desc(nulls_last=True), 'name')
        paginator = StandardPagination()
        page = paginator.paginate_queryset(query, request)
        results = [{**FirmSerializer(firm).data, 'member_count': firm.member_count} for firm in page]
        return paginator.get_paginated_response(results)


class FirmSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.db.models import Count, Q, F
        name = request.query_params.get('q', '').strip()
        query = Firm.objects.annotate(
            member_count=Count('members', filter=Q(members__is_active=True))
        )
        if name:
            query = query.filter(name__icontains=name)
        query = query.order_by(F('verified_at').desc(nulls_last=True), 'name')
        paginator = StandardPagination()
        page = paginator.paginate_queryset(query, request)
        results = [{**FirmSerializer(firm).data, 'member_count': firm.member_count} for firm in page]
        return paginator.get_paginated_response(results)


class MyFirmMembershipsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        memberships = FirmMembership.objects.filter(user=request.user, is_active=True).select_related('firm')
        serializer = FirmMembershipSerializer(memberships, many=True)
        return Response(serializer.data)


class FirmCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        name = (request.data.get('name') or '').strip()
        if not name:
            return Response({'detail': 'name is required'}, status=status.HTTP_400_BAD_REQUEST)
        if Firm.objects.filter(name__iexact=name).exists():
            return Response({'detail': 'Firm already exists'}, status=status.HTTP_400_BAD_REQUEST)
        firm = Firm.objects.create(name=name)
        uid, _ = _actor_info(request)
        FirmMembership.objects.create(
            user=request.user,
            firm=firm,
            role='owner',
            invited_by=request.user,
            invited_email=request.user.email,
            accepted_at=timezone.now(),
            is_active=True,
            user_uuid=uid or None,
        )
        return Response(FirmSerializer(firm).data, status=status.HTTP_201_CREATED)


class UserFirmMembershipsView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id):
        if not is_internal_request(request):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        memberships = FirmMembership.objects.filter(user_uuid=user_id, is_active=True).select_related('firm')
        serializer = FirmMembershipSerializer(memberships, many=True)
        return Response(serializer.data)


class InviteCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        if not user_has_firm_admin(request.user, firm):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        email = (request.data.get('email') or '').strip().lower()
        role = request.data.get('role', 'associate')
        note = (request.data.get('note') or '').strip()

        if not email:
            return Response({'detail': 'email is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent re-inviting an active member
        try:
            invited_user = User.objects.get(email=email)
            if FirmMembership.objects.filter(user=invited_user, firm=firm, is_active=True).exists():
                return Response(
                    {'detail': 'This person is already an active member of the firm.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except User.DoesNotExist:
            invited_user = None

        # Validate invitee is a registered lawyer (not a client)
        if email:
            try:
                import httpx
                r = httpx.get('http://auth-service:8001/api/v1/auth/users/', params={'email': email}, timeout=5.0)
                if r.status_code == 404:
                    return Response({'detail': 'No lawyer account found with that email address.'}, status=status.HTTP_400_BAD_REQUEST)
                r.raise_for_status()
                user_data = r.json()
                if user_data.get('role') == 'client':
                    return Response({'detail': 'Invitee must be registered as a lawyer or staff account, not a client.'}, status=status.HTTP_400_BAD_REQUEST)
            except httpx.HTTPError:
                return Response({'detail': 'Could not verify the invitee — auth service unavailable. Try again shortly.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        serializer = InviteSerializer(data={'email': email, 'role': role})
        if serializer.is_valid():
            invite = serializer.save(firm=firm)
            if invited_user:
                FirmMembership.objects.get_or_create(
                    user=invited_user,
                    firm=firm,
                    defaults={
                        'role': role,
                        'invited_by': request.user,
                        'invited_email': email,
                        'is_active': False,
                    },
                )
            _log_action(firm, request, 'invite_sent', target_email=email, new_role=role, reason=note)
            return Response(InviteSerializer(invite).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FirmPendingInvitesView(APIView):
    """List pending (not yet accepted) invites for a firm — admin only."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        if not user_has_firm_admin(request.user, firm):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        pending = Invite.objects.filter(firm=firm, accepted_at__isnull=True).order_by('-created_at')
        return Response(InviteSerializer(pending, many=True).data)


class InviteCancelView(APIView):
    """DELETE /api/v1/firms/<firm_id>/invites/<token>/ — cancel a pending invite (admin only)."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, firm_id, token):
        firm = get_object_or_404(Firm, id=firm_id)
        if not user_has_firm_admin(request.user, firm):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        invite = get_object_or_404(Invite, firm=firm, token=token, accepted_at__isnull=True)
        email = invite.email
        invite.delete()
        # Remove the pending (inactive) membership that was pre-created for this invitee
        try:
            invitee = User.objects.get(email=email)
            FirmMembership.objects.filter(user=invitee, firm=firm, is_active=False).delete()
        except User.DoesNotExist:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class FirmActionLogView(APIView):
    """Activity/audit log for a firm — admin only."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        if not user_has_firm_admin(request.user, firm):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        logs = FirmActionLog.objects.filter(firm=firm).order_by('-created_at')[:100]
        return Response(FirmActionLogSerializer(logs, many=True).data)


class FirmLogoUploadView(APIView):
    """POST /api/v1/firms/<firm_id>/logo/ — upload or replace firm logo (admin only)."""

    def post(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        if not user_has_firm_admin(request.user, firm):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get('logo')
        if not file:
            return Response({'detail': 'logo file is required (multipart field: logo)'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = {'image/jpeg', 'image/png', 'image/webp'}
        if file.content_type not in allowed_types:
            return Response({'detail': 'Only JPEG, PNG, or WebP images are accepted.'}, status=status.HTTP_400_BAD_REQUEST)

        if file.size > 5 * 1024 * 1024:
            return Response({'detail': 'Image must be under 5 MB.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from PIL import Image
            img = Image.open(file).convert('RGB')
            img.thumbnail((512, 512), Image.LANCZOS)
            buf = BytesIO()
            img.save(buf, format='JPEG', quality=85, optimize=True)
            data = buf.getvalue()
        except Exception:
            return Response({'detail': 'Could not process the image.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            object_name = f'firm-logos/{firm.id}.jpg'
            client = _minio_client()
            bucket = _ensure_bucket(client)
            client.put_object(bucket, object_name, BytesIO(data), len(data), content_type='image/jpeg')
        except Exception as exc:
            return Response({'detail': f'Storage error: {exc}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        firm.logo = object_name
        firm.save(update_fields=['logo'])
        return Response({'logo_url': f'/api/v1/firms/logo/{firm.id}/'}, status=status.HTTP_200_OK)


class FirmLogoServeView(APIView):
    """GET /api/v1/firms/logo/<firm_id>/ — serve firm logo (public, no auth)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        if not firm.logo:
            return Response({'detail': 'No logo set for this firm.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            client = _minio_client()
            obj = client.get_object(settings.MINIO_BUCKET_NAME, firm.logo)
            data = obj.read()
            content_type = obj.headers.get('content-type', 'image/jpeg')
            response = HttpResponse(data, content_type=content_type)
            response['Cache-Control'] = 'public, max-age=86400'
            return response
        except Exception:
            return Response({'detail': 'Logo not found.'}, status=status.HTTP_404_NOT_FOUND)


class FirmDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        return Response({
            **FirmSerializer(firm).data,
            'member_count': FirmMembership.objects.filter(firm=firm, is_active=True).count(),
        })

    def patch(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        if not request.user.is_authenticated or not user_has_firm_admin(request.user, firm):
            return Response({'error': 'Firm admin access required'}, status=403)
        serializer = FirmSerializer(firm, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class InviteAcceptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, token):
        invite = get_object_or_404(Invite, token=token)
        if invite.accepted_at:
            return Response({'detail': 'This invite has already been accepted.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check expiry
        if invite.expires_at and invite.expires_at < timezone.now():
            return Response({'detail': 'This invite has expired. Please ask a firm admin to send a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        payload = getattr(request, 'auth_payload', None)
        if not payload or payload.get('role') == 'client':
            return Response({'detail': 'Only lawyer/staff accounts may accept firm invites.'}, status=status.HTTP_403_FORBIDDEN)

        firm = invite.firm
        uid, _ = _actor_info(request)
        membership, created = FirmMembership.objects.get_or_create(
            user=request.user,
            firm=firm,
            defaults={
                'role': invite.role,
                'invited_by': getattr(invite, 'invited_by', None),
                'invited_email': invite.email,
                'accepted_at': timezone.now(),
                'user_uuid': uid or None,
            },
        )
        if not created:
            membership.role = invite.role
            membership.accepted_at = timezone.now()
            membership.is_active = True
            if uid:
                membership.user_uuid = uid
            membership.save()

        invite.accepted_at = timezone.now()
        invite.save()

        _log_action(firm, request, 'invite_accepted', target_email=invite.email, new_role=invite.role)
        return Response({
            **FirmMembershipSerializer(membership).data,
            'firm_name': firm.name,
        })


class MemberRoleUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, member_id):
        membership = get_object_or_404(FirmMembership, id=member_id)
        firm = membership.firm
        if not user_has_firm_admin(request.user, firm):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        # Cannot change the role of the firm owner (only the owner can demote themselves)
        if membership.role == 'owner':
            try:
                actor_mem = FirmMembership.objects.get(user=request.user, firm=firm)
                if actor_mem.role != 'owner':
                    return Response(
                        {'detail': 'Only the firm owner can change their own role.'},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except FirmMembership.DoesNotExist:
                return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        new_role = request.data.get('role')
        if new_role not in dict(FirmMembership.ROLE_CHOICES):
            return Response({'detail': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = (request.data.get('reason') or '').strip()
        if not reason:
            return Response({'detail': 'A reason is required when changing a member\'s role.'}, status=status.HTTP_400_BAD_REQUEST)

        old_role = membership.role
        target_email = membership.user.email if membership.user else (membership.invited_email or '')

        membership.role = new_role
        membership.save()

        _log_action(firm, request, 'role_changed', target_email=target_email,
                    old_role=old_role, new_role=new_role, reason=reason)

        return Response(FirmMembershipSerializer(membership).data)


class MemberAssignFirmView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, member_id):
        membership = get_object_or_404(FirmMembership, id=member_id)
        firm = membership.firm
        if not user_has_firm_admin(request.user, firm):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        new_firm_id = request.data.get('firm')
        if not new_firm_id:
            membership.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        new_firm = get_object_or_404(Firm, id=new_firm_id)
        membership.firm = new_firm
        membership.save()
        return Response(FirmMembershipSerializer(membership).data)


class MemberDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, member_id):
        membership = get_object_or_404(FirmMembership, id=member_id)
        firm = membership.firm

        if not user_has_firm_admin(request.user, firm):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        # Cannot remove the owner
        if membership.role == 'owner':
            return Response(
                {'detail': 'The firm owner cannot be removed. Transfer ownership first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Cannot remove yourself — use account settings to leave
        if membership.user == request.user:
            return Response(
                {'detail': 'You cannot remove yourself. Use account settings to leave the firm.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = (request.data.get('reason') or '').strip()
        if not reason or len(reason) < 10:
            return Response(
                {'detail': 'A reason of at least 10 characters is required to remove a member.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_email = membership.user.email if membership.user else (membership.invited_email or '')
        old_role = membership.role

        membership.delete()

        _log_action(firm, request, 'member_removed', target_email=target_email,
                    old_role=old_role, reason=reason)

        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Partnership policy ─────────────────────────────────────────────────────────

class FirmPartnershipPolicyView(APIView):
    """GET/PUT /api/v1/firms/{firm_id}/partnership-policy/"""
    permission_classes = [permissions.AllowAny]

    def _get_firm_and_check_admin(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        if not user_has_firm_admin(request.user, firm):
            return firm, False
        return firm, True

    def get(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        policy, _ = FirmPartnershipPolicy.objects.get_or_create(firm=firm)
        return Response(FirmPartnershipPolicySerializer(policy).data)

    def put(self, request, firm_id):
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        firm, is_admin = self._get_firm_and_check_admin(request, firm_id)
        if not is_admin:
            return Response({'error': 'Only firm admins can update the partnership policy'}, status=403)
        policy, _ = FirmPartnershipPolicy.objects.get_or_create(firm=firm)
        serializer = FirmPartnershipPolicySerializer(policy, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


# ── Partnership requests ───────────────────────────────────────────────────────

class PartnershipRequestCreateView(APIView):
    """POST /api/v1/firms/{firm_id}/partnership-request/ — request to partner with a firm."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, firm_id):
        target_firm = get_object_or_404(Firm, id=firm_id)
        uid, _ = _actor_info(request)

        # Requesting user must belong to a firm
        my_memberships = FirmMembership.objects.filter(
            user=request.user, is_active=True,
            role__in=['owner', 'firm_admin', 'partner'],
        ).select_related('firm').first()
        if not my_memberships:
            return Response({'error': 'You must belong to a firm with a partner or admin role to send a partnership request'}, status=403)

        requesting_firm = my_memberships.firm
        if requesting_firm.id == target_firm.id:
            return Response({'error': 'You cannot partner with your own firm'}, status=400)

        # Check if the target firm's policy allows partnerships
        policy, _ = FirmPartnershipPolicy.objects.get_or_create(firm=target_firm)
        if not policy.is_open:
            return Response({'error': f'{target_firm.name} is not currently accepting partnership requests'}, status=400)

        message = (request.data.get('message') or '').strip()
        req_obj, created = PartnershipRequest.objects.get_or_create(
            requesting_firm=requesting_firm,
            target_firm=target_firm,
            defaults={'requested_by_id': uid, 'message': message},
        )
        if not created:
            if req_obj.status in ('approved',):
                return Response({'error': 'A partnership already exists between these firms'}, status=400)
            # Re-open a rejected request
            req_obj.status = 'pending'
            req_obj.message = message
            req_obj.requested_by_id = uid
            req_obj.save()
        return Response(PartnershipRequestSerializer(req_obj).data, status=201 if created else 200)


class PartnershipRequestListView(APIView):
    """GET /api/v1/firms/{firm_id}/partnership-requests/ — list incoming requests (firm admin only)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        if not user_has_firm_admin(request.user, firm):
            return Response({'error': 'Firm admin access required'}, status=403)
        requests_qs = PartnershipRequest.objects.filter(target_firm=firm).select_related('requesting_firm')
        return Response(PartnershipRequestSerializer(requests_qs, many=True).data)


class PartnershipRequestRespondView(APIView):
    """PATCH /api/v1/firms/partnership-requests/{pk}/ — approve or reject."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        req_obj = get_object_or_404(PartnershipRequest, id=pk)
        if not user_has_firm_admin(request.user, req_obj.target_firm):
            return Response({'error': 'Only an admin of the target firm can respond to this request'}, status=403)
        new_status = (request.data.get('status') or '').strip()
        if new_status not in ('under_review', 'approved', 'rejected'):
            return Response({'error': 'status must be under_review, approved, or rejected'}, status=400)
        uid, _ = _actor_info(request)
        req_obj.status = new_status
        req_obj.response_note = (request.data.get('response_note') or '').strip()
        req_obj.responded_by_id = uid
        req_obj.save()
        return Response(PartnershipRequestSerializer(req_obj).data)


# ── Firm Gallery ───────────────────────────────────────────────────────────────

class FirmGalleryView(APIView):
    """GET/POST /api/v1/firms/{firm_id}/gallery/"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        images = FirmGalleryImage.objects.filter(firm=firm)
        return Response(FirmGalleryImageSerializer(images, many=True).data)

    def post(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        payload = getattr(request, 'auth_payload', None)
        if not payload:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        if not user_has_firm_admin(request.user, firm):
            return Response({'detail': 'Firm admin access required'}, status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get('image')
        if not file:
            return Response({'detail': 'image file is required (multipart field: image)'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = {'image/jpeg', 'image/png', 'image/webp'}
        if file.content_type not in allowed_types:
            return Response({'detail': 'Only JPEG, PNG, or WebP images are accepted.'}, status=status.HTTP_400_BAD_REQUEST)

        if file.size > 10 * 1024 * 1024:
            return Response({'detail': 'Image must be under 10 MB.'}, status=status.HTTP_400_BAD_REQUEST)

        if FirmGalleryImage.objects.filter(firm=firm).count() >= 20:
            return Response({'detail': 'Maximum 20 gallery images per firm.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from PIL import Image
            img = Image.open(file).convert('RGB')
            img.thumbnail((1920, 1920), Image.LANCZOS)
            buf = BytesIO()
            img.save(buf, format='JPEG', quality=85, optimize=True)
            data = buf.getvalue()
        except Exception:
            return Response({'detail': 'Could not process the image.'}, status=status.HTTP_400_BAD_REQUEST)

        import uuid as _uuid
        object_name = f'firm-gallery/{firm.id}/{_uuid.uuid4()}.jpg'
        try:
            client = _minio_client()
            bucket = _ensure_bucket(client)
            client.put_object(bucket, object_name, BytesIO(data), len(data), content_type='image/jpeg')
        except Exception as exc:
            return Response({'detail': f'Storage error: {exc}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        caption = (request.data.get('caption') or '').strip()
        order = FirmGalleryImage.objects.filter(firm=firm).count()
        gallery_image = FirmGalleryImage.objects.create(
            firm=firm,
            image_url=object_name,
            caption=caption,
            order=order,
        )
        return Response(FirmGalleryImageSerializer(gallery_image).data, status=status.HTTP_201_CREATED)


class FirmGalleryImageServeView(APIView):
    """GET /api/v1/firms/gallery/<image_id>/ — serve a gallery image (public)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, image_id):
        gallery_image = get_object_or_404(FirmGalleryImage, id=image_id)
        try:
            client = _minio_client()
            obj = client.get_object(settings.MINIO_BUCKET_NAME, gallery_image.image_url)
            data = obj.read()
            content_type = obj.headers.get('content-type', 'image/jpeg')
            response = HttpResponse(data, content_type=content_type)
            response['Cache-Control'] = 'public, max-age=86400'
            return response
        except Exception:
            return Response({'detail': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)


class FirmGalleryImageDeleteView(APIView):
    """DELETE /api/v1/firms/{firm_id}/gallery/{image_id}/"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, firm_id, image_id):
        firm = get_object_or_404(Firm, id=firm_id)
        if not user_has_firm_admin(request.user, firm):
            return Response({'detail': 'Firm admin access required'}, status=status.HTTP_403_FORBIDDEN)
        gallery_image = get_object_or_404(FirmGalleryImage, id=image_id, firm=firm)
        try:
            client = _minio_client()
            client.remove_object(settings.MINIO_BUCKET_NAME, gallery_image.image_url)
        except Exception:
            pass
        gallery_image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
