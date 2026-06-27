from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='case',
            name='booking_status',
            field=models.CharField(
                blank=True, default='',
                choices=[('pending', 'Pending Acceptance'), ('accepted', 'Accepted'), ('declined', 'Declined')],
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='case',
            name='booking_metadata',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
