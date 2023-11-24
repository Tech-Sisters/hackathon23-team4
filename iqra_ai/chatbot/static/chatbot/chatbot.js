document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
});

function initializeChat() {
    // const chatContainer = document.querySelector('.chat-container');
    const startSessionContainer = document.querySelector('.start-session-container');
    const chatInput = document.querySelector('.chat-input');
    
    const chatMessages = document.querySelector('.chat-messages');
    const userInput = document.getElementById('userInput');

    // VARIABLES FROM HTML:
    // lesson_words - What are the words in the current lesson? (to display in the sidebar)
    // activity - Is it a practice session (ps), a sentence test (st), a verse test (vt) or a tafseer (t)
    // activity_name - What is the name of the activity in human readable format? (eg: "Practice Session")
    // activity_number - If the activity is a ps/st, then which word are we on?
    // messages - If it is a practice session, what messages have been sent? (to recreate practice session chat)
    // user_level - Which level is the user on? (eg: "A")
    // user_lesson - Which lesson is the user on? (eg: 1)
    var messageCounter = 0;
    var sentenceTestTries = 0;
    var verseTestTries = 0;

    begin();

    function begin() {
        console.log("begin ",activity+activity_number);

        if (activity === "ps") {
            if (activity_number === 0) {
                startButton();
            } else {
                messages_num = messages.length;
                for (var i=0; i<messages_num; i++) {
                    if (i%2==0) {
                        addUserMessage(messages[i]);
                    } else {
                        addBotMessage(messages[i]);
                    }
                }
            }

        } else if (activity === 'st') {
            // console.log("ACTIVITY IS ST!");
            if (activity_number === 0) {
                // console.log("ACTIVITY_NUMBER IS 0!");
                startButton();
            } else {
                startSentenceTestWord();
            }

        } else if (activity === 'vt') {
            console.log("begin vt");
            startButton();
        } else if (activity === 't') {
            console.log("begin tafseer");
            startButton();
        }

    }

    // Add a new function to handle sentence test words
    function startSentenceTestWord() {
        const sentenceTestIndex = activity_number-1
        if (sentenceTestIndex < 5) {
            const sentenceTestWord = lesson_words[sentenceTestIndex]; // replace with api call
            const botMessage = `Translate: "${sentenceTestWord}"`; 
            addBotMessage(botMessage);
            // Add logic to handle user response and check correctness (not implemented in this example)
            // After handling user response, move on to the next word
        } else {
            // Move on to the next phase (e.g., verse test)
            // You can implement logic or call a function here to handle the next phase
            console.log('Sentence tests completed. Moving on to the next phase.');
        }
    }

    function startVerseTest() {
        const verseTestIndex = activity_number - 1;
    
        if (verseTestIndex < 5) {
            const verseToTranslate = "وَإِنْ كُنْتُمْ فِي رَيْبٍ مِمَّا نَزَّلْنَا عَلَىٰ عَبْدِنَا فَأْتُوا بِسُورَةٍ مِنْ مِثْلِهِ" //replace with api call
            const botMessage = `Translate the verse: "${verseToTranslate}"`;
            addBotMessage(botMessage);

        } else {
            // Move on to the next phase (e.g., another activity)
            console.log('Verse tests completed. Moving on to the next phase.');
        }
    }

    function showTafseer() {
        console.log("Showing tafseer now")
        // const botMessage = get_bot_response(null, "tafseer");
        const botMessage = "The tafseer is this:";
        addBotMessage(botMessage);
    }
        

    function startButton() {

        chatInput.style.display = 'none'; // hide the input field
        const startButton = createButtonElement('Start '+activity_name);
        console.log("Created button for",activity_name);

        startSessionContainer.style.display = 'flex'; // show startSessionContainer
        startSessionContainer.innerHTML = ''; // Clear the content of startSessionContainer

        startButton.addEventListener('click', async function() {
            
            startSessionContainer.style.display = 'none'; // hide the start session button
            chatInput.style.display = 'flex'; // show the input field

            if (['ps','st'].includes(activity)) {
                var lesson_progress = activity + '1';
                await sendProgressToBackend(lesson_progress).then(() => {
                    if (activity === 'st') {
                        startSentenceTestWord();
                    }
                    // if practice session, then send the 5 words to user
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

    function createButtonElement(activity_btn_msg) {
        const buttonElement = document.createElement('button');
        buttonElement.classList.add('start-activity-btn');
        buttonElement.textContent = activity_btn_msg;

        return buttonElement;
    }

    function addUserMessage(message) {
        const userMessage = createMessageElement(message, 'user-message');
        chatMessages.appendChild(userMessage);
        scrollToBottom();
    }

    function addBotMessage(message) {
        const assistantMessage = createMessageElement(message, 'assistant-message', true);
        chatMessages.appendChild(assistantMessage);
        scrollToBottom();
    }

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
                span.addEventListener('click', event => createBubble(event, word));
                wordContainer.appendChild(span);
            });
            messageElement.appendChild(wordContainer);
        } else {
            messageElement.textContent = message;
        }
        
        messageCounter++;
        // console.log("Messages so far: ",messageCounter)

        return messageElement;
    }

    function createBubble(event, word) {
        // Remove existing bubbles
        const existingBubbles = document.querySelectorAll('.bubble');
        existingBubbles.forEach((bubble) => bubble.remove());

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.textContent = word;
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
            await sendMessageToBackend(userMessage)
            userInput.value = '';

            if (activity==="ps") {
                if (messageCounter < 1) {
                    const botMessage = await get_bot_response(userMessage, "chat_completion");
                    // console.log(`${20-messageCounter} messages left. Bot message incoming: ${botMessage}`)
                    addBotMessage(botMessage);
                } else {
                    console.log('20 MESSAGES DONE');
                    const botMessage = await get_bot_response(userMessage, "chat_completion");
                    addBotMessage(botMessage);
                    
                    console.log(activity+activity_number,"done")
                    // update ps activity number through fetch
                    var lesson_progress = 'ps' + (activity_number+1);

                    if (lesson_progress === 'ps6') {
                        lesson_progress = 'st0'
                    }

                    console.log("new lesson_progress: "+lesson_progress)
                    await sendProgressToBackend(lesson_progress);

                    messageCounter = 0;
                }
            } else if (activity === "st" && activity_number >= 1) {
                // const result = get_bot_response(userMessage, "correct_translation"); // Should be "correct" or "wrong"
                const result = "right";
                var botMessage;
                if (result === "correct") {
                    botMessage = "That is the right translation!";

                    var lesson_progress = 'st' + (activity_number+1);

                    if (lesson_progress === 'st6') {

                        // User has completed all 4 lessons in the level
                        if (user_lesson >= 4) { 
                            // User is ready to take the verse test
                            lesson_progress = 'vt';

                        } else {
                            // User has completed sentence test of lesson 1 and is going to start lesson 2
                            lesson_progress = 'ps0';
                            user_lesson++;
                        }
                    }
                    await sendProgressToBackend(lesson_progress)

                } else if (sentenceTestTries < 2) {
                    botMessage = "That's not right, try again!";
                    sentenceTestTries++;
                } else {
                    botMessage = "You have incorrectly translated 3 times. Please go back to practice sessions";
                    sentenceTestTries = 0;
                    var lesson_progress = 'ps0';
                    await sendProgressToBackend(lesson_progress);
                }
                addBotMessage(botMessage);
                if (activity=='st') {
                    startSentenceTestWord();
                }
            } else if (activity == "vt") {
                // Check correctness (you need to implement actual correctness check)
                // const result = get_bot_response(userMessage, "correct_translation"); // Should be "correct" or "wrong"
                const result = "right";
                    
                if (result === "correct") {
                    botMessage = "That is the right translation!";

                    var lesson_progress = 't';
                    await sendProgressToBackend(lesson_progress);

                } else if (verseTestTries < 2) {
                    botMessage = "That's not right, try again!";
                    verseTestTries++;
                } else {
                    botMessage = "You have incorrectly translated the verse 3 times";
                    verseTestTries = 0;
                    var lesson_progress = 't';
                    await sendProgressToBackend(lesson_progress);
                }
                addBotMessage(botMessage);

                if (activity=='vt') {
                    startVerseTest();
                }
            }
            
            // lesson_progress is undefined when user enters something in vt currently
            if (['ps0','st0','vt','t'].includes(lesson_progress)) {
                begin()
            }

        }
    }
    
    async function sendMessageToBackend(message) {
        const url = "/save_message";
        const method = "POST";
        const body = {message: message};
        try {
            const data = await makeRequest(url, method, body);
            console.log('POST response:', data);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function sendProgressToBackend(lesson_progress) {
        const url = "/save_lesson_progress";
        const method = "PUT";
        const body = {
            lesson_progress: lesson_progress,
            user_lesson: user_lesson,
        };
        try {
            const data = await makeRequest(url, method, body);
            console.log('PUT response:', data, lesson_progress, user_lesson);
            updateLocalProgress(lesson_progress);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function get_bot_response(userMessage, command) {
        // console.log("User message received:", userMessage)
        const url = "/create_bot_response";
        const method = "POST";
        const body = {
            userMessage: userMessage,
            command: command,
        };
        try {
            const data = await makeRequest(url, method, body);
            console.log('POST response:', data);
            return data.bot_message
        } catch (error) {
            console.error('Error:', error);
        }
    }

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
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    userInput.addEventListener('keyup', async event => {
        if (event.key === 'Enter') {
            await processUserInput();
        }
    });
}

