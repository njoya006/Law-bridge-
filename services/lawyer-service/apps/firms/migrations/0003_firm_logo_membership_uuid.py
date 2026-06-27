from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('firms', '0002_firmactionlog'),
    ]

    operations = [
        migrations.AddField(
            model_name='firm',
            name='logo',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='firmmembership',
            name='user_uuid',
            field=models.UUIDField(blank=True, null=True),
        ),
    ]
