from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('messaging', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='thread',
            name='case_id',
            field=models.CharField(blank=True, db_index=True, default='', max_length=50),
        ),
    ]
