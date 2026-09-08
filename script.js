const BACKEND_URL = "http://127.0.0.1:8080/optimize";

// DOM Elements
const selectWrapper = document.getElementById('aiSelectWrapper');
const selectedAiText = document.getElementById('selectedAiText');
const options = document.querySelectorAll('.custom-option');
const optimizeBtn = document.getElementById('optimizeBtn');
const promptInput = document.getElementById('promptInput');
const outputContainer = document.getElementById('outputContainer');
const optimizedOutput = document.getElementById('optimizedOutput');
const copyBtn = document.getElementById('copyBtn');
const tiltCard = document.getElementById('tiltCard');

let selectedModel = null;

// ==========================================
// 1. Interactive 3D Mouse Tilt Effect
// ==========================================
document.addEventListener('mousemove', (e) => {
    // Calculate mouse position relative to the center of the screen
    let xAxis = (window.innerWidth / 2 - e.pageX) / 45; // Divide by higher number for subtler effect
    let yAxis = (window.innerHeight / 2 - e.pageY) / 45;
    
    // Apply 3D rotation
    tiltCard.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
});

// Reset tilt when mouse leaves window
document.addEventListener('mouseleave', () => {
    tiltCard.style.transform = `rotateY(0deg) rotateX(0deg)`;
});

// ==========================================
// 2. Custom Scroll & Select Logic
// ==========================================
selectWrapper.addEventListener('click', (e) => {
    // Toggle the dropdown
    selectWrapper.classList.toggle('open');
});

// Close dropdown if clicked outside
document.addEventListener('click', (e) => {
    if (!selectWrapper.contains(e.target)) {
        selectWrapper.classList.remove('open');
    }
});

// Handle option selection
options.forEach(option => {
    option.addEventListener('click', (e) => {
        selectedModel = e.target.getAttribute('data-value');
        selectedAiText.textContent = selectedModel;
        selectedAiText.style.color = "var(--text-primary)";
    });
});

// ==========================================
// 3. API Fetch & Optimization Logic
// ==========================================
optimizeBtn.addEventListener('click', async () => {
    const rawPrompt = promptInput.value.trim();
    
    if (!selectedModel) {
        alert("Please select an AI model from the dropdown first!");
        return;
    }
    if (!rawPrompt) return;

    // Set Loading State
    const btnText = optimizeBtn.querySelector('.btn-text');
    const btnIcon = optimizeBtn.querySelector('i');
    btnText.textContent = 'Optimizing...';
    btnIcon.className = 'fa-solid fa-circle-notch fa-spin';
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
        
        // Show output
        outputContainer.style.display = 'block';
        setTimeout(() => outputContainer.classList.remove('hidden'), 10);
        
    } catch (error) {
        optimizedOutput.textContent = "Failed to connect to the backend server. Make sure it's running on port 8080.";
        outputContainer.style.display = 'block';
        setTimeout(() => outputContainer.classList.remove('hidden'), 10);
    }

    // Reset Button
    btnText.textContent = 'Optimize';
    btnIcon.className = 'fa-solid fa-wand-magic-sparkles';
    optimizeBtn.disabled = false;
});

// ==========================================
// 4. Copy Output Logic
// ==========================================
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(optimizedOutput.textContent);
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
    copyBtn.style.color = '#2dd4bf';
    
    setTimeout(() => {
        copyBtn.innerHTML = originalHTML;
        copyBtn.style.color = 'var(--text-secondary)';
    }, 2000);
});
