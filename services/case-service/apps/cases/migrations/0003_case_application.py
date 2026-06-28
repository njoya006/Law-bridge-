import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0002_case_booking_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='CaseApplication',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('lawyer_id', models.UUIDField()),
                ('firm_id', models.UUIDField(blank=True, null=True)),
                ('message', models.TextField(blank=True, default='')),
                ('status', models.CharField(
                    choices=[('pending', 'Pending Review'), ('accepted', 'Accepted'), ('rejected', 'Rejected')],
                    default='pending', max_length=20,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('case', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='applications',
                    to='cases.case',
                )),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.AlterUniqueTogether(
            name='caseapplication',
            unique_together={('case', 'lawyer_id')},
        ),
    ]
