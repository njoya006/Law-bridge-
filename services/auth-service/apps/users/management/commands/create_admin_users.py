"""
Create admin and support accounts for the LawBridge team.
Run: python manage.py create_admin_users

These users can log in at /auth/login and access the Admin Console at /admin
"""
from django.core.management.base import BaseCommand
from apps.users.models import User


ADMIN_USERS = [
    # (email, full_name, role, password)
    # CEO / COO — full admin access
    ("praise@lawbridge.cm",    "Praise Njoya Medin",  "admin",   "LBAdmin@2026"),
    ("ceo@lawbridge.cm",       "LawBridge CEO",       "admin",   "LBAdmin@2026"),
    # Public Image & Business Development — support access
    ("outreach@lawbridge.cm",  "LawBridge Outreach",  "support", "LBTeam@2026"),
    ("pr@lawbridge.cm",        "PR Team",             "support", "LBTeam@2026"),
    # QA Engineer — support access
    ("qa@lawbridge.cm",        "QA Engineer",         "support", "LBTeam@2026"),
]


class Command(BaseCommand):
    help = "Create admin and support accounts for the LawBridge team"

    def handle(self, *args, **options):
        self.stdout.write("\nCreating LawBridge admin accounts...\n")
        for email, full_name, role, password in ADMIN_USERS:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"full_name": full_name, "role": role},
            )
            if created:
                user.set_password(password)
                user.is_active = True
                user.save()
                self.stdout.write(self.style.SUCCESS(f"  ✓ Created  {email}  [{role}]"))
            else:
                # Update role and password if user already exists
                user.role = role
                user.full_name = full_name
                user.set_password(password)
                user.save()
                self.stdout.write(self.style.WARNING(f"  ~ Updated  {email}  [{role}]"))

        self.stdout.write(self.style.SUCCESS(
            "\n✅ Done! Admin users are ready.\n\n"
            "  Admin login credentials:\n"
            "  ─────────────────────────────────────────────\n"
            "  Email:    praise@lawbridge.cm\n"
            "  Password: LBAdmin@2026\n"
            "  URL:      https://your-domain.com/auth/login\n"
            "            then go to /admin\n"
            "  ─────────────────────────────────────────────\n"
            "  Support team:  outreach@lawbridge.cm / LBTeam@2026\n"
            "                 pr@lawbridge.cm       / LBTeam@2026\n"
            "                 qa@lawbridge.cm       / LBTeam@2026\n"
        ))
