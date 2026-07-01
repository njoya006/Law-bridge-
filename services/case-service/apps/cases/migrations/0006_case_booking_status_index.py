from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0005_intakeform'),
    ]

    operations = [
        migrations.AlterField(
            model_name='case',
            name='booking_status',
            field=models.CharField(blank=True, choices=[('pending', 'Pending Acceptance'), ('accepted', 'Accepted'), ('declined', 'Declined')], db_index=True, default='', max_length=20),
        ),
    ]
