from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('lawyers', '0003_add_procedural_professional_fees'),
    ]
    operations = [
        migrations.AddField(
            model_name='lawyerprofile',
            name='reputation_score',
            field=models.PositiveIntegerField(default=0, help_text='0-100 computed nightly'),
        ),
        migrations.AddField(
            model_name='lawyerprofile',
            name='open_to_partnerships',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='lawyerprofile',
            name='bar_admissions',
            field=models.TextField(blank=True, help_text='Comma-separated list of bar admissions beyond home circuit'),
        ),
        migrations.AddField(
            model_name='lawyerprofile',
            name='international_experience',
            field=models.BooleanField(default=False),
        ),
    ]
