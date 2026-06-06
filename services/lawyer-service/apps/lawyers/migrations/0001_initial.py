import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='LawyerProfile',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('user_id', models.UUIDField(unique=True)),
                ('full_name', models.CharField(blank=True, default='', max_length=255)),
                ('specialization', models.CharField(db_index=True, max_length=255)),
                ('qualifications', models.TextField(blank=True)),
                ('bio', models.TextField(blank=True)),
                ('bar_number', models.CharField(max_length=100, unique=True)),
                ('years_of_experience', models.PositiveIntegerField()),
                ('bijural_flag', models.CharField(choices=[('common_law', 'Common Law (Anglophone)'), ('civil_law', 'Civil Law (Francophone)'), ('both', 'Both Traditions')], max_length=32)),
                ('consultation_fee', models.DecimalField(decimal_places=2, max_digits=12)),
                ('availability_status', models.CharField(choices=[('available', 'Available'), ('busy', 'Busy'), ('on_leave', 'On Leave'), ('inactive', 'Inactive')], default='available', max_length=32)),
                ('active_cases', models.PositiveIntegerField(default=0)),
                ('total_cases', models.PositiveIntegerField(default=0)),
                ('average_rating', models.DecimalField(decimal_places=2, default=0, help_text='0-5', max_digits=3)),
                ('rating_count', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('verified_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'indexes': [
                    models.Index(fields=['specialization'], name='lawyers_la_special_idx'),
                    models.Index(fields=['bijural_flag'], name='lawyers_la_bijural_idx'),
                    models.Index(fields=['availability_status'], name='lawyers_la_avail_idx'),
                    models.Index(fields=['average_rating'], name='lawyers_la_rating_idx'),
                ],
            },
        ),
        migrations.CreateModel(
            name='LawyerAvailability',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('day_of_week', models.PositiveIntegerField(choices=[(0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'), (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday')])),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('is_available', models.BooleanField(default=True)),
                ('lawyer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='availability_slots', to='lawyers.lawyerprofile')),
            ],
            options={
                'unique_together': {('lawyer', 'day_of_week', 'start_time', 'end_time')},
                'indexes': [
                    models.Index(fields=['lawyer', 'day_of_week'], name='lawyers_av_lawyer_idx'),
                ],
            },
        ),
    ]
