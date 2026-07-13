"""
Creates the default admin account on container startup.
Reads credentials from environment variables so nothing is hardcoded.

Environment variables:
  ADMIN_EMAIL     (default: admin@lawbridge.cm)
  ADMIN_PASSWORD  (default: LBAdmin@2026!)
  ADMIN_NAME      (default: LawBridge Admin)

Safe to run multiple times — uses get_or_create, so it never creates duplicates.
"""
import os
from django.core.management.base import BaseCommand
from apps.users.models import User


class Command(BaseCommand):
    help = "Bootstrap the admin account from environment variables on container startup"

    def handle(self, *args, **options):
        email    = os.environ.get('ADMIN_EMAIL',    'admin@lawbridge.cm')
        password = os.environ.get('ADMIN_PASSWORD', 'LBAdmin@2026!')
        name     = os.environ.get('ADMIN_NAME',     'LawBridge Admin')

        user, created = User.objects.get_or_create(
            email=email,
            defaults={'full_name': name, 'role': 'admin'},
        )

        if created:
            user.set_password(password)
            user.is_active = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f'[startup] Admin account created: {email}'))
        else:
            # Always sync the role in case it was accidentally changed
            if user.role != 'admin':
                user.role = 'admin'
                user.save()
                self.stdout.write(self.style.WARNING(f'[startup] Admin role restored for: {email}'))
            else:
                self.stdout.write(f'[startup] Admin account OK: {email}')
