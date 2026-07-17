import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0004_rename_documents_cas_6f7a8e_idx_documents_d_case_id_eaa1d9_idx_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='DocumentSignature',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('signer_id', models.CharField(max_length=64)),
                ('signer_name', models.CharField(blank=True, default='', max_length=255)),
                ('signature_type', models.CharField(max_length=16)),
                ('signature_data', models.TextField()),
                ('stamp_type', models.CharField(blank=True, default='', max_length=64)),
                ('signed_at', models.DateTimeField(auto_now_add=True)),
                ('document', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='signatures',
                    to='documents.document',
                )),
            ],
            options={'ordering': ['-signed_at']},
        ),
    ]
