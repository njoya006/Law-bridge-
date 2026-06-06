import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        # Drop the table if it exists with a wrong schema (integer pk from old syncdb)
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS document_analyses CASCADE;",
            reverse_sql="",
        ),
        migrations.CreateModel(
            name='DocumentAnalysis',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('document_id', models.UUIDField(db_index=True)),
                ('case_id', models.UUIDField(blank=True, null=True)),
                ('requested_by', models.CharField(max_length=64)),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('processing', 'Processing'),
                        ('completed', 'Completed'),
                        ('failed', 'Failed'),
                    ],
                    default='pending',
                    max_length=12,
                )),
                ('summary', models.TextField(blank=True)),
                ('key_points', models.JSONField(default=list)),
                ('risks', models.JSONField(default=list)),
                ('recommendations', models.JSONField(default=list)),
                ('language_detected', models.CharField(default='en', max_length=2)),
                ('raw_response', models.TextField(blank=True)),
                ('error_message', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'db_table': 'document_analyses',
                'ordering': ['-created_at'],
            },
        ),
    ]
