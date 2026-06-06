import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Case',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('client_id', models.UUIDField()),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('case_type', models.CharField(max_length=100)),
                ('legal_tradition', models.CharField(
                    choices=[('common_law', 'Common Law'), ('civil_law', 'Civil Law')],
                    max_length=32,
                )),
                ('circuit', models.CharField(
                    choices=[('anglophone', 'Anglophone'), ('francophone', 'Francophone')],
                    max_length=32,
                )),
                ('language', models.CharField(
                    choices=[('en', 'English'), ('fr', 'French')],
                    default='en',
                    max_length=2,
                )),
                ('status', models.CharField(
                    choices=[
                        ('draft', 'Draft'),
                        ('filed', 'Filed'),
                        ('assigned', 'Assigned to Lawyer'),
                        ('in_progress', 'In Progress'),
                        ('hearing_scheduled', 'Hearing Scheduled'),
                        ('verdict', 'Verdict Rendered'),
                        ('closed', 'Closed'),
                        ('dismissed', 'Dismissed'),
                    ],
                    default='draft',
                    max_length=32,
                )),
                ('assigned_lawyer_id', models.UUIDField(blank=True, null=True)),
                ('timeline', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('filed_at', models.DateTimeField(blank=True, null=True)),
                ('closed_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='CaseNote',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('case', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notes',
                    to='cases.case',
                )),
                ('lawyer_id', models.UUIDField()),
                ('content', models.TextField()),
                ('is_private', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='case',
            index=models.Index(fields=['client_id'], name='cases_case_client__idx'),
        ),
        migrations.AddIndex(
            model_name='case',
            index=models.Index(fields=['status'], name='cases_case_status_idx'),
        ),
        migrations.AddIndex(
            model_name='case',
            index=models.Index(fields=['assigned_lawyer_id'], name='cases_case_lawyer_idx'),
        ),
        migrations.AddIndex(
            model_name='case',
            index=models.Index(fields=['created_at'], name='cases_case_created_idx'),
        ),
    ]
