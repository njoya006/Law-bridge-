from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('user_id', models.UUIDField()),
                ('event_type', models.CharField(choices=[('case_updated', 'Case Updated'), ('case_assigned', 'Case Assigned'), ('deadline_missed', 'Deadline Missed'), ('hearing_scheduled', 'Hearing Scheduled'), ('payment_confirmed', 'Payment Confirmed'), ('document_uploaded', 'Document Uploaded'), ('analysis_ready', 'Analysis Ready')], max_length=50)),
                ('title_en', models.CharField(max_length=255)),
                ('title_fr', models.CharField(max_length=255)),
                ('message_en', models.TextField()),
                ('message_fr', models.TextField()),
                ('metadata', models.JSONField(default=dict)),
                ('read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='NotificationTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_type', models.CharField(max_length=50, unique=True)),
                ('template_en', models.TextField()),
                ('template_fr', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user_id', '-created_at'], name='notif_user_created_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user_id', 'read'], name='notif_user_read_idx'),
        ),
    ]