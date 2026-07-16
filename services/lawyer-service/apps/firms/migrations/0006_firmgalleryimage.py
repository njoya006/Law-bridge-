from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('firms', '0005_firm_verification'),
    ]

    operations = [
        migrations.CreateModel(
            name='FirmGalleryImage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image_url', models.CharField(max_length=512)),
                ('caption', models.CharField(blank=True, default='', max_length=255)),
                ('order', models.PositiveSmallIntegerField(default=0)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('firm', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='gallery_images', to='firms.firm')),
            ],
            options={
                'ordering': ['order', 'uploaded_at'],
            },
        ),
    ]
