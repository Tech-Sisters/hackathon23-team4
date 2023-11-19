from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    pass

class Word(models.Model):

    class TypeChoices(models.TextChoices):
        LESSON = 'lesson', 'Lesson'
        FREE = 'free', 'Free'

    word = models.CharField(max_length=50)
    frequency = models.PositiveIntegerField(default=0)
    word_type = models.CharField(max_length=6, choices=TypeChoices.choices, default=TypeChoices.FREE)

    def __str__(self):
        return f"{self.word} ({self.word_type} word)"

class Level(models.Model):
    letter = models.CharField(default='A',max_length=1, unique=True)
    
    def __str__(self):
        return f"Level {self.letter}"
    
class Lesson(models.Model):
    number = models.PositiveIntegerField(default=1)
    level = models.ForeignKey(Level, on_delete=models.SET_NULL, null=True)
    words = models.ManyToManyField(Word, related_name='word_lessons')

    class Meta:
        unique_together = ["number", "level"]

    def __str__(self):
        return f"Lesson {self.number} (Level {self.level.letter})"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    my_queue = models.ManyToManyField(Word, related_name='learning_users', blank=True)
    my_vocab = models.ManyToManyField(Word, related_name='learned_users', blank=True)
    current_lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True, blank=True)
    current_level = models.ForeignKey(Level, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

class Message(models.Model):
        
    class SenderChoices(models.TextChoices):
        USER = 'user', 'User'
        BOT = 'bot', 'Bot'

    chat_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    content = models.CharField(max_length=10000)
    sender = models.CharField(max_length=5, choices=SenderChoices.choices, default=SenderChoices.USER)
    creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender}'s message in {self.chat_user.username}'s chat"