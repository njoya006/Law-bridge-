import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='LegalDraft',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('user_id', models.CharField(db_index=True, max_length=64)),
                ('case_id', models.CharField(blank=True, max_length=64, null=True)),
                ('draft_type', models.CharField(
                    choices=[
                        ('letter_to_client', 'Letter to Client'),
                        ('letter_to_court', 'Letter to Court'),
                        ('motion', 'Motion / Requête'),
                        ('contract_clause', 'Contract Clause'),
                        ('memorandum', 'Legal Memorandum'),
                        ('demand_letter', 'Demand Letter'),
                        ('affidavit', 'Affidavit'),
                        ('settlement_proposal', 'Settlement Proposal'),
                        ('appeal_brief', 'Appeal Brief'),
                        ('other', 'Other'),
                    ],
                    default='other', max_length=32,
                )),
                ('title', models.CharField(blank=True, max_length=255)),
                ('instructions', models.TextField()),
                ('content', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'legal_drafts', 'ordering': ['-created_at']},
        ),
    ]
