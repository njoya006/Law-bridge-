from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('lawyers', '0002_lawyerprofile_case_preferences'),
    ]
    operations = [
        migrations.AddField(
            model_name='lawyerprofile',
            name='procedural_fee',
            field=models.DecimalField(
                max_digits=12, decimal_places=2, default=0,
                help_text='Compulsory court/filing procedural fee in XAF',
            ),
        ),
        migrations.AddField(
            model_name='lawyerprofile',
            name='professional_fee',
            field=models.DecimalField(
                max_digits=12, decimal_places=2, default=0,
                help_text='Negotiable professional representation fee in XAF (0 means to be agreed)',
            ),
        ),
    ]
