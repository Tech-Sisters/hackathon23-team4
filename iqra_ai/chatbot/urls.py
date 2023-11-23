from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("profile/", views.profile, name="profile"),
    path("instructions", views.instructions, name="instructions"),

    # API Routes
    path("save_message", views.save_message, name="save_message"),
    path("save_lesson_progress", views.save_lesson_progress, name="save_lesson_progress"),
]
