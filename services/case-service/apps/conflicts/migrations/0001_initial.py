import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='ConflictCheck',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('lawyer_id', models.UUIDField(db_index=True)),
                ('case_id', models.UUIDField(db_index=True)),
                ('client_id', models.UUIDField()),
                ('opposing_party_ids', models.JSONField(default=list)),
                ('status', models.CharField(
                    choices=[('active', 'Active'), ('closed', 'Closed')],
                    default='active',
                    max_length=32,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('closed_at', models.DateTimeField(blank=True, null=True)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='conflictcheck',
            unique_together={('lawyer_id', 'case_id')},
        ),
        migrations.AddIndex(
            model_name='conflictcheck',
            index=models.Index(fields=['lawyer_id', 'status'], name='conflicts_lawyer_status_idx'),
        ),
        migrations.AddIndex(
            model_name='conflictcheck',
            index=models.Index(fields=['case_id'], name='conflicts_case_id_idx'),
        ),
    ]
