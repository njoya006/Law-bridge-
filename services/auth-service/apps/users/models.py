import uuid
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin
)


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=32, default='client')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class UserPreferences(models.Model):
    LANGUAGE_CHOICES = [('en', 'English'), ('fr', 'Français')]
    CONTACT_CHOICES = [
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('in_app', 'In-App Messaging'),
    ]

    user_id = models.UUIDField(unique=True)

    # Locale
    language = models.CharField(max_length=8, choices=LANGUAGE_CHOICES, default='en')

    # Notification toggles
    notify_case_updates = models.BooleanField(default=True)
    notify_documents = models.BooleanField(default=True)
    notify_messages = models.BooleanField(default=True)
    notify_billing = models.BooleanField(default=True)
    notify_reminders = models.BooleanField(default=True)

    # Communication preference
    preferred_contact = models.CharField(max_length=16, choices=CONTACT_CHOICES, default='email')

    # Privacy
    profile_visible = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Prefs({self.user_id})"
