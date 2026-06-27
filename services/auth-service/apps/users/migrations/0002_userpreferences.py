from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserPreferences',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user_id', models.UUIDField(unique=True)),
                ('language', models.CharField(choices=[('en', 'English'), ('fr', 'Français')], default='en', max_length=8)),
                ('notify_case_updates', models.BooleanField(default=True)),
                ('notify_documents', models.BooleanField(default=True)),
                ('notify_messages', models.BooleanField(default=True)),
                ('notify_billing', models.BooleanField(default=True)),
                ('notify_reminders', models.BooleanField(default=True)),
                ('preferred_contact', models.CharField(
                    choices=[('email', 'Email'), ('phone', 'Phone'), ('in_app', 'In-App Messaging')],
                    default='email',
                    max_length=16,
                )),
                ('profile_visible', models.BooleanField(default=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
