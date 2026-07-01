from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def backfill_user_fk(apps, schema_editor):
    """Copy existing user_id UUIDs into the new user_id FK column."""
    UserPreferences = apps.get_model('users', 'UserPreferences')
    User = apps.get_model('users', 'User')
    for pref in UserPreferences.objects.all():
        try:
            pref.user = User.objects.get(id=pref.user_id_old)
            pref.save(update_fields=['user'])
        except User.DoesNotExist:
            pref.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_merge_avatar_preferences'),
    ]

    operations = [
        # Step 1: rename old UUID field so we can read it during backfill
        migrations.RenameField(
            model_name='userpreferences',
            old_name='user_id',
            new_name='user_id_old',
        ),
        # Step 2: add the real FK, nullable for now
        migrations.AddField(
            model_name='userpreferences',
            name='user',
            field=models.OneToOneField(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='preferences',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Step 3: backfill FK from old UUID field
        migrations.RunPython(backfill_user_fk, migrations.RunPython.noop),
        # Step 4: make FK non-nullable
        migrations.AlterField(
            model_name='userpreferences',
            name='user',
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='preferences',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Step 5: drop the old UUID field
        migrations.RemoveField(
            model_name='userpreferences',
            name='user_id_old',
        ),
    ]
