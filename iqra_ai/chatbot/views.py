from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.db import IntegrityError, transaction
from django.http import HttpResponseRedirect, JsonResponse
import json

from openai import OpenAI
from django.conf import settings

from .models import User, UserProfile, Word, Lesson, Level, Message

def instructions(request):
    username = request.user.username
    return render(request, "chatbot/instructions.html", context={'username': username})

def profile(request):
    user_profile = UserProfile.objects.get(user=request.user)
    current_lesson = user_profile.current_lesson
    my_queue_words = user_profile.my_queue.all()
    my_vocab_words = user_profile.my_vocab.all()

    context = {
        'user_profile': user_profile,
        'current_lesson': current_lesson,
        'my_queue_words': my_queue_words,
        'my_vocab_words': my_vocab_words,
    }

    return render(request, 'chatbot/profile.html', context)

def get_current_word(user):
    user_profile = UserProfile.objects.get(user=user)
    user_progress = user_profile.lesson_progress
    user_lesson_word_queue = user_profile.my_queue.all() # returns a QuerySet of Word objects
    activity_number = 0
    if user_progress[-1].isdigit():
        activity_number = int(user_progress[-1])

    if activity_number>=1:
        activity_word = user_lesson_word_queue[activity_number-1]
    else:
        activity_word = user_lesson_word_queue[0]

    return activity_word
  
def get_user_context(user):
    '''
    Returns four context elements:
    lesson_words - What are the words in the current lesson? (to display in the sidebar)
    activity - Is it a practice session (ps), a sentence test (st), a verse test (vt) or a tafseer (t)
    activity_name - What is the name of the activity in human readable format? (eg: "Practice Session")
    activity_number - If the activity is a ps/st, then which word are we on?
    messages - If it is a practice session, what messages have been sent? (to recreate practice session chat)
    user_level - Which level is the user on? (eg: "A")
    user_lesson - Which lesson is the user on? (eg: 1)
    '''

    user_profile = UserProfile.objects.get(user=user)
    user_progress = user_profile.lesson_progress
    lesson_words = list(user_profile.my_queue.values_list('word', flat=True))
    user_level = user_profile.current_level.letter
    user_lesson = user_profile.current_lesson.number

    activity = user_progress[:2]
    activity_name_num = user_profile.get_lesson_progress_display()
    activity_name = ''.join(char for char in activity_name_num if char.isalpha() or char.isspace())
    activity_number = 0

    messages_with_sender = []

    if activity in ["ps", "st"]:
        activity_number = int(user_progress[2])
        if activity == "ps" and activity_number>=1:
            activity_word = get_current_word(user)
            messages = Message.objects.filter(chat_user=user, practice_session_word=activity_word, message_type="ps").order_by('creation')
            for message_obj in messages:
                messages_with_sender.append([message_obj.content,message_obj.sender])
    
    context = {
        "lesson_words": lesson_words,
        "activity": activity,
        "activity_name": activity_name,
        "activity_number": activity_number,
        "messages": messages_with_sender,
        "user_level": user_level,
        "user_lesson": user_lesson,
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
       
def get_lesson_words(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)
    
    user_profile = UserProfile.objects.get(user=request.user)
    lesson_words = list(user_profile.my_queue.values_list('word', flat=True))
    print(lesson_words)

    return JsonResponse({"new_lesson_words":lesson_words}, status=201)

# Save Messages sent by user
@login_required
def save_message(request):
    
    # Saving a new message must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Load message
    data = json.loads(request.body)
    message = data.get("message")
    sender = data.get("sender")
    message_type = data.get("message_type")
    print("MESSAGE:",message)
    if message == "":
        return JsonResponse({
            "error": "No message found!"
        }, status=400)
    else:
        practice_session_word = get_current_word(user=request.user)
        with transaction.atomic():

            message_object = Message(chat_user=request.user, content=message, sender=sender, message_type=message_type)
            message_object.save()
            message_object.practice_session_word.add(practice_session_word)

        return JsonResponse({
            "message": "Message saved successfully.",
        }, status=201)

def create_bot_response(request):
    
    # Saving a new message must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Load message
    data = json.loads(request.body)
    user_message = data.get("userMessage")
    command = data.get("command")
    print("user_message:",user_message)
    if user_message == "":
        return JsonResponse({
            "error": "No prompt found!"
        }, status=400)
    
    else:
        activity_word = get_current_word(user=request.user)
        bot_message = f"Your word is {activity_word} (command: {command})"

        if command=="practice_session":
            prompt = f'Send a simple sentence using "{activity_word}". Do not send anything except the sentence in Arabic'
            # prompt = "invalid_command"

        elif command=="sentence_test":
            prompt = f'Send a simple sentence using "{activity_word}". Do not send anything except the sentence in Arabic'
            # prompt = "invalid_command"

        elif command == "correct_translation":
            sentence_test = data.get("sentenceTest")
            prompt = f'If the translation of "{sentence_test}" is "{user_message}", send "correct" else send "wrong"'
            # prompt = "invalid_command"
            # bot_message = "correct"

        elif command == "translate_word":
            prompt = f"Give the shortest translation of {user_message}. Do not send anything except the translation"
            # prompt = "invalid_command"

        else:
            prompt = "invalid_command"

        print(prompt)
        
        # bot_message = f"Your word is {activity_word} (command: {command})"
        if prompt != "invalid_command":
            try:
                bot_message = generate_response_gpt3(prompt)
            except Exception as e:
                print(e)
        
        return JsonResponse({
            "bot_message": bot_message,
        }, status=201)
    
def generate_response_gpt3(user_message):
    api_key = settings.OPENAI_API_KEY
    model = "gpt-3.5-turbo"
    client = OpenAI(api_key=api_key)
    
    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are an Arabic teaching assistant."},
            {"role": "user", "content": f"{user_message}"}
        ]
    )

    reply = completion.choices[0].message.content
    return reply

@login_required
def save_lesson_progress(request):
    # Saving a new message must be via POST
    if request.method != "PUT":
        return JsonResponse({"error": "PUT request required."}, status=400)

    # Load message
    data = json.loads(request.body)
    lesson_progress = data.get("lesson_progress")
    user_lesson = data.get("user_lesson")
    user_level = data.get("user_level")
    print("lesson_progress:",lesson_progress)
    if lesson_progress == "" or user_lesson== "":
        return JsonResponse({
            "error": "No lesson_progress/user_lesson found!"
        }, status=400)
    else:
        with transaction.atomic():
            # Update user lesson progress
            user_profile = UserProfile.objects.get(user=request.user)
            user_profile.lesson_progress = lesson_progress

            # Update user level
            current_level = Level.objects.get(letter=user_level)
            user_profile.current_level = current_level

            # Update user lesson
            current_lesson = Lesson.objects.get(level=current_level, number=user_lesson)
            user_profile.current_lesson = current_lesson

            # Add old queue words to vocab
            user_profile.my_vocab.add(*user_profile.my_queue.all())

            # Add new lesson words to queue
            lesson_words = current_lesson.words.all()
            user_profile.my_queue.set(lesson_words)

            user_profile.save()

    return JsonResponse({"message": "Lesson progress saved successfully."}, status=201)


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

        # Redirect to the instructions page
        return redirect("instructions")
    
    else:
        # Display the registration form
        return render(request, "chatbot/register.html")
    