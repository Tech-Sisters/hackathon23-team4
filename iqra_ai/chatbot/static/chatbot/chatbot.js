document.addEventListener('DOMContentLoaded', function() {
    do_something();
    console.log("WORKING")
  });
  
  function do_something() {
    const chatMessages = document.querySelector('.chat-messages');
    const userInput = document.getElementById('userInput');

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
        assistantMessage.textContent = message;
        chatMessages.appendChild(assistantMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the bottom
    }

    function processUserInput() {
        const userMessage = userInput.value.trim();
        if (userMessage !== '') {
            addUserMessage(userMessage);
            // Simulate a bot response (you can replace this with actual API call or other logic)
            setTimeout(() => {
                addAssistantMessage('This is a bot response.');
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
  