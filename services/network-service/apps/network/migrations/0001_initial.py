from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Follow',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('follower_id', models.UUIDField(db_index=True)),
                ('following_id', models.UUIDField(db_index=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'unique_together': {('follower_id', 'following_id')},
            },
        ),
        migrations.CreateModel(
            name='Referral',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('referrer_id', models.UUIDField(db_index=True)),
                ('referred_lawyer_id', models.UUIDField(db_index=True)),
                ('client_name', models.CharField(max_length=255)),
                ('client_email', models.EmailField(blank=True, max_length=254)),
                ('case_type', models.CharField(blank=True, max_length=100)),
                ('notes', models.TextField(blank=True)),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('accepted', 'Accepted'),
                        ('declined', 'Declined'),
                        ('completed', 'Completed'),
                    ],
                    db_index=True,
                    default='pending',
                    max_length=20,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='FeedItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('actor_id', models.UUIDField(db_index=True)),
                ('item_type', models.CharField(
                    choices=[
                        ('article', 'Article'),
                        ('referral_accepted', 'Referral Accepted'),
                        ('follow', 'New Follow'),
                        ('partnership', 'Partnership'),
                    ],
                    db_index=True,
                    max_length=30,
                )),
                ('title', models.CharField(max_length=255)),
                ('body', models.TextField(blank=True)),
                ('external_id', models.CharField(blank=True, max_length=255)),
                ('external_url', models.URLField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
