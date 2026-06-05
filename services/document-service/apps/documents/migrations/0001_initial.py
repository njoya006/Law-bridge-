from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Document',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('case_id', models.UUIDField(db_index=True)),
                ('uploader_id', models.CharField(max_length=64)),
                ('filename', models.CharField(max_length=255)),
                ('document_type', models.CharField(choices=[('complaint', 'Complaint'), ('contract', 'Contract'), ('evidence', 'Evidence'), ('motion', 'Motion'), ('judgment', 'Judgment'), ('deposition', 'Deposition'), ('other', 'Other')], max_length=32)),
                ('status', models.CharField(choices=[('pending_scan', 'Pending Virus Scan'), ('scanned', 'Scanned - Clean'), ('encrypted', 'Encrypted'), ('stored', 'Stored in MinIO'), ('active', 'Active'), ('archived', 'Archived'), ('deleted', 'Deleted')], default='pending_scan', max_length=32)),
                ('minio_path', models.CharField(blank=True, max_length=500, null=True)),
                ('file_size', models.BigIntegerField()),
                ('mime_type', models.CharField(max_length=100)),
                ('encryption_key_id', models.CharField(blank=True, max_length=255, null=True)),
                ('is_encrypted', models.BooleanField(default=False)),
                ('scan_timestamp', models.DateTimeField(blank=True, null=True)),
                ('scan_result', models.CharField(blank=True, max_length=255, null=True)),
                ('version', models.IntegerField(default=1)),
                ('parent_document_id', models.UUIDField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('expires_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['case_id', 'status'], name='documents_cas_6f7a8e_idx'),
                    models.Index(fields=['uploader_id'], name='documents_upl_0d1f3d_idx'),
                    models.Index(fields=['document_type'], name='documents_doc_4c0c5b_idx'),
                ],
            },
        ),
    ]
