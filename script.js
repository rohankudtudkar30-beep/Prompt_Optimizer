// =====================================================================
// 📍 PIN 2: JAVASCRIPT API ENDPOINT
// Because the Python backend securely handles the AI API key, 
// your frontend just needs to point to the local FastAPI server port.
// =====================================================================
const BACKEND_URL = "http://127.0.0.1:8080/optimize";

const optimizeBtn = document.getElementById('optimizeBtn');
const promptInput = document.getElementById('promptInput');
const outputContainer = document.getElementById('outputContainer');
const optimizedOutput = document.getElementById('optimizedOutput');
const copyBtn = document.getElementById('copyBtn');
const themeToggle = document.getElementById('themeToggle');
const modelPills = document.querySelectorAll('.model-pill');

let selectedModel = 'ChatGPT (GPT-4o/o3)';

// Model Selection
modelPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
        modelPills.forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        selectedModel = e.target.dataset.model;
    });
});

// Optimize Button Logic
optimizeBtn.addEventListener('click', async () => {
    const rawPrompt = promptInput.value.trim();
    if (!rawPrompt) return;

    // Loading State
    optimizeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Optimizing...';
    optimizeBtn.disabled = true;
    outputContainer.classList.add('hidden');

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                raw_prompt: rawPrompt, 
                target_model: selectedModel 
            })
        });
        
        const data = await response.json();

        if (data.optimized_prompt) {
            optimizedOutput.textContent = data.optimized_prompt;
        } else {
            optimizedOutput.textContent = "Error: " + data.error;
        }
        
        // Remove hidden class to trigger CSS fade-in animation
        outputContainer.style.display = 'block';
        setTimeout(() => outputContainer.classList.remove('hidden'), 10);
        
    } catch (error) {
        optimizedOutput.textContent = "Failed to connect to the backend server. Is it running on port 8080?";
        outputContainer.style.display = 'block';
        setTimeout(() => outputContainer.classList.remove('hidden'), 10);
    }

    // Reset Button
    optimizeBtn.innerHTML = 'Optimize <i class="fa-solid fa-arrow-right"></i>';
    optimizeBtn.disabled = false;
});

// Copy to Clipboard
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(optimizedOutput.textContent);
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    copyBtn.style.color = 'var(--accent-color)';
    
    setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.style.color = 'var(--text-color)';
    }, 2000);
});

// Dark/Light Theme Toggle
themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
});