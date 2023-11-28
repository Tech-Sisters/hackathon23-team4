document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
});

function initializeChat() {
    // const chatContainer = document.querySelector('.chat-container');
    const startSessionContainer = document.querySelector('.start-session-container');
    const chatInput = document.querySelector('.chat-input');
    
    const chatMessages = document.querySelector('.chat-messages');
    const userInput = document.getElementById('userInput');

    // letIABLES FROM HTML:
    // activity - Is it a practice session (ps), a sentence test (st), a verse test (vt) or a tafseer (t)
    // activity_name - What is the name of the activity in human readable format? (eg: "Practice Session")
    // activity_number - If the activity is a ps/st, then which word are we on?
    // messages - If it is a practice session, what messages have been sent? (to recreate practice session chat)
    // user_level - Which level is the user on? (eg: "A")
    // user_lesson - Which lesson is the user on? (eg: 1)
    let lessonWords = [];
    let messageCounter = 0;
    let sentenceTestTries = 0;
    let verseTestTries = 0;
    let currentTest = "";

    
    lessonWords = getLessonWords().then(() => begin());

    async function begin() {

        // User is on a Practice Session
        if (activity === "ps") {

            // User hasn't yet started Practice Sessions
            if (activity_number === 0) {
                startButton();

            // User has started Practice Sessions and is on one of them
            } else {

                // Add all previous messages of this practice session to the screen so user can continue where they left off
                messages_num = messages.length;
                for (let i=0; i<messages_num; i++) {
                    if (messages[i][1]=="user") {
                        addUserMessage(messages[i][0]);
                    } else if (messages[i][1]=="bot"){
                        addBotMessage(messages[i][0]);
                    }
                }
            }

        // User is on a Sentence Test
        } else if (activity === 'st') {

            // User hasn't yet started Sentence Tests
            if (activity_number === 0) {
                startButton();

            // User has started Sentence Tests and is on one of them
            } else {
                startSentenceTestWord();
            }

        // User is on a Verse Test
        } else if (activity === 'vt') {
            startButton();

        // User has unlocked the Tafseer
        } else if (activity === 't') {
            startButton();
        }

    }

    // Add a new function to handle sentence test words
    async function startSentenceTestWord() {
        const sentenceTestIndex = activity_number-1

        // All 5 sentence tests are not yet done
        if (sentenceTestIndex < 5) {
            // Get the word user has to be tested on
            const sentenceTestWord = lessonWords[sentenceTestIndex];

            // Get a sentence test from the bot
            currentTest = await get_bot_response(sentenceTestWord, "sentence_test", currentTest)
            const botMessage = `Translate: "${currentTest}"`; 

            // Add the bot message and save it
            addBotMessage(botMessage);
            await sendMessageToBackend(botMessage);
        }
    }

    // Start Verse test
    async function startVerseTest() {
        const verseToTranslate = "لَيْلَةُ ٱلْقَدْرِ خَيْرٌۭ مِّنْ أَلْفِ شَهْرٍۢ" //replace with call to verses file in v2
        currentTest = verseToTranslate
        const botMessage = `Translate the verse: "${verseToTranslate}"`;
        addBotMessage(botMessage);
        await sendMessageToBackend(botMessage);
    }

    // Show Tafseer
    async function showTafseer() {

        // replace with call to tafseer file in v2
        const botMessages = [`Showing summarized Tafseer for the following three verses:
        إِنَّآ أَنزَلْنَـٰهُ فِى لَيْلَةِ ٱلْقَدْرِ (1) 
        (Indeed, ˹it is˺ We ˹Who˺ sent this ˹Quran˺ down on the Night of Glory.)
        وَمَآ أَدْرَىٰكَ مَا لَيْلَةُ ٱلْقَدْرِ (2) 
        (And what will make you realize what the Night of Glory is?)
        لَيْلَةُ ٱلْقَدْرِ خَيْرٌۭ مِّنْ أَلْفِ شَهْرٍۢ (3) 
        (The Night of Glory is better than a thousand months.)`,

        `The tafsir discusses Surah Al-Qadr, which emphasizes the significance of the Night of Qadr (Laylat al-Qadr) during the month of Ramadan. The occasion of revelation is explained through the story of a warrior from the Children of Israel who fought persistently for a thousand months, and the Surah was revealed to highlight that the worship on the Night of Qadr in Islam surpasses the value of such continuous jihad.
        The term "Qadr" is interpreted with two meanings: greatness and predestination. The Night of Qadr is considered great due to the honor, majesty, and dignity associated with it. Additionally, it is associated with predestination, signifying that the destinies of individuals and nations for the coming year are decided on this night.
        The exact date of the Night of Qadr is not disclosed in the Qur'an, but it is stated to occur in the last ten nights of Ramadan, with suggestions that it could be any of the odd-numbered nights. Various authentic traditions support the idea of seeking it in the last ten nights, particularly on the 21st, 23rd, 25th, 27th, and 29th nights.
        The Surah itself mentions the extraordinary value of the Night, stating that the worship during this night is better than a thousand months of worship. It is emphasized that the exact number is not the focus, but rather it signifies a significantly high value. The hadiths also highlight the immense rewards associated with spending the Night of Qadr in worship, including the forgiveness of past sins.
        The text concludes by mentioning a special supplication recommended by the Prophet Muhammad (ﷺ) for those who find the Night of Qadr: "O Allah! Verily, You are the Oft-Pardoning, You love to pardon, so do pardon me." Additionally, it notes that the Holy Qur'an was revealed on the Night of Qadr, and other heavenly books were also revealed during Ramadan, with specific dates mentioned for each.
        `,

        `For detailed tafsir of these verses, visit https://quran.com/97:1/tafsirs/en-tafsir-maarif-ul-quran`];

        // send tafseer and info in 3 different messages
        for (i=0; i<botMessages.length; i++) {
            addBotMessage(botMessages[i]);
            await sendMessageToBackend(botMessages[i]);
        }

        // Button for next level once user is done reading Tafseer
        await startNextLevel();
    }   

    // Start next level
    async function startNextLevel() {

        chatInput.style.display = 'none'; // hide the input field
        const startButton = createButtonElement('Start next level');

        startSessionContainer.style.display = 'flex'; // show startSessionContainer
        startSessionContainer.innerHTML = ''; // Clear the content of startSessionContainer

        let next_level = getNextLetter(user_level);

        startButton.addEventListener('click', async function() {
            await sendProgressToBackend('ps0',1,next_level).then(async () => {
                const newLessonWords = await getLessonWords()
                updateLocalLevelLesson(next_level, 1, newLessonWords);

                chatMessages.innerHTML = '';
                begin();
            })
        });
        startSessionContainer.appendChild(startButton);
    }

    // Common button to start any activity
    function startButton() {

        chatInput.style.display = 'none'; // hide the input field
        const startButton = createButtonElement('Start '+activity_name);

        startSessionContainer.style.display = 'flex'; // show startSessionContainer
        startSessionContainer.innerHTML = ''; // Clear the content of startSessionContainer

        startButton.addEventListener('click', async function() {
            
            startSessionContainer.style.display = 'none'; // hide the start session button
            chatInput.style.display = 'flex'; // show the input field

            chatMessages.innerHTML = ''; // Clear all messages from the chatbox

            if (['ps','st'].includes(activity)) {
                let lesson_progress = activity + '1';
                await sendProgressToBackend(lesson_progress).then(async () => {
                    if (activity === 'st') {
                        startSentenceTestWord();
                    }
                    // if practice session, then send the 5 words to user
                    else if (activity === 'ps') {
                        let lessonWords = await getLessonWords()
                        updateLessonWords(lessonWords)
                        let lessonWordsString = '';
                        for (i=0; i<lessonWords.length-1; i++) {
                            let num_word = lessonWords[i]+", ";
                            lessonWordsString += num_word;
                        }
                        lessonWordsString += lessonWords[lessonWords.length-1];

                        addBotMessage(`Welcome to the practice session of Lesson 1! 
                        We are going to practice the following words: ${lessonWordsString}`);
                        addBotMessage(`For each word, you will have to practice with the bot by using the word in a sentence. 
                        The bot will respond by doing the same.`);
                        addBotMessage(`Create a sentence using the word ${lessonWords[0]} in it.`);
                    }
                });
            } else if (activity=='vt') {
                startVerseTest();
            } else if (activity=='t') {
                chatInput.style.display = 'none'; // hide the input field
                showTafseer();
            }
        });
        startSessionContainer.appendChild(startButton);
    }

    // Create button element
    function createButtonElement(activity_btn_msg) {
        const buttonElement = document.createElement('button');
        buttonElement.classList.add('start-activity-btn');
        buttonElement.textContent = activity_btn_msg;

        return buttonElement;
    }

    // Add user messages to chat box
    function addUserMessage(message) {
        const userMessage = createMessageElement(message, 'user-message');
        chatMessages.appendChild(userMessage);
        scrollToBottom();
    }

    // Add bot messages to chat box
    function addBotMessage(message) {
        const assistantMessage = createMessageElement(message, 'assistant-message', true);
        chatMessages.appendChild(assistantMessage);
        scrollToBottom();
    }

    // Update activity name in sidebar
    function updateActivityName(p_activity_name) {
        const activity_name_heading = document.getElementById("activity_name");
        activity_name_heading.innerHTML = p_activity_name;
    }

    // Update lesson words in sidebar
    function updateLessonWords(p_lesson_words) {
        const lesson_words_list = document.getElementById("lesson_words_list");

        lesson_words_list.innerHTML = '';
        p_lesson_words.forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            lesson_words_list.appendChild(li);
        });
    }

    // Update info in sidebar
    function updateSidebarInfo(lesson, level, p_activity_name, p_lesson_words) {
        const user_level_heading = document.getElementById("user_level");
        const user_lesson_heading = document.getElementById("user_lesson");

        user_level_heading.innerHTML = level;
        user_lesson_heading.innerHTML = lesson;

        updateActivityName(p_activity_name);
        updateLessonWords(p_lesson_words);

    }

    // Create message element to add in chat box
    function createMessageElement(message, className, isAssistant = false) {
        const messageElement = document.createElement('div');

        messageElement.classList.add('message', className);

        if (isAssistant) {
            const words = message.split(' ');
            const wordContainer = document.createElement('div');
            words.forEach(word => {
                const span = document.createElement('span');
                span.textContent = word + ' ';
                span.classList.add('clickable-word');

                // Make word clickable so user can see its translation
                span.addEventListener('click', async event => await createBubble(event, word));
                wordContainer.appendChild(span);
            });
            messageElement.appendChild(wordContainer);
        } else {
            messageElement.textContent = message;
        }
        
        messageCounter++;

        return messageElement;
    }

    // Create word translation bubble 
    async function createBubble(event, word) {
        // Remove existing bubbles
        const existingBubbles = document.querySelectorAll('.bubble');
        existingBubbles.forEach((bubble) => bubble.remove());

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');

        // Get word translation from backend
        let word_translation = await get_bot_response(word, "translate_word") 
        word_translation = word_translation.replace(".","").toLowerCase()
        bubble.textContent = word_translation;
        document.body.appendChild(bubble);

        // Calculate position above the clicked word
        const rect = event.target.getBoundingClientRect();
        bubble.style.top = rect.top - bubble.offsetHeight - 10 + 'px';
        bubble.style.left = rect.left - 10 + 'px';

        // Remove the bubble after a short delay
        setTimeout(() => {
            bubble.remove();
        }, 2000);
    }

    // Handle user messages
    async function processUserInput() {
        const userMessage = userInput.value.trim();
        if (userMessage !== '') {

            // Actually add user message to html
            addUserMessage(userMessage);

            // Send user message to the Django backend
            let message_type = activity=="ps" ? "ps" : "normal"
            await sendMessageToBackend(userMessage, "user", message_type)
            userInput.value = '';

            let lesson_progress;

            // If user is on a Practice Session
            if (activity==="ps") {

                // User has yet to send messages to finish practice session
                if (messageCounter < 1) {
                    const botMessage = await get_bot_response(userMessage, "practice_session");
                    await sendMessageToBackend(botMessage, "bot", "ps");
                    addBotMessage(botMessage);

                // User is done with practice session
                } else {

                    // Get the last message of practice session from the bot
                    const botMessage = await get_bot_response(userMessage, "practice_session");
                    await sendMessageToBackend(botMessage, "bot", "ps");
                    addBotMessage(botMessage);
                    
                    lesson_progress = 'ps' + (activity_number+1);

                    if (lesson_progress === 'ps6') {
                        lesson_progress = 'st0'
                    } 
                    
                    else {
                        const newLessonWords = await getLessonWords();
                        const currentWord = newLessonWords[activity_number];
                        const instructionsMessage = `Create a sentence using the word ${currentWord} in it.`
            
                        addBotMessage(instructionsMessage);

                    }

                    await sendProgressToBackend(lesson_progress);

                    messageCounter = 0;
                }

            // If user is on a Sentence Test
            } else if (activity === "st" && activity_number >= 1) {
                // Check correctness of user's translation ("correct"/"wrong")
                let result = await get_bot_response(userMessage, "correct_translation", currentTest); // Should be "correct" or "wrong"
                result = result.replace(".","").toLowerCase()

                let botMessage;

                if (result === "correct") {
                    botMessage = "That is the right translation!";

                    lesson_progress = 'st' + (activity_number+1);
                    let currentLesson = user_lesson

                    if (lesson_progress === 'st6') {

                        // User has completed all 4 lessons in the level
                        if (user_lesson >= 4) { 
                            // User is ready to take the verse test
                            lesson_progress = 'vt';

                        } else {
                            // User has completed sentence test of lesson 1 and is going to start lesson 2
                            lesson_progress = 'ps0';
                            currentLesson = user_lesson+1;
                            const newLessonWords = await getLessonWords()
                            updateLocalLevelLesson(user_level, currentLesson, newLessonWords);

                        }
                    }
                    await sendProgressToBackend(lesson_progress, currentLesson)

                } else if (sentenceTestTries < 2) {
                    botMessage = "That's not right, try again!";
                    sentenceTestTries++;
                } else {
                    botMessage = "You have incorrectly translated 3 times. Please go back to practice sessions";
                    sentenceTestTries = 0;
                    lesson_progress = 'ps0';
                    await sendProgressToBackend(lesson_progress);
                }
                await sendMessageToBackend(botMessage);
                addBotMessage(botMessage);
                if (activity=='st') {
                    startSentenceTestWord();
                }

            // If user is on a Verse Test
            } else if (activity == "vt") {
                // Check correctness of user's translation
                let result = await get_bot_response(userMessage, "correct_translation", currentTest); // Should be "correct" or "wrong"
                result = result.replace(".","").toLowerCase()
                let botMessage;
                    
                if (result === "correct") {
                    botMessage = "That is the right translation!";

                    lesson_progress = 't';
                    await sendProgressToBackend(lesson_progress);

                } else if (verseTestTries < 2) {
                    botMessage = "That's not right, try again!";
                    verseTestTries++;
                } else {
                    botMessage = "You have incorrectly translated the verse 3 times";
                    verseTestTries = 0;
                    lesson_progress = 't';
                    await sendProgressToBackend(lesson_progress);
                }
                await sendMessageToBackend(botMessage);
                addBotMessage(botMessage);

                if (activity=='vt') {
                    startVerseTest();
                }
            }
            
            // If user completes an activity and goes to the start of another activity, run begin() function
            if (['ps0','st0','vt','t'].includes(lesson_progress)) {
                begin()
            }

        }
    }
    
    // Send message to backend to save it
    async function sendMessageToBackend(message, sender="bot", message_type="normal") {
        const url = "/save_message";
        const method = "POST";
        const body = {
            message: message,
            sender: sender,
            message_type: message_type,
        };
        try {
            const data = await makeRequest(url, method, body);

        // Check if the registration was successful
        if (data.registrationSuccess) {
            // Redirect to the instructions page
            window.location.href = "/instructions";
        }

        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Send progress to backend to save it
    async function sendProgressToBackend(lesson_progress, currentLesson=false, currentLevel=false) {
        currentLesson = currentLesson ? currentLesson : user_lesson;
        currentLevel = currentLevel ? currentLevel : user_level;
        const url = "/save_lesson_progress";
        const method = "PUT";
        const body = {
            lesson_progress: lesson_progress,
            user_lesson: currentLesson,
            user_level: currentLevel,
        };
        try {
            const data = await makeRequest(url, method, body);
            updateLocalProgress(lesson_progress);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Get bot's response from backend
    async function get_bot_response(userMessage, command, currentTest="") {
        const url = "/create_bot_response";
        const method = "POST";
        const body = {
            userMessage: userMessage,
            command: command,
            sentenceTest: currentTest,
        }

        try {
            const data = await makeRequest(url, method, body);
            return data.bot_message
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Make fetch request to backend
    async function makeRequest(url, method, body = null) {

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrf_token,
                // Include additional headers if needed
            },
            // Include the request body for methods that support it
            body: body ? JSON.stringify(body) : null,
        };

        // Using the Fetch API to send a POST request to your Django view
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error during fetch operation:', error);
            // Re-throw the error to propagate it to the next .catch block
            throw error;
        }
    }

    // Get all words in current lesson
    async function getLessonWords() {
        // Using the Fetch API to send a GET request
        try {
            const response = await fetch("/get_lesson_words", options = {
                method: "GET",
                headers: {
                    'X-CSRFToken': csrf_token,
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const responseData = await response.json();
            const newLessonWords = responseData.new_lesson_words;

            return newLessonWords
        } catch (error) {
            console.error('Error during fetch operation:', error);
            // Re-throw the error to propagate it to the next .catch block
            throw error;
        }
    }

    // Update progress variables in this file
    function updateLocalProgress(lesson_progress) {
        activity = lesson_progress.slice(0,2);
        activity_obj = {
            ps: "Practice Session",
            st: "Sentence Test",
            vt: "Verse Test",
            t: "Tafseer",
        };
        activity_name = activity_obj[activity];
        if (["ps","st"].includes(activity)) {
            activity_number = parseInt(lesson_progress.slice(-1));
        } else {
            activity_number = 0;
        }
        updateActivityName(activity_name);
    }

    // Update level and lesson in the file
    function updateLocalLevelLesson(level, lesson, newLessonWords) {
        user_level = level;
        user_lesson = lesson;
        lessonWords = newLessonWords
        updateSidebarInfo(lesson, level, activity_name, newLessonWords)
    }

    // Get the next letter in the alphabet (to update level)
    function getNextLetter(letter) {
        const code = letter.charCodeAt(0);
        let next_level;
        if (code >= 65 && code <= 89) {
            // Uppercase letter (A-Y)
            next_level = String.fromCharCode((code - 65 + 1) % 26 + 65);
        } else {
            throw new Error('Invalid input. Please provide a capital letter (A-Y).');
        }

        return next_level;
    }

    // Scroll to the bottom of chatbox
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Make send button clickable
    const sendButton = document.querySelector('#sendButton');
    sendButton.addEventListener('click', async function () {
        await processUserInput();
    });

    // Send message when user clicks enter
    userInput.addEventListener('keyup', async event => {
        if (event.key === 'Enter') {
            await processUserInput();
        }
    });
}

