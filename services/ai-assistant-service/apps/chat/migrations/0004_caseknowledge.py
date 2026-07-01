from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0003_chatsession_portal'),
    ]

    operations = [
        migrations.CreateModel(
            name='CaseKnowledge',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('case_id', models.CharField(db_index=True, max_length=64)),
                ('user_id', models.CharField(db_index=True, max_length=64)),
                ('facts', models.JSONField(default=list)),
                ('key_parties', models.JSONField(default=dict)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'case_knowledge',
                'unique_together': {('case_id', 'user_id')},
            },
        ),
    ]
