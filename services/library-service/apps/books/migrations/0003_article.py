import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0002_book_publisher_pages'),
    ]

    operations = [
        migrations.CreateModel(
            name='Article',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=500)),
                ('summary', models.TextField(blank=True)),
                ('content', models.TextField()),
                ('article_type', models.CharField(
                    choices=[
                        ('case_summary', 'Case Summary'),
                        ('legal_alert', 'Legal Alert'),
                        ('analysis', 'Analysis'),
                        ('commentary', 'Commentary'),
                        ('explainer', 'Explainer'),
                        ('news', 'Legal News'),
                    ],
                    default='analysis',
                    max_length=20,
                )),
                ('author_id', models.UUIDField(db_index=True)),
                ('author_name', models.CharField(max_length=200)),
                ('firm_id', models.UUIDField(blank=True, db_index=True, null=True)),
                ('tier', models.CharField(
                    choices=[('general', 'General'), ('firm', 'Firm')],
                    default='general',
                    max_length=20,
                )),
                ('status', models.CharField(
                    choices=[('draft', 'Draft'), ('published', 'Published'), ('archived', 'Archived')],
                    default='draft',
                    max_length=20,
                )),
                ('legal_areas', models.JSONField(default=list)),
                ('jurisdiction', models.CharField(default='Cameroon', max_length=100)),
                ('language', models.CharField(default='en', max_length=10)),
                ('reading_time', models.PositiveSmallIntegerField(default=1)),
                ('views', models.PositiveIntegerField(default=0)),
                ('published_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-published_at', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['status', 'tier'], name='books_article_status_tier_idx'),
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['author_id'], name='books_article_author_idx'),
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['article_type', 'status'], name='books_article_type_status_idx'),
        ),
    ]
