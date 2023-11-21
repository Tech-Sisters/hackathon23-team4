from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.db import IntegrityError, transaction
from .models import User, UserProfile, Word, Lesson, Level, Message

def get_user_context(user):
    '''
    Returns four context elements:
    lesson_words - What are the words in the current lesson? (to display in the sidebar)
    activity - Is it a practice session (ps), a sentence test (st), a verse test (vt) or a tafseer (t)
    activity_name - What is the name of the activity in human readable format? (eg: "Practice Session")
    activity_number - If the activity is a ps/st, then which word are we on?
    messages - If it is a practice session, what messages have been sent? (to recreate practice session chat)
    user_lesson - Which lesson is the user on? (eg: "A1")
    '''

    user_profile = UserProfile.objects.get(user=user)
    user_progress = user_profile.lesson_progress
    user_lesson_word_queue = user_profile.my_queue.all() # returns a QuerySet of Word objects
    lesson_words = list(user_profile.my_queue.values_list('word', flat=True))
    user_lesson = user_profile.current_level.letter + str(user_profile.current_lesson.number)

    activity = user_progress[:2]
    activity_name_num = user_profile.get_lesson_progress_display()
    activity_name = ''.join(char for char in activity_name_num if char.isalpha() or char.isspace())
    activity_number = 0

    messages = []
    
    if activity in ["ps", "st"]:
        activity_number = int(user_progress[2])
        if activity == "ps" and activity_number>=1:
            activity_word = user_lesson_word_queue[activity_number-1]
            messages = Message.objects.filter(chat_user=user, practice_session_word=activity_word)

    
    context = {
        "lesson_words": lesson_words,
        "activity": activity,
        "activity_name": activity_name,
        "activity_number": activity_number,
        "messages": messages,
        "lesson": user_lesson,
    }

    # print(context)

    return context

# Landing/Chatbot page
def index(request):
    """
    Redirects the user to the chatbot page if authenticated,
    otherwise, directs them to the landing page.
    """

    if request.user.is_authenticated:
        context = get_user_context(request.user)
        return render(request, "chatbot/chatbot.html", context=context)
    
    else:
        return render(request, "chatbot/index.html")
       

# Login page
def login_view(request):
    """
    Handles user login. Displays the login form and authenticates 
    the user upon form submission.
    """

    if request.method == "POST":
        # User submitted the login form

        # Attempt to sign the user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication was successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "chatbot/login.html", {
                "message": "Invalid username and/or password."
            })
        
    else:
        # Display the login form
        return render(request, "chatbot/login.html")

# Logout view
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

# Register view
def register(request):
    """
    Handles user registration. 
    Displays the registration form.
    Creates a new user upon successful form submission. 
    """

    if request.method == "POST":
        # User submitted the registration form

        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "chatbot/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create a new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()

        # Ensure username is unique
        except IntegrityError:
            return render(request, "chatbot/register.html", {
                "message": "Username already taken."
            })
        
        # Create user's profile
        profile = UserProfile(user=user)
        with transaction.atomic():

            current_level, created = Level.objects.get_or_create(letter='A')
            profile.current_level = current_level

            current_lesson, created = Lesson.objects.get_or_create(level=current_level, number=1)
            profile.current_lesson = current_lesson

            profile.save()

            lesson_words = current_lesson.words.all()
            profile.my_queue.set(lesson_words)  # Set replaces the current contents of the related set with a new one

            profile.lesson_progress = 'ps0'

        profile.save()

        # Log in the user
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    
    else:
        # Display the registration form
        return render(request, "chatbot/register.html")
    