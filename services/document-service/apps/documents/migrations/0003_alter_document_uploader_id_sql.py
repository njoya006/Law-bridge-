from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0002_alter_document_uploader_id'),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "ALTER TABLE documents_document "
                "ALTER COLUMN uploader_id TYPE varchar(64) USING uploader_id::varchar(64);"
            ),
            reverse_sql=(
                "ALTER TABLE documents_document "
                "ALTER COLUMN uploader_id TYPE uuid USING uploader_id::uuid;"
            ),
        ),
    ]
