from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('monitoring', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='caseprogresssnapshot',
            name='title',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='caseprogresssnapshot',
            name='timeline_entries',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddIndex(
            model_name='caseprogresssnapshot',
            index=models.Index(fields=['assigned_lawyer_id'], name='mon_lawyer_idx'),
        ),
    ]
