import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='ClientProfile',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('user_id', models.UUIDField(unique=True)),
                ('full_name_en', models.CharField(blank=True, max_length=255)),
                ('full_name_fr', models.CharField(blank=True, max_length=255)),
                ('phone', models.CharField(blank=True, max_length=50)),
                ('organization', models.CharField(blank=True, max_length=255)),
                ('location', models.CharField(blank=True, max_length=255)),
                ('monthly_income', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('dependants', models.PositiveIntegerField(default=0)),
                ('employment_status', models.CharField(
                    choices=[
                        ('employed', 'Employed'),
                        ('unemployed', 'Unemployed'),
                        ('self_employed', 'Self-Employed'),
                        ('student', 'Student'),
                        ('other', 'Other'),
                    ],
                    default='other',
                    max_length=32,
                )),
                ('eligibility_score', models.PositiveIntegerField(blank=True, null=True)),
                ('eligibility_computed_at', models.DateTimeField(blank=True, null=True)),
                ('case_count', models.PositiveIntegerField(default=0)),
                ('total_legal_aid_used', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'indexes': [
                    models.Index(fields=['user_id'], name='clients_cl_user_id_idx'),
                    models.Index(fields=['eligibility_score'], name='clients_cl_elig_idx'),
                ],
            },
        ),
    ]
