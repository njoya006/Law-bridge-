from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0002_add_password_fields'),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP INDEX IF EXISTS documents_cas_6f7a8e_idx;",
            reverse_sql="CREATE INDEX IF NOT EXISTS documents_cas_6f7a8e_idx ON documents_document (case_id, status);",
        ),
        migrations.RunSQL(
            sql="DROP INDEX IF EXISTS documents_upl_0d1f3d_idx;",
            reverse_sql="CREATE INDEX IF NOT EXISTS documents_upl_0d1f3d_idx ON documents_document (uploader_id);",
        ),
        migrations.RunSQL(
            sql="DROP INDEX IF EXISTS documents_doc_4c0c5b_idx;",
            reverse_sql="CREATE INDEX IF NOT EXISTS documents_doc_4c0c5b_idx ON documents_document (document_type);",
        ),
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS documents_d_case_id_eaa1d9_idx ON documents_document (case_id, status);",
            reverse_sql="DROP INDEX IF EXISTS documents_d_case_id_eaa1d9_idx;",
        ),
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS documents_d_uploade_b207af_idx ON documents_document (uploader_id);",
            reverse_sql="DROP INDEX IF EXISTS documents_d_uploade_b207af_idx;",
        ),
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS documents_d_documen_40c475_idx ON documents_document (document_type);",
            reverse_sql="DROP INDEX IF EXISTS documents_d_documen_40c475_idx;",
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.RemoveIndex(model_name='document', name='documents_cas_6f7a8e_idx'),
                migrations.RemoveIndex(model_name='document', name='documents_upl_0d1f3d_idx'),
                migrations.RemoveIndex(model_name='document', name='documents_doc_4c0c5b_idx'),
                migrations.AddIndex(
                    model_name='document',
                    index=models.Index(fields=['case_id', 'status'], name='documents_d_case_id_eaa1d9_idx'),
                ),
                migrations.AddIndex(
                    model_name='document',
                    index=models.Index(fields=['uploader_id'], name='documents_d_uploade_b207af_idx'),
                ),
                migrations.AddIndex(
                    model_name='document',
                    index=models.Index(fields=['document_type'], name='documents_d_documen_40c475_idx'),
                ),
            ],
        ),
    ]
