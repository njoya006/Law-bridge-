from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='CalendarEvent',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('case_id', models.UUIDField()),
                ('event_type', models.CharField(choices=[('hearing', 'Hearing'), ('meeting', 'Meeting'), ('verdict', 'Verdict')], max_length=20)),
                ('date', models.DateField()),
                ('time', models.TimeField()),
                ('location', models.CharField(max_length=255)),
                ('virtual_link', models.URLField(blank=True, null=True)),
                ('initiator_id', models.UUIDField()),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('reschedule_proposed', 'Reschedule Proposed'), ('confirmed', 'Confirmed'), ('cancelled', 'Cancelled')], default='pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['date', 'time'],
            },
        ),
        migrations.CreateModel(
            name='Alarm',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('alarm_type', models.CharField(choices=[('48hr', '48 Hours'), ('1hr', '1 Hour')], max_length=10)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('sent', 'Sent'), ('failed', 'Failed')], default='pending', max_length=10)),
                ('scheduled_for', models.DateTimeField()),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='alarms', to='calendar.calendarevent')),
            ],
            options={
                'ordering': ['scheduled_for'],
            },
        ),
        migrations.CreateModel(
            name='EventApproval',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('approver_id', models.UUIDField()),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='approvals', to='calendar.calendarevent')),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='eventapproval',
            unique_together={('event', 'approver_id')},
        ),
        migrations.AddIndex(
            model_name='calendarevent',
            index=models.Index(fields=['case_id', 'status'], name='calendar_c_case_id_8d4ee3_idx'),
        ),
        migrations.AddIndex(
            model_name='calendarevent',
            index=models.Index(fields=['date', 'time'], name='calendar_c_date_0b8cdb_idx'),
        ),
    ]
