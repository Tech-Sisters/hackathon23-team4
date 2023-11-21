document.addEventListener('DOMContentLoaded', function() {
    do_something();
    console.log("WORKING")
  });
  
  function do_something() {
    const chatMessages = document.querySelector('.chat-messages');
    const userInput = document.getElementById('userInput');
    let bubbleContainer = document.getElementById('bubbleContainer')

    function addUserMessage(message) {
        const userMessage = document.createElement('div');
        userMessage.classList.add('message', 'user-message');
        userMessage.textContent = message;
        chatMessages.appendChild(userMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the bottom
    }

    function addAssistantMessage(message) {
        const assistantMessage = document.createElement('div');
        assistantMessage.classList.add('message', 'assistant-message');
        const words = message.split(' ');
    
        const newBubbleContainer = document.createElement('div');
        newBubbleContainer.style.position = 'relative';
    
        words.forEach((word) => {
            const span = document.createElement('span');
            span.textContent = word + ' ';
            span.classList.add('clickable-word');
            span.addEventListener('click', (event) => createBubble(event, word));
            newBubbleContainer.appendChild(span);
        });
    
        assistantMessage.appendChild(newBubbleContainer);
        chatMessages.appendChild(assistantMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the bottom
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
        bubble.style.left = rect.left + 'px';

        // Remove the bubble after a short delay
        setTimeout(() => {
            bubble.remove();
        }, 2000);
    }

    function processUserInput() {
        const userMessage = userInput.value.trim();
        if (userMessage !== '') {
            addUserMessage(userMessage);
            // Simulate a bot response (you can replace this with actual API call or other logic)
            setTimeout(() => {
                addAssistantMessage('This is a bot response with clickable words.');
            }, 500);
            userInput.value = '';
        }
    }

    userInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            processUserInput();
        }
    });
  }
  