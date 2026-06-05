from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0003_alter_document_uploader_id_sql'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='password_salt',
            field=models.CharField(max_length=64, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='document',
            name='password_hash',
            field=models.CharField(max_length=128, null=True, blank=True),
        ),
    ]
