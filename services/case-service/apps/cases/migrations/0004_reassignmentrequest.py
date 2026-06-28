from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0003_case_application'),
    ]

    operations = [
        migrations.CreateModel(
            name='ReassignmentRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('client_id', models.CharField(max_length=64)),
                ('reason_code', models.CharField(choices=[
                    ('unresponsive', 'Lawyer is unresponsive'),
                    ('slow_progress', 'Case progress is too slow'),
                    ('unprofessional', 'Unprofessional conduct'),
                    ('lack_expertise', 'Lack of required expertise'),
                    ('breach_agreement', 'Breach of engagement agreement'),
                    ('communication', 'Poor communication'),
                    ('personal_reasons', 'Personal / conflict of interest'),
                    ('other', 'Other'),
                ], max_length=32)),
                ('reason_detail', models.TextField()),
                ('performance_rating', models.PositiveSmallIntegerField(default=3)),
                ('conflict_flags', models.JSONField(default=dict)),
                ('status', models.CharField(choices=[
                    ('pending_review', 'Pending Conflict Review'),
                    ('mediation_window', 'Mediation Window Open'),
                    ('approved', 'Reassignment Approved'),
                    ('searching', 'Searching for New Lawyer'),
                    ('transferring', 'Transfer in Progress'),
                    ('completed', 'Transfer Complete'),
                    ('cancelled', 'Cancelled by Client'),
                    ('resolved', 'Resolved — No Transfer'),
                    ('blocked', 'Blocked — Cannot Reassign'),
                ], default='pending_review', max_length=32)),
                ('mediation_deadline', models.DateTimeField(blank=True, null=True)),
                ('lawyer_response', models.TextField(blank=True)),
                ('lawyer_responded_at', models.DateTimeField(blank=True, null=True)),
                ('selected_lawyer_id', models.UUIDField(blank=True, null=True)),
                ('handoff_summary', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('case', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='reassignment_requests',
                    to='cases.case',
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
