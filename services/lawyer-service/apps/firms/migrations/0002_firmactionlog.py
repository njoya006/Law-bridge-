from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('firms', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='FirmActionLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('performed_by_id', models.CharField(max_length=64)),
                ('performed_by_email', models.EmailField(blank=True, max_length=254)),
                ('action', models.CharField(choices=[('invite_sent', 'Invite Sent'), ('invite_accepted', 'Invite Accepted'), ('member_removed', 'Member Removed'), ('role_changed', 'Role Changed')], max_length=32)),
                ('target_email', models.EmailField(blank=True, max_length=254)),
                ('old_role', models.CharField(blank=True, max_length=32)),
                ('new_role', models.CharField(blank=True, max_length=32)),
                ('reason', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('firm', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='action_logs', to='firms.firm')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
