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
            name='VerificationRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('bar_number', models.CharField(max_length=100)),
                ('bar_council', models.CharField(default='Cameroon Bar Association', max_length=200)),
                ('year_called', models.PositiveSmallIntegerField(validators=[
                    django.core.validators.MinValueValidator(1900),
                    django.core.validators.MaxValueValidator(2100),
                ])),
                ('notes', models.TextField(blank=True)),
                ('status', models.CharField(
                    choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
                    db_index=True, default='pending', max_length=20,
                )),
                ('reviewed_by_id', models.UUIDField(blank=True, null=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('rejection_reason', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('lawyer', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='verification_request',
                    to='lawyers.lawyerprofile',
                )),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]
