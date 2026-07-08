from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0003_article'),
    ]

    operations = [
        migrations.AddField(
            model_name='book',
            name='views',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='book',
            name='is_featured',
            field=models.BooleanField(default=False, db_index=True),
        ),
    ]
