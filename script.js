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
const historyList = document.getElementById('historyList');
const newChatBtn = document.getElementById('newChatBtn');

let selectedModel = null;
let currentChatId = null;

// ==========================================
// 1. History & Local Storage Management
// ==========================================
let promptHistory = JSON.parse(localStorage.getItem('aiPromptHistory')) || [];

function saveHistory() {
    localStorage.setItem('aiPromptHistory', JSON.stringify(promptHistory));
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';
    
    if (promptHistory.length === 0) {
        historyList.innerHTML = '<div style="color: #666; text-align: center; margin-top: 20px; font-size: 0.85rem;">No history yet</div>';
        return;
    }

    promptHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = `history-item ${item.id === currentChatId ? 'active' : ''}`;
        
        // Snippet logic for title
        const titleSnippet = item.rawPrompt.length > 25 ? item.rawPrompt.substring(0, 25) + '...' : item.rawPrompt;
        
        div.innerHTML = `
            <div class="history-title">${titleSnippet}</div>
            <div class="history-meta">
                <span>${item.model}</span>
                <span>${item.date}</span>
            </div>
        `;
        
        div.addEventListener('click', () => loadHistoryItem(item));
        historyList.appendChild(div);
    });
}

function loadHistoryItem(item) {
    currentChatId = item.id;
    selectedModel = item.model;
    selectedAiText.textContent = selectedModel;
    selectedAiText.style.color = "var(--text-primary)";
    
    promptInput.value = item.rawPrompt;
    optimizedOutput.textContent = item.optimizedOutput;
    
    outputContainer.style.display = 'block';
    setTimeout(() => outputContainer.classList.remove('hidden'), 10);
    renderHistory(); // Update active class
}

newChatBtn.addEventListener('click', () => {
    currentChatId = null;
    promptInput.value = '';
    selectedModel = null;
    selectedAiText.textContent = 'Select your AI Model...';
    selectedAiText.style.color = "var(--text-secondary)";
    outputContainer.classList.add('hidden');
    setTimeout(() => { outputContainer.style.display = 'none'; }, 400);
    renderHistory();
});

// Initial Render
renderHistory();


// ==========================================
// 2. Interactive 3D Mouse Tilt Effect
// ==========================================
document.querySelector('.scene').addEventListener('mousemove', (e) => {
    let xAxis = (window.innerWidth / 2 - e.pageX) / 60; 
    let yAxis = (window.innerHeight / 2 - e.pageY) / 60;
    tiltCard.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
});

document.querySelector('.scene').addEventListener('mouseleave', () => {
    tiltCard.style.transform = `rotateY(0deg) rotateX(0deg)`;
});


// ==========================================
// 3. Custom Scroll & Select Logic
// ==========================================
selectWrapper.addEventListener('click', () => {
    selectWrapper.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (!selectWrapper.contains(e.target)) {
        selectWrapper.classList.remove('open');
    }
});

options.forEach(option => {
    option.addEventListener('click', (e) => {
        selectedModel = e.target.getAttribute('data-value');
        selectedAiText.textContent = selectedModel;
        selectedAiText.style.color = "var(--text-primary)";
    });
});


// ==========================================
// 4. API Fetch & Optimization Logic
// ==========================================
optimizeBtn.addEventListener('click', async () => {
    const rawPrompt = promptInput.value.trim();
    
    if (!selectedModel) {
        alert("Please select an AI model from the dropdown first!");
        return;
    }
    if (!rawPrompt) return;

    // Loading State
    const btnText = optimizeBtn.querySelector('.btn-text');
    const btnIcon = optimizeBtn.querySelector('i');
    btnText.textContent = 'Optimizing...';
    btnIcon.className = 'fa-solid fa-circle-notch fa-spin';
    optimizeBtn.disabled = true;

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw_prompt: rawPrompt, target_model: selectedModel })
        });
        
        const data = await response.json();
        const resultText = data.optimized_prompt || "Error: " + data.error;
        
        optimizedOutput.textContent = resultText;
        outputContainer.style.display = 'block';
        setTimeout(() => outputContainer.classList.remove('hidden'), 10);

        // Save to History
        if (data.optimized_prompt) {
            const newItem = {
                id: Date.now().toString(),
                rawPrompt: rawPrompt,
                model: selectedModel,
                optimizedOutput: resultText,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            };
            
            // Add to beginning of array
            promptHistory.unshift(newItem);
            currentChatId = newItem.id;
            saveHistory();
        }
        
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

// Copy button
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


// ==========================================
// 5. Advanced 3D Neural Network Canvas
// ==========================================
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];
let mouse = { x: null, y: null };

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Particle setup
class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * 2; // depth
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 0.5;
    }
    update() {
        // Slight parallax mouse reaction
        if (mouse.x) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < 200) {
                this.x -= (dx / distance) * 0.5;
                this.y -= (dy / distance) * 0.5;
            }
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(45, 212, 191, ${0.5 - this.z/4})`;
        ctx.fill();
    }
}

// Generate particles
for (let i = 0; i < 100; i++) {
    particles.push(new Particle());
}

// Mouse tracking for canvas
window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});
window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

// Animation Loop
function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw and connect particles
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        for (let j = i; j < particles.length; j++) {
            let dx = particles[i].x - particles[j].x;
            let dy = particles[i].y - particles[j].y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 120) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(139, 92, 246, ${1 - dist/120})`;
                ctx.lineWidth = 0.5;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animate);
}
animate();
