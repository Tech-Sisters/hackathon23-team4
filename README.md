# IQRA.ai
Welcome to IQRA.ai! This project is designed to create an interactive chatbot platform with user registration, lessons, and a conversational interface.

## Features

- User registration and authentication
- Interactive chatbot with conversational abilities
- User profiles and progress tracking
- Lesson management system
- Responsive web design

## Technologies Used

- Django: Web framework for building the application
- HTML, CSS, JavaScript: Front-end development
- SQLite: Database for storing user data and chatbot interactions
- OpenAI API: API for the bot conversations

## Setup

1. Clone the repository:

   bash
   `git clone [https://github.com/Tech-Sisters/hackathon23-team4.git](https://github.com/Tech-Sisters/hackathon23-team4.git)`
   

3. Navigate to the project directory:

   bash
   `cd hackathon23-team4`
   

4. Install dependencies:

   bash
   `pip install -r requirements.txt`
   

5. Apply database migrations:

   bash
   `python manage.py migrate`

6. Edit the .env file and add the necessary API keys

7. Run the development server:

   bash
   `python manage.py runserver`
   

8. Open your browser and go to [http://localhost:8000](http://localhost:8000) to view the application.

## Usage

- Visit the home page to register or log in.
- Interact with the chatbot and explore lessons, practice sessions, tafseer and more
- Track your progress in the user profile section.

## Project Structure

- `chatbot/`: Django application directory
- `static/`: Static files (CSS, JavaScript, images)
- `templates/`: HTML templates
- `db.sqlite3`: SQLite database file

## Contribution

If you want to contribute to this project, feel free to submit issues or pull requests.

## License

This project is licensed under the [MIT License](LICENSE).
