from django.contrib import admin
from .models import User, UserProfile, Word, Lesson, Level, Message

# Register your models here.

admin.site.register(User)
admin.site.register(UserProfile)
admin.site.register(Word)
admin.site.register(Lesson)
admin.site.register(Level)
admin.site.register(Message)