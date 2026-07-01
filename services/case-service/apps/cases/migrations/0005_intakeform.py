from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0004_reassignmentrequest'),
    ]

    operations = [
        migrations.CreateModel(
            name='IntakeForm',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('case_id', models.UUIDField(blank=True, db_index=True, null=True)),
                ('case_type', models.CharField(max_length=100)),
                ('circuit', models.CharField(blank=True, default='', max_length=32)),
                ('form_fields', models.JSONField(help_text='[{label, type, required, placeholder, options?}]')),
                ('responses', models.JSONField(default=dict)),
                ('token', models.UUIDField(default=uuid.uuid4, unique=True)),
                ('created_by', models.UUIDField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
