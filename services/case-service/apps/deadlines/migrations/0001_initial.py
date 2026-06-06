import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Deadline',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('case_id', models.UUIDField(db_index=True)),
                ('deadline_type', models.CharField(
                    choices=[
                        ('hearing', 'Court Hearing'),
                        ('filing', 'Document Filing'),
                        ('response', 'Defendant Response'),
                        ('evidence', 'Evidence Submission'),
                        ('appeal', 'Appeal Deadline'),
                        ('other', 'Other'),
                    ],
                    max_length=32,
                )),
                ('due_date', models.DateTimeField()),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('approaching', 'Approaching (< 48hr)'),
                        ('missed', 'Missed'),
                        ('completed', 'Completed'),
                    ],
                    default='pending',
                    max_length=32,
                )),
                ('description', models.TextField(blank=True)),
                ('assigned_to', models.UUIDField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('notified_at', models.DateTimeField(blank=True, null=True)),
                ('escalated_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'ordering': ['due_date'],
            },
        ),
        migrations.AddIndex(
            model_name='deadline',
            index=models.Index(fields=['case_id', 'status'], name='deadlines_case_status_idx'),
        ),
        migrations.AddIndex(
            model_name='deadline',
            index=models.Index(fields=['due_date'], name='deadlines_due_date_idx'),
        ),
        migrations.AddIndex(
            model_name='deadline',
            index=models.Index(fields=['status'], name='deadlines_status_idx'),
        ),
    ]
