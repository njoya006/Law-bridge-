from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='CaseProgressSnapshot',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('case_id', models.CharField(max_length=64, unique=True)),
                ('client_id', models.CharField(max_length=64)),
                ('assigned_lawyer_id', models.CharField(blank=True, max_length=64, null=True)),
                ('case_type', models.CharField(max_length=100)),
                ('status', models.CharField(max_length=50)),
                ('created_at', models.DateTimeField()),
                ('updated_at', models.DateTimeField()),
            ],
            options={
                'indexes': [models.Index(fields=['case_id'], name='mon_case_idx'), models.Index(fields=['status'], name='mon_status_idx')],
            },
        ),
        migrations.CreateModel(
            name='LawyerStats',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('lawyer_id', models.CharField(max_length=64, unique=True)),
                ('active_cases', models.IntegerField(default=0)),
                ('closed_cases_count', models.IntegerField(default=0)),
                ('avg_resolution_days', models.FloatField(default=0.0)),
                ('cases_this_month', models.IntegerField(default=0)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]