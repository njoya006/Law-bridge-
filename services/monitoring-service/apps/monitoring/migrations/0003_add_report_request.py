from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('monitoring', '0002_snapshot_title_timeline'),
    ]

    operations = [
        migrations.CreateModel(
            name='ReportRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('firm_id', models.IntegerField()),
                ('requester_id', models.CharField(max_length=64)),
                ('requester_name', models.CharField(blank=True, default='', max_length=255)),
                ('report_type', models.CharField(
                    choices=[
                        ('financial', 'Financial Summary'), ('case_summary', 'Case Summary'),
                        ('activity', 'Activity Report'), ('clients', 'Clients Report'),
                        ('lawyers', 'Lawyers Participation'), ('all', 'Full Firm Report'),
                    ],
                    default='all', max_length=30,
                )),
                ('period', models.CharField(
                    choices=[
                        ('current_month', 'Current Month'), ('last_month', 'Last Month'),
                        ('ytd', 'Year to Date'), ('all_time', 'All Time'),
                    ],
                    default='current_month', max_length=20,
                )),
                ('notes', models.TextField(blank=True, default='')),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'), ('acknowledged', 'Acknowledged'),
                        ('generated', 'Generated'), ('delivered', 'Delivered'),
                    ],
                    default='pending', max_length=20,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='reportrequest',
            index=models.Index(fields=['firm_id', 'status'], name='monitoring__firm_id_status_idx'),
        ),
    ]
