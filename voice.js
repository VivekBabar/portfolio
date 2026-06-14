// voice.js
// Voice Command recognition utilizing the Web Speech API. Handles automatic navigation, chatbot triggering, and theme toggling.

class VoiceNavigator {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.micButton = null;
    this.micStatusText = null;
    
    this.commands = {
      'home': () => this.scrollToSection('home'),
      'go home': () => this.scrollToSection('home'),
      'about': () => this.scrollToSection('about'),
      'about me': () => this.scrollToSection('about'),
      'who is vivek': () => this.scrollToSection('about'),
      'skills': () => this.scrollToSection('skills'),
      'show skills': () => this.scrollToSection('skills'),
      'projects': () => this.scrollToSection('projects'),
      'portfolio': () => this.scrollToSection('projects'),
      'startups': () => this.scrollToSection('startups'),
      'companies': () => this.scrollToSection('startups'),
      'youtube': () => this.scrollToSection('youtube'),
      'videos': () => this.scrollToSection('youtube'),
      'resume': () => this.scrollToSection('resume'),
      'cv': () => this.scrollToSection('resume'),
      'experience': () => this.scrollToSection('resume'),
      'contact': () => this.scrollToSection('contact'),
      'get in touch': () => this.scrollToSection('contact'),
      'open chatbot': () => this.triggerChatbot(true),
      'close chatbot': () => this.triggerChatbot(false),
      'toggle theme': () => this.toggleTheme(),
      'dark mode': () => this.setTheme('dark'),
      'light mode': () => this.setTheme('light')
    };
  }

  init() {
    // Check speech recognition browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateUI();
    };

    this.recognition.onend = () => {
      // Auto-restart if we want continuous, unless user toggled it off
      if (this.isListening) {
        this.recognition.start();
      } else {
        this.updateUI();
      }
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log('Recognized speech:', transcript);
      this.showSpeechBubble(transcript);
      this.processCommand(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        this.isListening = false;
        this.updateUI();
      }
    };

    this.createVoiceUI();
  }

  createVoiceUI() {
    // Floating voice command mic button
    const container = document.createElement('div');
    container.id = 'voice-widget';
    container.className = 'voice-widget-container';
    container.innerHTML = `
      <div class="voice-bubble" id="voice-speech-bubble">Listening...</div>
      <button class="voice-mic-btn" id="voice-mic-btn" title="Voice Control (Say 'go to projects', 'toggle theme')">
        <svg class="mic-icon" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      </button>
    `;
    document.body.appendChild(container);

    this.micButton = document.getElementById('voice-mic-btn');
    this.micSpeechBubble = document.getElementById('voice-speech-bubble');

    this.micButton.addEventListener('click', () => this.toggleListening());
  }

  toggleListening() {
    if (!this.recognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    if (this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      this.showSpeechBubble("Voice deactivated");
    } else {
      this.recognition.start();
      this.showSpeechBubble("Listening for commands...");
    }
  }

  updateUI() {
    if (this.micButton) {
      if (this.isListening) {
        this.micButton.classList.add('listening');
      } else {
        this.micButton.classList.remove('listening');
      }
    }
  }

  showSpeechBubble(text) {
    if (this.micSpeechBubble) {
      this.micSpeechBubble.textContent = text;
      this.micSpeechBubble.classList.add('visible');
      
      // Clear bubble after 3.5 seconds
      clearTimeout(this.bubbleTimeout);
      this.bubbleTimeout = setTimeout(() => {
        this.micSpeechBubble.classList.remove('visible');
      }, 3500);
    }
  }

  processCommand(transcript) {
    // Perfect match
    if (this.commands[transcript]) {
      this.commands[transcript]();
      return;
    }

    // Fuzzy matching / containing keywords
    for (const phrase in this.commands) {
      if (transcript.includes(phrase)) {
        this.commands[phrase]();
        return;
      }
    }

    // Direct scroll to section keywords if found in transcript
    const sections = ['home', 'about', 'skills', 'projects', 'startups', 'youtube', 'resume', 'contact'];
    for (const sec of sections) {
      if (transcript.includes(sec)) {
        this.scrollToSection(sec);
        return;
      }
    }
  }

  scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  triggerChatbot(isOpen) {
    const chatbotWidget = document.getElementById('chatbot-widget');
    if (chatbotWidget) {
      if (isOpen) {
        chatbotWidget.classList.add('active');
        const input = document.getElementById('chatbot-input');
        if (input) input.focus();
      } else {
        chatbotWidget.classList.remove('active');
      }
    }
  }

  toggleTheme() {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) toggleBtn.click();
  }

  setTheme(theme) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (currentTheme !== theme) {
      this.toggleTheme();
    }
  }
}

// Instantiate voice navigator when DOM loads
window.addEventListener('DOMContentLoaded', () => {
  const voiceNav = new VoiceNavigator();
  voiceNav.init();
});
