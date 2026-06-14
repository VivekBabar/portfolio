// app.js
// Main application controller. Manages AJAX fetching, typing effect, scroll-progress, projects filtering, custom mouse cursor glow, and chatbot conversation.

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial setups
  initThemeToggle();
  initCustomCursor();
  initScrollProgress();
  initTypingEffect();
  fetchProjectData();
  initChatbot();
});

// ==========================================
// Theme Management
// ==========================================
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;

  // Set default theme or load from storage
  const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  // Sync initial theme with Three.js when it becomes active
  setTimeout(() => {
    if (typeof updateThreeTheme === 'function') {
      updateThreeTheme(savedTheme);
    }
  }, 100);

  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('portfolio-theme', newTheme);
    
    updateThemeIcon(newTheme);
    if (typeof updateThreeTheme === 'function') {
      updateThreeTheme(newTheme);
    }
  });
}

function updateThemeIcon(theme) {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;

  if (theme === 'dark') {
    // Sun icon
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
  } else {
    // Moon icon
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
  }
}

// ==========================================
// Custom Trailing Cursor Glow
// ==========================================
function initCustomCursor() {
  const cursor = document.createElement('div');
  cursor.className = 'cursor-glow';
  document.body.appendChild(cursor);

  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Smooth linear interpolation (lerp) for cursor follow
  function updateCursor() {
    const dx = mouseX - cursorX;
    const dy = mouseY - cursorY;

    // Adjust ease factor (0.15 for smooth drag latency)
    cursorX += dx * 0.12;
    cursorY += dy * 0.12;

    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    requestAnimationFrame(updateCursor);
  }
  updateCursor();

  // Add scale/hover triggers for buttons and links
  const targetElements = 'a, button, .project-card, .startup-card, .timeline-item, .voice-mic-btn';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(targetElements)) {
      cursor.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(targetElements)) {
      cursor.classList.remove('cursor-hover');
    }
  });
}

// ==========================================
// Scroll Progress Indicator
// ==========================================
function initScrollProgress() {
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress-bar';
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (window.scrollY / totalHeight) * 100;
    progressBar.style.width = `${scrollPercentage}%`;
  });
}

// ==========================================
// Animated Typing Effect
// ==========================================
function initTypingEffect() {
  const textTarget = document.getElementById('typing-text');
  if (!textTarget) return;

  const roles = [
    "AI Engineer",
    "Machine Learning Architect",
    "Full Stack Web Developer",
    "Future Tech Builder"
  ];

  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingDelay = 100;

  function type() {
    const currentRole = roles[roleIndex];

    if (isDeleting) {
      textTarget.textContent = currentRole.substring(0, charIndex - 1);
      charIndex--;
      typingDelay = 50;
    } else {
      textTarget.textContent = currentRole.substring(0, charIndex + 1);
      charIndex++;
      typingDelay = 120;
    }

    // Finished writing the word
    if (!isDeleting && charIndex === currentRole.length) {
      isDeleting = true;
      typingDelay = 2000; // Pause at full word
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      typingDelay = 500; // Pause before typing next word
    }

    setTimeout(type, typingDelay);
  }

  type();
}

// ==========================================
// Fetch Projects & Experience Data
// ==========================================
function fetchProjectData() {
  fetch('projects.json')
    .then(response => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(data => {
      renderStartups(data.startups);
      renderProjects(data.projects);
      renderTimeline(data.timeline);
      setupProjectsFiltering(data.projects);
    })
    .catch(error => {
      console.error("Failed to fetch project data. Using fallback local arrays.", error);
      // Fallback arrays in case file fetch fails due to CORS in direct double-clicks
      const fallback = getFallbackData();
      renderStartups(fallback.startups);
      renderProjects(fallback.projects);
      renderTimeline(fallback.timeline);
      setupProjectsFiltering(fallback.projects);
    });
}

function renderStartups(startups) {
  const container = document.getElementById('startups-grid');
  if (!container) return;

  container.innerHTML = startups.map(startup => `
    <div class="startup-card glass-container">
      <div class="startup-header">
        <span class="startup-logo-emoji">${startup.logo}</span>
        <h3 class="neon-text-blue">${startup.name}</h3>
      </div>
      <p class="startup-tagline">${startup.tagline}</p>
      <p class="startup-desc">${startup.description}</p>
      <div class="startup-impact glass-panel">
        <strong>🚀 Impact:</strong> ${startup.impact}
      </div>
      <div class="startup-tech-tags">
        ${startup.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function renderProjects(projects) {
  const container = document.getElementById('projects-grid');
  if (!container) return;

  container.innerHTML = projects.map(proj => `
    <div class="project-card glass-container" data-category="${proj.category}">
      <div class="project-thumbnail">
        <span class="project-emoji-art">${proj.image}</span>
        <div class="project-overlay glass-panel">
          <a href="${proj.github}" target="_blank" class="glow-btn-cyan">GitHub</a>
          <a href="${proj.demo}" target="_blank" class="glow-btn-purple">Live Demo</a>
        </div>
      </div>
      <div class="project-body">
        <h3 class="neon-text-purple">${proj.title}</h3>
        <p>${proj.description}</p>
        <div class="project-tags">
          ${proj.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function renderTimeline(timeline) {
  const experienceContainer = document.getElementById('timeline-experience');
  const educationContainer = document.getElementById('timeline-education');

  if (!experienceContainer || !educationContainer) return;

  const experienceHTML = [];
  const educationHTML = [];

  timeline.forEach(item => {
    const elementHTML = `
      <div class="timeline-item glass-container">
        <div class="timeline-dot"></div>
        <span class="timeline-year neon-text-blue">${item.year}</span>
        <h3 class="timeline-role">${item.role}</h3>
        <h4 class="timeline-company neon-text-purple">${item.company}</h4>
        <p class="timeline-desc">${item.description}</p>
      </div>
    `;

    if (item.type === 'experience') {
      experienceHTML.push(elementHTML);
    } else {
      educationHTML.push(elementHTML);
    }
  });

  experienceContainer.innerHTML = experienceHTML.join('');
  educationContainer.innerHTML = educationHTML.join('');
}

function setupProjectsFiltering(projects) {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active states on buttons
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      cards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px) scale(0.95)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300); // match transition length
        }
      });
    });
  });
}

// ==========================================
// AI Chatbot Assistant Logic
// ==========================================
function initChatbot() {
  const widget = document.getElementById('chatbot-widget');
  const toggleBtn = document.getElementById('chatbot-toggle-btn');
  const closeBtn = document.getElementById('chatbot-close');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  const messagesBox = document.getElementById('chatbot-messages');

  if (!widget || !toggleBtn || !closeBtn || !form || !input || !messagesBox) return;

  // Open chatbot
  toggleBtn.addEventListener('click', () => {
    widget.classList.add('active');
    input.focus();
    // Add welcome message if empty
    if (messagesBox.children.length <= 1) {
      addMessage("system", "Initializing Brain Link... Access granted. Ask me anything about Vivek's startups, projects, skills, or contact info!");
    }
  });

  // Close chatbot
  closeBtn.addEventListener('click', () => {
    widget.classList.remove('active');
  });

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    // User message
    addMessage("user", query);
    input.value = "";

    // Simulated typing thinking delay
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      const response = generateAIResponse(query);
      addMessage("bot", response);
    }, 1200);
  });
}

function addMessage(sender, text) {
  const messagesBox = document.getElementById('chatbot-messages');
  if (!messagesBox) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${sender}-message`;
  
  if (sender === 'system') {
    msgDiv.innerHTML = `<span class="chat-prefix">[SYS]:</span> ${text}`;
  } else if (sender === 'user') {
    msgDiv.innerHTML = `<span class="chat-prefix">[YOU]:</span> ${text}`;
  } else {
    msgDiv.innerHTML = `<span class="chat-prefix">[AI]:</span> ${text}`;
  }

  messagesBox.appendChild(msgDiv);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function showTypingIndicator() {
  const messagesBox = document.getElementById('chatbot-messages');
  if (!messagesBox) return;

  const indicator = document.createElement('div');
  indicator.id = 'chatbot-typing';
  indicator.className = 'chat-message bot-message typing-indicator';
  indicator.innerHTML = `<span class="chat-prefix">[AI]:</span> Processing neural nodes<span class="dot-1">.</span><span class="dot-2">.</span><span class="dot-3">.</span>`;
  
  messagesBox.appendChild(indicator);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('chatbot-typing');
  if (indicator) {
    indicator.remove();
  }
}

function generateAIResponse(query) {
  const cleanQuery = query.toLowerCase();

  // Keyword check routing
  if (cleanQuery.includes('hello') || cleanQuery.includes('hi') || cleanQuery.includes('hey') || cleanQuery.includes('greet')) {
    return "Greetings, user. I am Vivek's neural assistant. Ask me about his 'skills', 'startups', 'projects', 'resume', or 'contact' details.";
  }
  
  if (cleanQuery.includes('startup') || cleanQuery.includes('companies') || cleanQuery.includes('neuro') || cleanQuery.includes('grid')) {
    return "Vivek has co-founded and built three notable startups: <br>1. <strong>NeuroSynthetix</strong> (Synthetic Data / Custom LLMs)<br>2. <strong>CognitiveGrid</strong> (Decentralized Edge AI Platform)<br>3. <strong>Web3Intelligence</strong> (DeFi Analytics exploit prevention). Which one would you like to know more about?";
  }

  if (cleanQuery.includes('skill') || cleanQuery.includes('languages') || cleanQuery.includes('technologies') || cleanQuery.includes('stack')) {
    return "Vivek's primary core competencies include:<br>- <strong>AI & ML</strong>: Deep Learning, PyTorch, YOLOv8, LLM Custom Finetuning, CUDA.<br>- <strong>Full Stack</strong>: React, Next.js, Rust, WASM, Node.js.<br>- <strong>DevOps</strong>: AWS, Docker, Kubernetes, CI/CD pipelines.";
  }

  if (cleanQuery.includes('project') || cleanQuery.includes('portfolio') || cleanQuery.includes('astranet') || cleanQuery.includes('omniflow')) {
    return "He has engineered several high-performance open-source projects: <br>- <strong>AstraNet</strong>: AI galaxy cluster segmentation.<br>- <strong>OmniFlow</strong>: High-speed Rust-to-WASM web framework.<br>- <strong>SentientEye</strong>: Edge drone computer vision system.<br>- <strong>DevAgent.AI</strong>: Autonomic programming agent.";
  }

  if (cleanQuery.includes('contact') || cleanQuery.includes('email') || cleanQuery.includes('social') || cleanQuery.includes('linkedin') || cleanQuery.includes('github')) {
    return "You can connect with Vivek via:<br>- 📧 Email: <a href='mailto:vivek@futuretech.ai'>vivek@futuretech.ai</a><br>- 🔗 LinkedIn: <a href='#' target='_blank'>linkedin.com/in/vivekbabar</a><br>- 💻 GitHub: <a href='#' target='_blank'>github.com/vivekbabar</a><br>- 📺 YouTube: <a href='#' target='_blank'>youtube.com/@VivekBabar</a>";
  }

  if (cleanQuery.includes('resume') || cleanQuery.includes('cv') || cleanQuery.includes('education') || cleanQuery.includes('experience')) {
    return "Vivek Babar holds a B.Tech in CS from <strong>IIT Bombay</strong> and an M.S. in AI from <strong>Stanford University</strong>. He was a Senior AI Engineer at FutureTech Solutions and is currently the Lead AI Architect at CognitiveGrid. You can download his full resume in the 'Resume' section below.";
  }

  if (cleanQuery.includes('youtube') || cleanQuery.includes('video') || cleanQuery.includes('channel')) {
    return "Vivek runs a YouTube channel sharing advanced tutorials on AI models, edge computing, full-stack Rust, and building startups. Check out the YouTube section below to watch directly!";
  }

  return "Query processed, but response path matches low confidence. Please try asking specifically about his 'skills', 'startups', 'projects', 'resume', or 'contact' information.";
}

// Fallback arrays for localized environments where file:// blocks ajax fetch
function getFallbackData() {
  return {
    "startups": [
      {
        "name": "NeuroSynthetix",
        "tagline": "Synthetic Data & Custom LLM Fine-Tuning",
        "description": "Enterprise-grade synthetic data generation platform designed for medical and legal compliance. Fine-tuned specialized models that achieve 99.8% semantic accuracy while remaining 100% compliant with privacy regulations.",
        "impact": "Generated 50B+ synthetic clinical tokens; reduced model training data cost by 70% for Fortune 500 partners.",
        "tech": ["Python", "PyTorch", "Transformers", "FastAPI", "React", "Docker"],
        "logo": "🧬",
        "link": "#"
      },
      {
        "name": "CognitiveGrid",
        "tagline": "Distributed Edge AI Orchestration",
        "description": "A decentralized grid network enabling edge devices, IoT sensors, and mobile devices to collaboratively run split-inference sub-billion parameter machine learning models in real-time.",
        "impact": "Deployed across 12,000+ nodes; reduced latency for local ML executions from 180ms to 12ms.",
        "tech": ["Rust", "WASM", "WebRTC", "C++", "TensorFlow Lite", "Kubernetes"],
        "logo": "🌐",
        "link": "#"
      },
      {
        "name": "Web3Intelligence",
        "tagline": "Decentralized Financial Analytics",
        "description": "Real-time auditing platform merging smart contract event logs with deep learning predictive models to autonomously detect and stop flash-loan attacks and decentralized pool manipulations.",
        "impact": "Protected $120M+ TVL (Total Value Locked); flagged 34 zero-day exploits before block execution.",
        "tech": ["Solidity", "Go", "Python", "GraphQL", "Next.js", "AWS"],
        "logo": "🔒",
        "link": "#"
      }
    ],
    "projects": [
      {
        "id": 1,
        "title": "AstraNet",
        "category": "ai",
        "description": "Deep learning architecture built for galaxy cluster segmentation and noise reduction in low-light celestial imaging. Achieved state-of-the-art segmentation maps on Hubble Deep Field subsets.",
        "tech": ["PyTorch", "U-Net", "CUDA", "OpenCV"],
        "image": "🧬",
        "github": "https://github.com",
        "demo": "https://demo.com"
      },
      {
        "id": 2,
        "title": "OmniFlow",
        "category": "web",
        "description": "A high-performance Rust framework compiling web applications to WASM, featuring auto-syncing distributed state machines and immediate reactivity without virtual DOM overhead.",
        "tech": ["Rust", "WASM", "WebSockets", "CSS Grid"],
        "image": "🌐",
        "github": "https://github.com",
        "demo": "https://demo.com"
      },
      {
        "id": 3,
        "title": "SentientEye",
        "category": "ai",
        "description": "A real-time compute-constrained computer vision suite deployed on drone microcontrollers for spatial mapping, obstacle avoidance, and optical flow estimation in GPS-denied environments.",
        "tech": ["C++", "TensorRT", "YOLOv8", "ROS2"],
        "image": "👁️",
        "github": "https://github.com",
        "demo": "https://demo.com"
      },
      {
        "id": 4,
        "title": "DevAgent.AI",
        "category": "web",
        "description": "An autonomous AI software engineering agent that parses code directories, writes comprehensive unit tests, resolves build issues, and optimizes slow algorithms completely in the background.",
        "tech": ["Node.js", "GPT-4 API", "LangChain", "Docker"],
        "image": "🤖",
        "github": "https://github.com",
        "demo": "https://demo.com"
      }
    ],
    "timeline": [
      {
        "year": "2024 - Present",
        "role": "Lead AI Architect & Co-Founder",
        "company": "CognitiveGrid",
        "type": "experience",
        "description": "Pioneering distributed edge AI model deployment. Architected the main WebRTC P2P model split-inference protocol. Scaled node enrollment to 12K+ devices globally."
      },
      {
        "year": "2022 - 2024",
        "role": "Senior AI Engineer",
        "company": "FutureTech Solutions",
        "type": "experience",
        "description": "Built customized LLM pipelines for customer service automation. Fine-tuned corporate code assistants. Optimized inference pipelines using TensorRT and vLLM, saving 42% in cloud computing bills."
      },
      {
        "year": "2020 - 2022",
        "role": "Full Stack & ML Developer",
        "company": "Helix Labs",
        "type": "experience",
        "description": "Developed dynamic React dashboard interfaces coupled with Python microservices. Built real-time classification engines for genomic sequencing datasets. Scaled Kubernetes clusters."
      },
      {
        "year": "2018 - 2020",
        "role": "M.S. in Artificial Intelligence",
        "company": "Stanford University",
        "type": "education",
        "description": "Specialized in Deep Learning and Computer Vision. Researched multi-modal fusion networks. Published 3 papers in CVPR and NeurIPS workshops."
      },
      {
        "year": "2014 - 2018",
        "role": "B.Tech in Computer Science",
        "company": "IIT Bombay",
        "type": "education",
        "description": "Graduated with honors. Solid foundation in Algorithms, Operating Systems, Database Management Systems, and Machine Learning theory."
      }
    ]
  };
}
