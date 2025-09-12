// Supabase-based content script for JOT Snatcher Chrome Extension
console.log('🚀 JOT Snatcher content script loaded (Supabase)');

// Import Supabase auth service
import { supabaseAuth } from '../services/supabaseAuth';

// Simple test to verify script is running
if (typeof window !== 'undefined') {
  console.log('✅ Window object available');
  
  // Add simple debugging tools directly
  (window as any).testJOT = () => {
    console.log('🎯 JOT Snatcher is working!');
    console.log('Current URL:', window.location.href);
    console.log('Current site:', window.location.hostname);
    return 'JOT Snatcher is working!';
  };
  
  (window as any).checkSelectors = () => {
    console.log('🔍 Checking common job selectors...');
    const selectors = [
      'h1',
      '[data-testid*="title"]',
      '[data-test*="title"]',
      '.job-title',
      '.position-title'
    ];
    
    selectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`✅ Found: ${selector} → "${element.textContent?.trim().substring(0, 50)}..."`);
      } else {
        console.log(`❌ Not found: ${selector}`);
      }
    });
  };
}

// Drag functionality for iframe
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Store original dimensions for fullscreen toggle
let originalWidth = '500px';
let originalHeight = '700px';
let originalTop = '20px';
let originalRight = '20px';
let originalLeft = 'auto';
let originalBottom = 'auto';

// Check authentication and inject appropriate UI
function checkAuthAndInjectButton() {
  console.log('🔍 Checking authentication status before injecting button...');
  
  const authState = supabaseAuth.getAuthState();
  console.log('🔍 Current auth state:', authState);
  
  if (authState.isAuthenticated) {
    console.log('✅ User is authenticated, injecting floating button');
    injectFloatingButton();
  } else {
    console.log('⚠️ User is not authenticated, showing login prompt instead');
    injectLoginPrompt();
  }
}

// Inject floating button
function injectFloatingButton() {
  console.log('Injecting floating button...');
  
  // Remove existing button if any
  const existingButton = document.getElementById('jot-snatcher-floating-button');
  if (existingButton) {
    existingButton.remove();
  }

  // Create floating button
  const button = document.createElement('div');
  button.id = 'jot-snatcher-floating-button';
  button.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      border: 2px solid white;
    " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    </div>
  `;

  // Add click handler
  button.addEventListener('click', () => {
    console.log('Floating button clicked!');
    openIframePanel();
  });

  document.body.appendChild(button);
  console.log('Floating button added to page');
}

// Inject login prompt
function injectLoginPrompt() {
  console.log('Injecting login prompt...');
  
  // Remove existing prompt if any
  const existingPrompt = document.getElementById('jot-snatcher-login-prompt');
  if (existingPrompt) {
    existingPrompt.remove();
  }

  // Create login prompt
  const prompt = document.createElement('div');
  prompt.id = 'jot-snatcher-login-prompt';
  prompt.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      width: 200px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      border: 1px solid #e5e7eb;
    ">
      <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 16px;">JOT Snatcher</h3>
      <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">Please log in to use the extension</p>
      <button onclick="window.open('https://sp-jot-platform.vercel.app/', '_blank')" style="
        width: 100%;
        padding: 8px 16px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      ">Open Webapp</button>
    </div>
  `;

  document.body.appendChild(prompt);
  console.log('Login prompt injected');
}

// Open iframe panel
function openIframePanel() {
  console.log('Creating iframe panel...');
  
  // Remove existing panel if any
  const existingPanel = document.getElementById('jot-snatcher-iframe-panel');
  if (existingPanel) {
    existingPanel.remove();
  }

  // Create iframe panel
  const panel = document.createElement('div');
  panel.id = 'jot-snatcher-iframe-panel';
  panel.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      width: 500px;
      height: 700px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      z-index: 10001;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
    ">
      <div style="
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f9fafb;
        border-radius: 8px 8px 0 0;
      ">
        <h3 style="margin: 0; color: #374151; font-size: 18px;">JOT Snatcher</h3>
        <button onclick="document.getElementById('jot-snatcher-iframe-panel').remove()" style="
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
        ">×</button>
      </div>
      <iframe 
        src="${chrome.runtime.getURL('src/iframe/index.html')}"
        style="
          flex: 1;
          border: none;
          border-radius: 0 0 8px 8px;
        "
        onload="console.log('Iframe loaded')"
      ></iframe>
    </div>
  `;

  document.body.appendChild(panel);
  console.log('Iframe panel created and displayed');
}

// Initialize the content script
function initialize() {
  console.log('🔧 Initializing JOT Snatcher content script...');
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(checkAuthAndInjectButton, 2000);
    });
  } else {
    setTimeout(checkAuthAndInjectButton, 2000);
  }
  
  // Listen for auth state changes
  supabaseAuth.addAuthStateListener((authState) => {
    console.log('🔄 Auth state changed in content script:', authState);
    if (authState.isAuthenticated) {
      console.log('✅ User authenticated, removing login prompt and showing floating button');
      document.getElementById('jot-snatcher-login-prompt')?.remove();
      injectFloatingButton();
    } else {
      console.log('⚠️ User not authenticated, removing floating button and showing login prompt');
      document.getElementById('jot-snatcher-floating-button')?.remove();
      injectLoginPrompt();
    }
  });
}

// Start the content script
initialize();
