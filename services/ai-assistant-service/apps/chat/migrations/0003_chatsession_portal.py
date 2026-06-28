from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0002_legal_draft'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatsession',
            name='portal',
            field=models.CharField(
                max_length=16,
                default='lawyer',
                db_index=True,
                help_text='Which portal created this session: client or lawyer',
            ),
        ),
    ]
