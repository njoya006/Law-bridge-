from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('firms', '0003_firm_logo_membership_uuid'),
    ]

    operations = [
        # New fields on Firm
        migrations.AddField(model_name='firm', name='description',
            field=models.TextField(blank=True, default='')),
        migrations.AddField(model_name='firm', name='website',
            field=models.URLField(blank=True, default='')),
        migrations.AddField(model_name='firm', name='office_address',
            field=models.CharField(blank=True, default='', max_length=500)),
        migrations.AddField(model_name='firm', name='city',
            field=models.CharField(blank=True, default='', max_length=100)),
        migrations.AddField(model_name='firm', name='country',
            field=models.CharField(blank=True, default='Cameroon', max_length=100)),
        migrations.AddField(model_name='firm', name='phone',
            field=models.CharField(blank=True, default='', max_length=32)),
        migrations.AddField(model_name='firm', name='contact_email',
            field=models.EmailField(blank=True, default='')),
        migrations.AddField(model_name='firm', name='year_established',
            field=models.PositiveIntegerField(blank=True, null=True)),
        migrations.AddField(model_name='firm', name='specializations',
            field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name='firm', name='updated_at',
            field=models.DateTimeField(auto_now=True)),

        # FirmPartnershipPolicy
        migrations.CreateModel(
            name='FirmPartnershipPolicy',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_open', models.BooleanField(default=False)),
                ('min_years_experience', models.PositiveIntegerField(default=0)),
                ('requires_specialization_overlap', models.BooleanField(default=False)),
                ('revenue_share_percentage', models.DecimalField(decimal_places=2, default=50, max_digits=5)),
                ('process_description', models.TextField(blank=True, default='')),
                ('additional_requirements', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('firm', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='partnership_policy',
                    to='firms.firm',
                )),
            ],
        ),

        # PartnershipRequest
        migrations.CreateModel(
            name='PartnershipRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('requested_by_id', models.CharField(max_length=64)),
                ('status', models.CharField(
                    choices=[('pending', 'Pending Review'), ('under_review', 'Under Review'),
                             ('approved', 'Approved'), ('rejected', 'Rejected')],
                    default='pending', max_length=20,
                )),
                ('message', models.TextField(blank=True, default='')),
                ('response_note', models.TextField(blank=True, default='')),
                ('responded_by_id', models.CharField(blank=True, default='', max_length=64)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('requesting_firm', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='sent_partnership_requests',
                    to='firms.firm',
                )),
                ('target_firm', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='received_partnership_requests',
                    to='firms.firm',
                )),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.AlterUniqueTogether(
            name='partnershiprequest',
            unique_together={('requesting_firm', 'target_firm')},
        ),
    ]
