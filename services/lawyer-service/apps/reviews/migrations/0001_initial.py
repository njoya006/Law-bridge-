from django.db import migrations, models
import django.core.validators
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('lawyers', '0003_add_procedural_professional_fees'),
    ]

    operations = [
        migrations.CreateModel(
            name='Review',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('client_id', models.UUIDField(db_index=True)),
                ('client_name', models.CharField(blank=True, max_length=200)),
                ('case_id', models.UUIDField(blank=True, db_index=True, null=True)),
                ('rating', models.PositiveSmallIntegerField(validators=[
                    django.core.validators.MinValueValidator(1),
                    django.core.validators.MaxValueValidator(5),
                ])),
                ('comment', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('lawyer', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='reviews',
                    to='lawyers.lawyerprofile',
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='review',
            index=models.Index(fields=['lawyer', '-created_at'], name='reviews_rev_lawyer__idx'),
        ),
        migrations.AlterUniqueTogether(
            name='review',
            unique_together={('lawyer', 'client_id')},
        ),
    ]
