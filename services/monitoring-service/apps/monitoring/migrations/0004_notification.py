from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('monitoring', '0003_add_report_request'),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('recipient_id', models.UUIDField(db_index=True)),
                ('notification_type', models.CharField(
                    choices=[
                        ('case_created', 'Case Submitted'),
                        ('case_assigned', 'Case Assigned'),
                        ('case_updated', 'Case Status Updated'),
                        ('case_closed', 'Case Closed'),
                        ('case_rejected', 'Case Rejected'),
                        ('booking_received', 'Booking Received'),
                        ('verification_approved', 'Verification Approved'),
                        ('verification_rejected', 'Verification Rejected'),
                        ('review_received', 'New Review'),
                    ],
                    db_index=True, max_length=40,
                )),
                ('title', models.CharField(max_length=200)),
                ('body', models.TextField(blank=True)),
                ('case_id', models.CharField(blank=True, max_length=64)),
                ('is_read', models.BooleanField(db_index=True, default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['recipient_id', 'is_read'], name='notif_recip_read_idx'),
        ),
    ]
