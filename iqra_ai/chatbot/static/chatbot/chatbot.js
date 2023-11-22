document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
});

function initializeChat() {
    const chatContainer = document.querySelector('.chat-container');
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
    // user_lesson - Which lesson is the user on? (eg: "A1")
    var messageCounter = 0;


    begin();

    function begin() {

        if (activity_number === "0") {
            chatInput.style.display = 'none'; // hide the input field
            const startButton = createButtonElement('Start '+activity_name);
            startButton.addEventListener('click', function() {
                startSessionContainer.style.display = 'none'; // hide the start session button
                chatInput.style.display = 'flex'; // show the input field
            });
            startSessionContainer.appendChild(startButton);
        } else {
            if (activity == "ps") {
                messages_num = messages.length;
                for (var i=0; i<messages_num; i++) {
                    if (i%2==0) {
                        addUserMessage(messages[i]);
                    } else {
                        addAssistantMessage(messages[i]);
                    }
                }
            }
        }
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

    function addAssistantMessage(message) {
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
        console.log(messageCounter)

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
    function processUserInput() {
        const userMessage = userInput.value.trim();
        if (userMessage !== '') {

            // Actually add user message to html
            addUserMessage(userMessage);

            // Send user message to the Django backend
            sendMessageToBackend(userMessage);

            simulateBotResponse();
            userInput.value = '';
        }
    }
    
    function sendMessageToBackend(message) {
        const url = "/save_message";
        const method = "POST";
        const body = {message: message};
        sendContentToBackend(url, method, body)
        .then(data => console.log('POST response:', data))
        .catch(error => console.error('Error:', error));
    }

    function sendProgressToBackend(lesson_progress) {
        const url = "/save_lesson_progress";
        const method = "PUT";
        const body = {lesson_progress: lesson_progress};
        sendContentToBackend(url, method, body)
        .then(data => console.log('PUT response:', data))
        .catch(error => console.error('Error:', error));
    }

    async function sendContentToBackend(url, method, body = null) {

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
    
    // Handle bot messages
    function simulateBotResponse() {
        // Simulate a bot response (you can replace this with actual API call or other logic)
        const botMessage = lesson_words[0];
        console.log(botMessage);
        setTimeout(() => {

            // Actually add bot messages to html
            addAssistantMessage(botMessage);

            // Send bot message to the Django backend
            // sendMessageToBackend(botMessage);
            // Above line has been commented out since messages from bot can be saved directly from the response of the openAI API call

        }, 500);
        if (activity==="ps" && messageCounter >= 20) {
            console.log('20 MESSAGES DONE');
            // update ps activity number through fetch
            var lesson_progress = 'ps' + (activity_number+1);
            sendProgressToBackend(lesson_progress);
        
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    userInput.addEventListener('keyup', event => {
        if (event.key === 'Enter') {
            processUserInput();
        }
    });
}


// TODO
// DONE: Send request of new lesson_progress when practice session of word 1 is done
// Handle lesson_progress at backend
// Then take user to word 2 (provide a non-intrusive button ideally, don't clear the chat)
// The logic should repeat itself, while taking lesson_progress into consideration (using if statements)