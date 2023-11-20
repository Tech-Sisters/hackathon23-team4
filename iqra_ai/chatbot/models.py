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
    part_of_speech = models.CharField(max_length=50, default="noun")
    word_type = models.CharField(max_length=6, choices=TypeChoices.choices, default=TypeChoices.FREE)

    def __str__(self):
        return f"{self.word} ({self.word_type} word {self.id})"

class Level(models.Model):
    letter = models.CharField(default='A',max_length=1, unique=True)
    
    def __str__(self):
        return f"Level {self.letter}"
    
class Lesson(models.Model):
    number = models.PositiveIntegerField(default=1)
    level = models.ForeignKey(Level, on_delete=models.SET_NULL, null=True)
    words = models.ManyToManyField(Word, related_name='word_lessons') # Can be a FK in Word

    class Meta:
        unique_together = ["number", "level"]

    def __str__(self):
        return f"Lesson {self.number} (Level {self.level.letter})"


class UserProfile(models.Model):

    class LessonProgressChoices(models.TextChoices):
        PRACTICE_SESSION_0 = 'ps0', 'Practice Session 0'
        PRACTICE_SESSION_1 = 'ps1', 'Practice Session 1'
        PRACTICE_SESSION_2 = 'ps2', 'Practice Session 2'
        PRACTICE_SESSION_3 = 'ps3', 'Practice Session 3'
        PRACTICE_SESSION_4 = 'ps4', 'Practice Session 4'
        PRACTICE_SESSION_5 = 'ps5', 'Practice Session 5'
        SENTENCE_TEST_0 = 'st0', 'Sentence Test 0'
        SENTENCE_TEST_1 = 'st1', 'Sentence Test 1'
        SENTENCE_TEST_2 = 'st2', 'Sentence Test 2'
        SENTENCE_TEST_3 = 'st3', 'Sentence Test 3'
        SENTENCE_TEST_4 = 'st4', 'Sentence Test 4'
        SENTENCE_TEST_5 = 'st5', 'Sentence Test 5'
        VERSE_TEST = 'vt', 'Verse Test'
        TAFSEER = 't', 'Tafseer'


    user = models.OneToOneField(User, on_delete=models.CASCADE)
    my_queue = models.ManyToManyField(Word, related_name='learning_users', blank=True)
    my_vocab = models.ManyToManyField(Word, related_name='learned_users', blank=True)
    current_lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True, blank=True)
    current_level = models.ForeignKey(Level, on_delete=models.SET_NULL, null=True, blank=True)
    lesson_progress = models.CharField(max_length=3, choices=LessonProgressChoices.choices, default='ps0')

    def __str__(self):
        return f"{self.user.username}'s Profile"

class Message(models.Model):
        
    class SenderChoices(models.TextChoices):
        USER = 'user', 'User'
        BOT = 'bot', 'Bot'

    class MessageTypeChoices(models.TextChoices):
        PS = 'ps', 'Practice Session'
        NORMAL = 'normal', 'Normal'

    chat_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    content = models.CharField(max_length=10000)
    sender = models.CharField(max_length=5, choices=SenderChoices.choices, default=SenderChoices.USER)
    creation = models.DateTimeField(auto_now_add=True)
    message_type = models.CharField(max_length=6, choices=MessageTypeChoices.choices, default='normal')
    practice_session_word = models.ManyToManyField(Word, related_name="practice_session_word_messages") # Can be a FK here

    def __str__(self):
        return f"{self.sender}'s message in {self.chat_user.username}'s chat"