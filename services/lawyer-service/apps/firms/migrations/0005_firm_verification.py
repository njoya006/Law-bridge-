from django.db import migrations, models
import django.core.validators
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('firms', '0004_firm_profile_partnership'),
    ]

    operations = [
        migrations.AddField(
            model_name='firm',
            name='verified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name='FirmVerificationRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('registration_number', models.CharField(max_length=100)),
                ('firm_type', models.CharField(choices=[('sole_practice', 'Sole Practice'), ('partnership', 'Partnership'), ('incorporated', 'Incorporated Law Firm'), ('government', 'Government / Public Sector'), ('ngo', 'NGO / Non-profit')], max_length=50)),
                ('founding_year', models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1900), django.core.validators.MaxValueValidator(2100)])),
                ('number_of_partners', models.PositiveSmallIntegerField(default=1)),
                ('notes', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], db_index=True, default='pending', max_length=20)),
                ('submitted_by_id', models.UUIDField()),
                ('reviewed_by_id', models.UUIDField(blank=True, null=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('rejection_reason', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('firm', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='verification_request', to='firms.firm')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
