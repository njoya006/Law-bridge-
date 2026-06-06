import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        # Drop the table if it exists with a wrong schema (integer pk from old syncdb)
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS chat_sessions CASCADE;",
            reverse_sql="",
        ),
        migrations.CreateModel(
            name='ChatSession',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('user_id', models.CharField(db_index=True, max_length=64)),
                ('case_id', models.CharField(blank=True, db_index=True, max_length=64, null=True)),
                ('language', models.CharField(
                    choices=[('en', 'English'), ('fr', 'French')],
                    default='en',
                    max_length=2,
                )),
                ('title', models.CharField(blank=True, max_length=255)),
                ('messages', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'chat_sessions',
                'ordering': ['-updated_at'],
            },
        ),
    ]
