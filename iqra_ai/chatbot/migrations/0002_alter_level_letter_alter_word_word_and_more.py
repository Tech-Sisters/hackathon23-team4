# Generated by Django 4.2.4 on 2023-11-19 20:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chatbot', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='level',
            name='letter',
            field=models.CharField(default='A', max_length=1, unique=True),
        ),
        migrations.AlterField(
            model_name='word',
            name='word',
            field=models.CharField(max_length=50),
        ),
        migrations.AlterUniqueTogether(
            name='lesson',
            unique_together={('number', 'level')},
        ),
    ]
