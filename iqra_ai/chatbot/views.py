from django.shortcuts import render

from .models import User, UserProfile, Word, Lesson, Level, Message

# Create your views here.
def index(request):

    return render(request, "chatbot/index.html")
