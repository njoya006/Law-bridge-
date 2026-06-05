from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Firm, FirmMembership, Invite
from .serializers import FirmSerializer, FirmMembershipSerializer, InviteSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


def user_has_firm_admin(user, firm):
    try:
        mem = FirmMembership.objects.get(user=user, firm=firm)
        return mem.role in ('owner', 'firm_admin')
    except FirmMembership.DoesNotExist:
        return False


def is_internal_request(request):
    from django.conf import settings
    return request.headers.get('X-Internal-Api-Key') == getattr(settings, 'INTERNAL_API_KEY', 'dev-internal-key')


class FirmMembersView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        members = FirmMembership.objects.filter(firm=firm, is_active=True)
        serializer = FirmMembershipSerializer(members, many=True)
        return Response(serializer.data)


class FirmBrowseView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = Firm.objects.all().order_by('name')
        name = request.query_params.get('q', '').strip()
        if name:
            query = query.filter(name__icontains=name)

        results = []
        for firm in query:
            results.append({
                **FirmSerializer(firm).data,
                'member_count': FirmMembership.objects.filter(firm=firm, is_active=True).count(),
            })
        return Response({'count': len(results), 'results': results})


class FirmSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = Firm.objects.all().order_by('name')
        name = request.query_params.get('q', '').strip()
        if name:
            query = query.filter(name__icontains=name)

        results = []
        for firm in query:
            results.append({
                **FirmSerializer(firm).data,
                'member_count': FirmMembership.objects.filter(firm=firm, is_active=True).count(),
            })
        return Response({'count': len(results), 'results': results})


class MyFirmMembershipsView(APIView):
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
        FirmMembership.objects.create(
            user=request.user,
            firm=firm,
            role='owner',
            invited_by=request.user,
            invited_email=request.user.email,
            accepted_at=timezone.now(),
            is_active=True,
        )
        return Response(FirmSerializer(firm).data, status=status.HTTP_201_CREATED)


class UserFirmMembershipsView(APIView):
    # skip default authentication to allow internal API key checks
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id):
        if not is_internal_request(request):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        memberships = FirmMembership.objects.filter(user_id=user_id, is_active=True).select_related('firm')
        serializer = FirmMembershipSerializer(memberships, many=True)
        return Response(serializer.data)


class InviteCreateView(APIView):
    def post(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        if not user_has_firm_admin(request.user, firm):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        # server-side validation: ensure invitee is registered as a lawyer
        email = request.data.get('email')
        if email:
            try:
                import httpx
                auth_url = f"http://auth-service:8001/api/v1/auth/users/"
                r = httpx.get(auth_url, params={'email': email}, timeout=5.0)
                if r.status_code == 404:
                    return Response({'detail': 'Invitee not registered'}, status=status.HTTP_400_BAD_REQUEST)
                r.raise_for_status()
                user_data = r.json()
                if user_data.get('role') == 'client':
                    return Response({'detail': 'Invitee must be registered as a staff account to be invited'}, status=status.HTTP_400_BAD_REQUEST)
            except httpx.HTTPError:
                return Response({'detail': 'Failed to validate invitee'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        serializer = InviteSerializer(data=request.data)
        if serializer.is_valid():
            invite = serializer.save(firm=firm)
            # Optionally create a placeholder membership tied to invited_email
            if invite.email:
                try:
                    invited_user = User.objects.get(email=invite.email)
                except User.DoesNotExist:
                    invited_user = None

                if invited_user:
                    FirmMembership.objects.get_or_create(
                        user=invited_user,
                        firm=firm,
                        defaults={'role': invite.role, 'invited_by': request.user, 'invited_email': invite.email}
                    )

            return Response(InviteSerializer(invite).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FirmDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        return Response({
            **FirmSerializer(firm).data,
            'member_count': FirmMembership.objects.filter(firm=firm, is_active=True).count(),
        })


class InviteAcceptView(APIView):
    def post(self, request, token):
        invite = get_object_or_404(Invite, token=token)
        if invite.accepted_at:
            return Response({'detail': 'Invite already accepted'}, status=status.HTTP_400_BAD_REQUEST)
        # Only allow non-client staff accounts to accept firm invites
        payload = getattr(request, 'auth_payload', None)
        if not payload or payload.get('role') == 'client':
            return Response({'detail': 'Only staff accounts may accept firm invites'}, status=status.HTTP_403_FORBIDDEN)

        # create or activate membership for current user
        firm = invite.firm
        membership, created = FirmMembership.objects.get_or_create(
            user=request.user,
            firm=firm,
            defaults={
                'role': invite.role,
                'invited_by': getattr(invite, 'invited_by', None),
                'invited_email': invite.email,
                'accepted_at': timezone.now(),
            }
        )
        if not created:
            membership.role = invite.role
            membership.accepted_at = timezone.now()
            membership.is_active = True
            membership.save()

        invite.accepted_at = timezone.now()
        invite.save()
        return Response(FirmMembershipSerializer(membership).data)


class MemberRoleUpdateView(APIView):
    def patch(self, request, member_id):
        membership = get_object_or_404(FirmMembership, id=member_id)
        firm = membership.firm
        if not user_has_firm_admin(request.user, firm):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        role = request.data.get('role')
        if role not in dict(FirmMembership.ROLE_CHOICES):
            return Response({'detail': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

        membership.role = role
        membership.save()
        return Response(FirmMembershipSerializer(membership).data)


class MemberAssignFirmView(APIView):
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
    def delete(self, request, member_id):
        membership = get_object_or_404(FirmMembership, id=member_id)
        firm = membership.firm
        if not user_has_firm_admin(request.user, firm):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
