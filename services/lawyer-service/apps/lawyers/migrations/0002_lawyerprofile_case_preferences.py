from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('lawyers', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='lawyerprofile',
            name='max_active_cases',
            field=models.PositiveIntegerField(default=20),
        ),
        migrations.AddField(
            model_name='lawyerprofile',
            name='practice_circuit',
            field=models.CharField(
                blank=True,
                choices=[
                    ('Adamawa', 'Adamawa'), ('Centre', 'Centre'), ('East', 'East'),
                    ('Far North', 'Far North'), ('Littoral', 'Littoral'), ('North', 'North'),
                    ('Northwest', 'Northwest'), ('South', 'South'), ('Southwest', 'Southwest'),
                    ('West', 'West'), ('National', 'National (All Circuits)'),
                ],
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name='lawyerprofile',
            name='accepted_case_types',
            field=models.TextField(blank=True, help_text='Comma-separated list of accepted case types'),
        ),
        migrations.AddField(
            model_name='lawyerprofile',
            name='accepts_urgent_cases',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='lawyerprofile',
            name='consultation_mode',
            field=models.CharField(
                choices=[('in_person', 'In Person'), ('virtual', 'Virtual'), ('both', 'Both')],
                default='both',
                max_length=16,
            ),
        ),
    ]
