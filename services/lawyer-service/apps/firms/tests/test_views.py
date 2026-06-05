from unittest.mock import MagicMock, patch

from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from apps.firms.models import Firm, FirmMembership

User = get_user_model()


class FirmsAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='admin', email='admin@example.com', password='pass123')
        self.user2 = User.objects.create_user(username='member', email='member@example.com', password='pass123')
        self.firm = Firm.objects.create(name='Test Firm')
        # make user an owner
        FirmMembership.objects.create(user=self.user, firm=self.firm, role='owner')
        self.client.force_authenticate(self.user)

    def test_get_members_requires_auth(self):
        url = f'/api/v1/firms/{self.firm.id}/members/'
        r = self.client.get(url)
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_get_my_memberships(self):
        url = '/api/v1/firms/me/'
        r = self.client.get(url)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()), 1)
        self.assertEqual(r.json()[0]['firm'], self.firm.id)

    @patch('httpx.get')
    def test_invite_create_by_admin(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {'role': 'lawyer'}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp
        url = f'/api/v1/firms/{self.firm.id}/invites/'
        data = {'email': 'invitee@example.com', 'role': 'associate'}
        r = self.client.post(url, data)
        self.assertEqual(r.status_code, 201)

    def test_invite_create_forbidden_for_non_admin(self):
        self.client.force_authenticate(self.user2)
        url = f'/api/v1/firms/{self.firm.id}/invites/'
        data = {'email': 'invitee@example.com', 'role': 'associate'}
        r = self.client.post(url, data)
        self.assertEqual(r.status_code, 403)

    @patch('httpx.get')
    def test_invite_rejects_invalid_role(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {'role': 'lawyer'}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp
        url = f'/api/v1/firms/{self.firm.id}/invites/'
        data = {'email': 'invitee@example.com', 'role': 'not-a-role'}
        r = self.client.post(url, data)
        self.assertEqual(r.status_code, 400)

    def test_member_role_update(self):
        mem = FirmMembership.objects.create(user=self.user2, firm=self.firm, role='associate')
        url = f'/api/v1/firms/members/{mem.id}/role/'
        r = self.client.patch(url, {'role': 'partner'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json().get('role'), 'partner')

    def test_member_unassign_deletes_membership(self):
        mem = FirmMembership.objects.create(user=self.user2, firm=self.firm, role='associate')
        url = f'/api/v1/firms/members/{mem.id}/firm/'
        r = self.client.patch(url, {}, format='json')
        self.assertEqual(r.status_code, 204)
        self.assertFalse(FirmMembership.objects.filter(id=mem.id).exists())
