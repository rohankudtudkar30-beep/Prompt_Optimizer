const BACKEND_URL = "http://127.0.0.1:8080/optimize";

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const modelSelectBtn = document.getElementById('modelSelectBtn');
const selectedModelText = document.getElementById('selectedModelText');
const modelOptions = document.querySelectorAll('.model-option');
const promptInput = document.getElementById('promptInput');
const optimizeBtn = document.getElementById('optimizeBtn');
const chatContent = document.getElementById('chatContent');
const greetingScreen = document.getElementById('greetingScreen');
const chatWrapper = document.getElementById('chatWrapper');
const historyList = document.getElementById('historyList');
const newChatBtn = document.getElementById('newChatBtn');

let selectedModel = 'Gemini 3.8 Flash'; // Default based on HTML
let promptHistory = JSON.parse(localStorage.getItem('geminiPromptHistory')) || [];

// ==========================================
// Sidebar & Navigation Logic
// ==========================================
menuToggle.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('open-mobile');
    } else {
        sidebar.classList.toggle('collapsed');
    }
});

closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('open-mobile');
});

// Auto-adjust textarea height
promptInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Dropdown Logic
modelSelectBtn.addEventListener('click', () => {
    modelSelectBtn.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (!modelSelectBtn.contains(e.target)) {
        modelSelectBtn.classList.remove('open');
    }
});

modelOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        selectedModel = e.target.getAttribute('data-value');
        selectedModelText.textContent = selectedModel;
    });
});

// ==========================================
// History Logic
// ==========================================
function renderHistory() {
    historyList.innerHTML = '';
    promptHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.textContent = item.rawPrompt.length > 30 ? item.rawPrompt.substring(0, 30) + '...' : item.rawPrompt;
        
        div.addEventListener('click', () => {
            if (window.innerWidth <= 768) sidebar.classList.remove('open-mobile');
            loadConversation(item);
        });
        historyList.appendChild(div);
    });
}

function loadConversation(item) {
    greetingScreen.style.display = 'none';
    
    // Clear chat area except greeting screen
    Array.from(chatContent.children).forEach(child => {
        if (child.id !== 'greetingScreen') child.remove();
    });

    selectedModel = item.model;
    selectedModelText.textContent = selectedModel;
    
    appendMessage('user', item.rawPrompt);
    appendMessage('ai', item.optimizedOutput);
}

newChatBtn.addEventListener('click', () => {
    if (window.innerWidth <= 768) sidebar.classList.remove('open-mobile');
    
    greetingScreen.style.display = 'block';
    promptInput.value = '';
    promptInput.style.height = 'auto';
    
    // Clear chat bubbles
    Array.from(chatContent.children).forEach(child => {
        if (child.id !== 'greetingScreen') child.remove();
    });
});

// Initial Render
renderHistory();

// ==========================================
// Chat UI & API Fetching Logic
// ==========================================
function appendMessage(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const avatar = role === 'user' 
        ? `<div class="avatar user-avatar">R</div>` 
        : `<div class="avatar ai-avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div>`;
    
    // Convert newlines to HTML breaks or wrap in pre tags for code formatting
    const formattedText = role === 'ai' ? `<pre>${text}</pre>` : text;
    
    let copyButtonHTML = '';
    if (role === 'ai') {
        copyButtonHTML = `
        <div class="action-row">
            <button class="icon-btn copy-btn" title="Copy to clipboard"><i class="fa-regular fa-copy"></i></button>
        </div>`;
    }

    messageDiv.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="text-content">${formattedText}</div>
            ${copyButtonHTML}
        </div>
    `;

    chatContent.appendChild(messageDiv);
    chatWrapper.scrollTop = chatWrapper.scrollHeight;

    // Attach copy event listener if AI
    if (role === 'ai') {
        const copyBtn = messageDiv.querySelector('.copy-btn');
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(text);
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            copyBtn.style.color = '#a8c7fa';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
                copyBtn.style.color = 'var(--text-secondary)';
            }, 2000);
        });
    }

    // Return the text container so we can update it (e.g. from "loading..." to actual text)
    return messageDiv.querySelector('.text-content pre') || messageDiv.querySelector('.text-content');
}

optimizeBtn.addEventListener('click', async () => {
    const rawPrompt = promptInput.value.trim();
    if (!rawPrompt) return;

    // Hide greeting, append user message, clear input
    greetingScreen.style.display = 'none';
    appendMessage('user', rawPrompt);
    promptInput.value = '';
    promptInput.style.height = 'auto';

    // Append AI placeholder
    const aiTextContainer = appendMessage('ai', 'Optimizing and aligning formatting for ' + selectedModel + '...');
    
    // Disable input while fetching
    optimizeBtn.disabled = true;
    promptInput.disabled = true;

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw_prompt: rawPrompt, target_model: selectedModel })
        });
        
        const data = await response.json();
        const finalOutput = data.optimized_prompt || "Error: " + data.error;
        
        // Update the placeholder bubble
        aiTextContainer.textContent = finalOutput;

        // Save to History
        if (data.optimized_prompt) {
            promptHistory.unshift({
                rawPrompt: rawPrompt,
                model: selectedModel,
                optimizedOutput: finalOutput,
                id: Date.now()
            });
            localStorage.setItem('geminiPromptHistory', JSON.stringify(promptHistory));
            renderHistory();
        }
        
    } catch (error) {
        aiTextContainer.textContent = "Connection Error. Ensure your Python backend is running locally on port 8080.";
    }

    // Re-enable input
    optimizeBtn.disabled = false;
    promptInput.disabled = false;
    promptInput.focus();
});

// Allow Enter key to send (Shift+Enter for new line)
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        optimizeBtn.click();
    }
});
