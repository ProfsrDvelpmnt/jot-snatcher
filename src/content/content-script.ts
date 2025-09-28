
// Content script for JOT Snatcher Chrome Extension
console.log('🚀 JOT Snatcher content script loaded');

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

// Add more debugging tools directly (without imports for now)
if (typeof window !== 'undefined') {
  (window as any).testLinkedIn = () => {
    console.log('🔍 Testing LinkedIn selectors...');
    const selectors = {
      title: ['h1', '[data-testid*="title"]', '.job-title'],
      company: ['[data-testid*="company"]', '.company-name'],
      location: ['[data-testid*="location"]', '.location']
    };
    
    Object.entries(selectors).forEach(([key, selArray]) => {
      console.log(`\n📋 Testing ${key}:`);
      selArray.forEach((selector, i) => {
        const element = document.querySelector(selector);
        if (element) {
          console.log(`✅ ${key}[${i}]: "${selector}" → "${element.textContent?.trim().substring(0, 50)}..."`);
        } else {
          console.log(`❌ ${key}[${i}]: "${selector}" → not found`);
        }
      });
    });
  };
  
  (window as any).extractJobData = () => {
    console.log('🔍 Extracting job data...');
    const jobData = {
      position: document.querySelector('h1')?.textContent?.trim() || 'Not found',
      company: document.querySelector('[data-testid*="company"]')?.textContent?.trim() || 
               document.querySelector('.company-name')?.textContent?.trim() || 'Not found',
      location: document.querySelector('[data-testid*="location"]')?.textContent?.trim() || 
                document.querySelector('.location')?.textContent?.trim() || 'Not specified',
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Extracted job data:', jobData);
    return jobData;
  };
}

// Import the main functionality (static imports)
import { extractionManager } from '@/extractors';
import { ExtractorDebugger } from '@/utils/extractor-debugger';
import { FallbackExtractor } from '@/utils/fallback-extractor';
// Note: Content scripts can't directly import ES modules, using Chrome messaging instead

console.log('✅ All modules imported successfully');

// Add debugging tools to window for console access
if (typeof window !== 'undefined') {
  try {
    (window as any).JOTDebugger = ExtractorDebugger;
    (window as any).testExtraction = () => ExtractorDebugger.testAllExtractors();
    (window as any).debugCurrentSite = async () => {
      const site = window.location.hostname.toLowerCase();
      if (site.includes('linkedin')) return await ExtractorDebugger.debugExtraction('linkedin');
      if (site.includes('monster')) return await ExtractorDebugger.debugExtraction('monster');
      if (site.includes('ziprecruiter')) return await ExtractorDebugger.debugExtraction('ziprecruiter');
      if (site.includes('greenhouse')) return await ExtractorDebugger.debugExtraction('greenhouse');
      if (site.includes('hiring.cafe')) return await ExtractorDebugger.debugExtraction('hiring-cafe');
      if (site.includes('indeed')) return await ExtractorDebugger.debugExtraction('indeed');
      console.log('No supported site detected');
      return null;
    };
    (window as any).generateReport = () => ExtractorDebugger.generateTestReport();
    (window as any).tryFallback = () => FallbackExtractor.extractWithCommonPatterns();
    
    console.log('🔧 Debugging tools available:', {
      testJOT: typeof (window as any).testJOT,
      checkSelectors: typeof (window as any).checkSelectors,
      testLinkedIn: typeof (window as any).testLinkedIn,
      extractJobData: typeof (window as any).extractJobData,
      JOTDebugger: typeof (window as any).JOTDebugger,
      testExtraction: typeof (window as any).testExtraction,
      debugCurrentSite: typeof (window as any).debugCurrentSite,
      generateReport: typeof (window as any).generateReport,
      tryFallback: typeof (window as any).tryFallback
    });
  } catch (error) {
    console.error('❌ Error setting up debugging tools:', error);
  }
}


// Drag functionality for iframe
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Store original dimensions for fullscreen toggle
let originalWidth = '500px';
let originalHeight = '800px';
let originalTop = '20px';
let originalRight = '20px';
let originalLeft = 'auto';
let originalBottom = 'auto';
let originalBorderRadius = '12px';

const startDrag = (e: MouseEvent, iframe: HTMLElement) => {
  const target = e.target as HTMLElement;
  if (target.closest('button') || target.closest('select')) {
    return;
  }
  
  isDragging = true;
  const rect = iframe.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;
  
  iframe.style.cursor = 'grabbing';
  iframe.style.transition = 'none';
  
  e.preventDefault();
};

const drag = (e: MouseEvent, iframe: HTMLElement) => {
  if (!isDragging) return;
  
  const newX = e.clientX - dragOffset.x;
  const newY = e.clientY - dragOffset.y;
  
  const maxX = window.innerWidth - iframe.offsetWidth;
  const maxY = window.innerHeight - iframe.offsetHeight;
  
  const constrainedX = Math.max(0, Math.min(newX, maxX));
  const constrainedY = Math.max(0, Math.min(newY, maxY));
  
  iframe.style.left = `${constrainedX}px`;
  iframe.style.top = `${constrainedY}px`;
  iframe.style.right = 'auto';
  iframe.style.bottom = 'auto';
  
  e.preventDefault();
};

const stopDrag = (iframe: HTMLElement) => {
  if (!isDragging) return;
  
  isDragging = false;
  iframe.style.cursor = 'move';
  iframe.style.transition = 'all 0.3s ease';
  
  const rect = iframe.getBoundingClientRect();
  localStorage.setItem('jot-iframe-position', JSON.stringify({
    x: rect.left,
    y: rect.top
  }));
};

// Update iframe header with user information
async function updateIframeHeader(userName: string | null, userEmail: string | null, isWebappConnected: boolean = false) {
  console.log('🔍 Content script: updateIframeHeader called with:', { userName, userEmail, isWebappConnected });
  
  // Check Supabase connection status
  const isSupabaseConnected = await checkSupabaseConnection();
  console.log('🔍 Supabase connection status:', isSupabaseConnected);
  
  const iframe = document.getElementById('jot-snatcher-iframe');
  if (!iframe) {
    console.log('⚠️ Content script: No iframe found for header update');
    return;
  }
  
  console.log('🔍 Content script: Found iframe, looking for header...');
  
  // Try multiple selectors to find the header
  let header = iframe.querySelector('div[style*="background: #ba745f"]') as HTMLElement;
  if (!header) {
    // Try alternative selector
    header = iframe.querySelector('div[style*="background-color: #ba745f"]') as HTMLElement;
  }
  if (!header) {
    // Try finding any div with background color
    header = iframe.querySelector('div[style*="background"]') as HTMLElement;
  }
  
  if (!header) {
    console.log('⚠️ Content script: No header found in iframe');
    return;
  }
  
  console.log('🔍 Content script: Found header, looking for title...');
  
  // Find the title section - try multiple selectors
  let title = header.querySelector('div[style*="display: flex; align-items: center"]') as HTMLElement;
  if (!title) {
    // Try alternative selector
    title = header.querySelector('div[style*="display: flex"]') as HTMLElement;
  }
  if (!title) {
    // Try finding any div with flex display
    title = header.querySelector('div[style*="flex"]') as HTMLElement;
  }
  
  if (!title) {
    console.log('⚠️ Content script: No title section found in header');
    return;
  }
  
  console.log('🔍 Content script: Found title section, updating...');
  
  // Always create the userName element, even if empty
  const webappStatus = isWebappConnected ? 'Connected to SP-JOT' : 'Not Connected to SP-JOT';
  const webappColor = isWebappConnected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
  const supabaseStatus = isSupabaseConnected ? 'Supabase Connected' : 'Supabase Disconnected';
  const supabaseColor = isSupabaseConnected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
  
  title.innerHTML = `
    <img src="${chrome.runtime.getURL('icons/spjot-48.png')}" style="width: 48px; height: 48px; flex-shrink: 0; display: block;" alt="JOT" onerror="console.error('Failed to load icon:', this.src)">
    <div style="display: flex; flex-direction: column; align-items: flex-start; min-width: 0;">
      <span style="font-size: 28px; font-weight: 900; line-height: 1.1; margin-bottom: 4px;">Snatcher</span>
      <span style="font-size: 16px; opacity: 0.9; line-height: 1.2; font-weight: 400;">Collects Jobs For <span id="jot-snatcher-webapp-status" style="display: none;">${webappStatus}</span><span id="jot-snatcher-supabase-status" style="display: none;">${supabaseStatus}</span><span id="jot-snatcher-username" style="font-weight: 600; color: rgba(255, 255, 255, 0.95);"></span></span>
    </div>
  `;
  
  // Now update the userName element if we have user data
  if (userName && userEmail) {
    const userNameElement = title.querySelector('#jot-snatcher-username') as HTMLElement;
    if (userNameElement) {
      userNameElement.textContent = userName;
      userNameElement.style.color = 'rgba(255, 255, 255, 0.9)';
      console.log('✅ Content script: Updated iframe header with user name:', userName);
    }
  }

  // Send webapp connection status update to iframe content
  const iframeElement = iframe.querySelector('iframe') as HTMLIFrameElement;
  if (iframeElement && iframeElement.contentWindow) {
    console.log('📤 Content script: Sending webapp connection status to iframe:', isWebappConnected);
    iframeElement.contentWindow.postMessage({
      type: 'WEBAPP_CONNECTION_UPDATE',
      isWebappConnected: isWebappConnected
    }, '*');
  }
}

// Update userName element in iframe header
function updateIframeHeaderUserName(userName: string | null, userEmail: string | null) {
  console.log('🔍 Content script: updateIframeHeaderUserName called with:', { userName, userEmail });
  
  const iframe = document.getElementById('jot-snatcher-iframe');
  if (!iframe) {
    console.log('⚠️ Content script: No iframe found for userName update');
    return;
  }
  
  const userNameElement = iframe.querySelector('#jot-snatcher-username') as HTMLElement;
  if (!userNameElement) {
    console.log('⚠️ Content script: No userName element found in iframe header');
    return;
  }
  
  if (userName && userEmail) {
    userNameElement.textContent = userName;
    userNameElement.style.color = 'rgba(255, 255, 255, 0.9)';
    console.log('✅ Content script: Updated iframe header userName element:', userName);
  } else {
    userNameElement.textContent = '';
    console.log('✅ Content script: Cleared iframe header userName element');
  }
}

// Update sign out button visibility based on authentication state
function updateIframeSignOutButton(isAuthenticated: boolean) {
  console.log('🔍 Content script: updateIframeSignOutButton called with:', isAuthenticated);
  
  const iframe = document.getElementById('jot-snatcher-iframe');
  if (!iframe) {
    console.log('⚠️ Content script: No iframe found for sign out button update');
    return;
  }
  
  const signOutBtn = iframe.querySelector('button[title="Sign Out"]') as HTMLElement;
  if (!signOutBtn) {
    console.log('⚠️ Content script: No sign out button found in iframe header');
    return;
  }
  
  if (isAuthenticated) {
    signOutBtn.style.display = 'flex';
    console.log('✅ Content script: Showed sign out button');
    console.log('🔍 Content script: Sign out button element:', signOutBtn);
    console.log('🔍 Content script: Sign out button onclick handler:', signOutBtn.onclick);
  } else {
    signOutBtn.style.display = 'none';
    console.log('✅ Content script: Hid sign out button');
  }
}

// Iframe panel functionality
function openIframePanel() {
  // Check if iframe already exists
  const existingIframe = document.getElementById('jot-snatcher-iframe');
  if (existingIframe) {
    console.log('Iframe panel already exists, toggling visibility');
    toggleIframePanel();
    return;
  }

  console.log('Creating iframe panel...');

  // Detect persistent banner and get optimal position for iframe
  const { top: iframeTop, zIndex: iframeZIndex } = detectPersistentBannerAndGetPosition();

  // Create iframe container
  const iframeContainer = document.createElement('div');
  iframeContainer.id = 'jot-snatcher-iframe';
  iframeContainer.style.cssText = `
    position: fixed;
    top: ${iframeTop};
    right: 20px;
    width: 520px;
    height: 820px;
    max-height: 85vh;
    background: white;
    border: 2px solid #ba745f;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: ${parseInt(iframeZIndex) + 1};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
    cursor: move;
  `;

  // Create header with controls
  const header = document.createElement('div');
  header.style.cssText = `
    background: #ba745f;
    color: white;
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    min-height: 100px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  `;

  const title = document.createElement('div');
  title.style.cssText = `
    display: flex;
    align-items: center;
    gap: 16px;
    font-weight: bold;
    flex-shrink: 0;
    min-width: 0;
  `;
  title.innerHTML = `
    <img src="${chrome.runtime.getURL('icons/spjot-48.png')}" style="width: 48px; height: 48px; flex-shrink: 0; display: block;" alt="JOT" onerror="console.error('Failed to load icon:', this.src)">
    <div style="display: flex; flex-direction: column; align-items: flex-start; min-width: 0;">
      <span style="font-size: 28px; font-weight: 900; line-height: 1.1; margin-bottom: 4px;">Snatcher</span>
      <span style="font-size: 16px; opacity: 0.9; line-height: 1.2; font-weight: 400;">Collects Jobs For <span id="jot-snatcher-username" style="font-weight: 600; color: rgba(255, 255, 255, 0.95);"></span></span>
    </div>
  `;

  const controls = document.createElement('div');
  controls.style.cssText = `
    display: flex;
    gap: 6px;
    align-items: center;
    flex-shrink: 0;
    margin-left: 20px;
    max-width: 200px;
  `;

  // Fullscreen toggle button
  const fullscreenBtn = document.createElement('button');
  fullscreenBtn.innerHTML = '⛶';
  fullscreenBtn.style.cssText = `
    width: 6px;
    height: 18px;
    border: none;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border-radius: 3px;
    cursor: pointer;
    font-size: 10px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;
  fullscreenBtn.onmouseenter = () => {
    fullscreenBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    fullscreenBtn.style.transform = 'scale(1.1)';
  };
  fullscreenBtn.onmouseleave = () => {
    fullscreenBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    fullscreenBtn.style.transform = 'scale(1)';
  };
  fullscreenBtn.onclick = () => {
    const isFullscreen = iframeContainer.style.width === '100vw';
    if (isFullscreen) {
      // Exit fullscreen - restore original dimensions
      iframeContainer.style.width = originalWidth;
      iframeContainer.style.height = originalHeight;
      iframeContainer.style.top = originalTop;
      iframeContainer.style.right = originalRight;
      iframeContainer.style.left = originalLeft;
      iframeContainer.style.bottom = originalBottom;
      iframeContainer.style.borderRadius = originalBorderRadius;
      fullscreenBtn.innerHTML = '⛶';
      fullscreenBtn.title = 'Fullscreen';
    } else {
      // Store current dimensions before entering fullscreen
      originalWidth = iframeContainer.style.width || '500px';
      originalHeight = iframeContainer.style.height || '800px';
      originalTop = iframeContainer.style.top || '20px';
      originalRight = iframeContainer.style.right || '20px';
      originalLeft = iframeContainer.style.left || 'auto';
      originalBottom = iframeContainer.style.bottom || 'auto';
      originalBorderRadius = iframeContainer.style.borderRadius || '12px';
      
      // Enter fullscreen
      iframeContainer.style.width = '100vw';
      iframeContainer.style.height = '100vh';
      iframeContainer.style.top = '0';
      iframeContainer.style.right = '0';
      iframeContainer.style.left = '0';
      iframeContainer.style.bottom = '0';
      iframeContainer.style.borderRadius = '0';
      fullscreenBtn.innerHTML = '⛷';
      fullscreenBtn.title = 'Exit Fullscreen';
    }
  };
  fullscreenBtn.title = 'Fullscreen';

  // Minimize/Expand button
  const minimizeBtn = document.createElement('button');
  minimizeBtn.innerHTML = '⤢';
  minimizeBtn.style.cssText = `
    width: 6px;
    height: 18px;
    border: none;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border-radius: 3px;
    cursor: pointer;
    font-size: 10px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;
  minimizeBtn.onmouseenter = () => {
    minimizeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    minimizeBtn.style.transform = 'scale(1.1)';
  };
  minimizeBtn.onmouseleave = () => {
    minimizeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    minimizeBtn.style.transform = 'scale(1)';
  };
  minimizeBtn.onclick = () => {
    const isMinimized = iframeContainer.style.height === '60px';
    if (isMinimized) {
      // Expand to full viewport height
      const fullHeight = window.innerHeight + 'px';
      iframeContainer.style.height = fullHeight;
      iframeContainer.style.maxHeight = fullHeight;
      // Ensure it's at the top
      iframeContainer.style.top = '0px';
      minimizeBtn.innerHTML = '⤡';
      minimizeBtn.title = 'Minimize';
    } else {
      // Minimize
      iframeContainer.style.height = '60px';
      iframeContainer.style.maxHeight = '60px';
      minimizeBtn.innerHTML = '⤢';
      minimizeBtn.title = 'Expand';
    }
  };
  minimizeBtn.title = 'Minimize';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    width: 6px;
    height: 18px;
    border: none;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;
  closeBtn.onmouseenter = () => {
    closeBtn.style.background = 'rgba(255, 0, 0, 0.3)';
    closeBtn.style.transform = 'scale(1.1)';
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    closeBtn.style.transform = 'scale(1)';
  };
  closeBtn.onclick = () => closeIframePanel();
  closeBtn.title = 'Close';

  // Sign out button
  const signOutBtn = document.createElement('button');
  signOutBtn.innerHTML = 'Sign Out';
  signOutBtn.style.cssText = `
    height: 28px;
    padding: 0 8px;
    border: none;
    background: rgba(255, 0, 0, 0.2);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    margin-right: 4px;
  `;
  signOutBtn.onmouseenter = () => {
    signOutBtn.style.background = 'rgba(255, 0, 0, 0.4)';
    signOutBtn.style.transform = 'scale(1.05)';
  };
  signOutBtn.onmouseleave = () => {
    signOutBtn.style.background = 'rgba(255, 0, 0, 0.2)';
    signOutBtn.style.transform = 'scale(1)';
  };
  signOutBtn.onclick = () => {
    console.log('🔍 Content script: Sign out button clicked');
    // Send sign out message to iframe
    const iframeContainer = document.getElementById('jot-snatcher-iframe') as HTMLElement;
    console.log('🔍 Content script: Iframe container:', iframeContainer);
    
    // Find the actual iframe element inside the container
    const iframe = iframeContainer?.querySelector('iframe') as HTMLIFrameElement;
    console.log('🔍 Content script: Actual iframe element:', iframe);
    console.log('🔍 Content script: Iframe contentWindow:', iframe?.contentWindow);
    
    if (iframe && iframe.contentWindow) {
      console.log('📤 Content script: Sending SIGN_OUT message to iframe');
      iframe.contentWindow.postMessage({ type: 'SIGN_OUT' }, '*');
    } else {
      console.error('❌ Content script: No iframe or contentWindow found for sign out');
      console.error('❌ Content script: Iframe container exists:', !!iframeContainer);
      console.error('❌ Content script: Actual iframe exists:', !!iframe);
      console.error('❌ Content script: ContentWindow exists:', !!iframe?.contentWindow);
    }
  };
  signOutBtn.title = 'Sign Out';
  signOutBtn.style.display = 'none'; // Hidden by default

  // Theme selector
  const themeSelect = document.createElement('select');
  themeSelect.style.cssText = `
    background: #ba745f !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    border-radius: 3px;
    padding: 1px 3px;
    font-size: 9px;
    font-weight: bold;
    cursor: pointer;
    min-width: 33px;
    height: 18px;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
  `;
  
  // Add theme options
  const lightOption = document.createElement('option');
  lightOption.value = 'light';
  lightOption.textContent = 'Light';
  lightOption.style.cssText = 'background: #f4e6e0; color: #8b4513; font-weight: 600;';
  
  const darkOption = document.createElement('option');
  darkOption.value = 'dark';
  darkOption.textContent = 'Dark';
  darkOption.style.cssText = 'background: #8b4513; color: #f4e6e0; font-weight: 600;';
  
  themeSelect.appendChild(lightOption);
  themeSelect.appendChild(darkOption);
  
  // Set initial theme
  const currentTheme = localStorage.getItem('jot-theme') || 'light';
  themeSelect.value = currentTheme;
  
  // Apply theme to iframe
  const applyTheme = (theme: string) => {
    localStorage.setItem('jot-theme', theme);
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'THEME_CHANGE', theme }, '*');
    }
  };
  
  themeSelect.onchange = (e) => {
    const target = e.target as HTMLSelectElement;
    applyTheme(target.value);
  };
  
  themeSelect.title = 'Theme';

  controls.appendChild(fullscreenBtn);
  controls.appendChild(minimizeBtn);
  controls.appendChild(themeSelect);
  controls.appendChild(signOutBtn);
  controls.appendChild(closeBtn);
  header.appendChild(title);
  header.appendChild(controls);

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('src/iframe/index.html');
  iframe.style.cssText = `
    flex: 1;
    border: none;
    width: 100%;
    height: 100%;
  `;

  iframeContainer.appendChild(header);
  iframeContainer.appendChild(iframe);

  // Add event listeners for dragging
  header.addEventListener('mousedown', (e) => startDrag(e, iframeContainer));
  document.addEventListener('mousemove', (e) => drag(e, iframeContainer));
  document.addEventListener('mouseup', () => stopDrag(iframeContainer));

  // Function to resize iframe based on content
  const resizeIframe = () => {
    try {
      // Use postMessage to communicate with iframe instead of direct document access
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'GET_CONTENT_WIDTH' }, '*');
      }
    } catch (e) {
      console.log('Error resizing iframe:', e);
    }
  };

  // Listen for width response from iframe
  const handleWidthResponse = (event: MessageEvent) => {
    if (event.data.type === 'CONTENT_WIDTH_RESPONSE') {
      const contentWidth = event.data.width || 500;
      const newWidth = Math.max(500, contentWidth + 5);
      
      iframeContainer.style.width = `${newWidth}px`;
      originalWidth = `${newWidth}px`;
      
      console.log(`Resized iframe to ${newWidth}px (content: ${contentWidth}px)`);
    }
  };

  window.addEventListener('message', handleWidthResponse);

  // Resize when iframe loads
  iframe.onload = () => {
    resizeIframe();
    
    // Send authentication state to iframe
    const sendAuthState = async () => {
      // Get Supabase auth data
      const supabaseAuthData = await getSupabaseAuthData();
      
      if (supabaseAuthData) {
        console.log('📤 Content script: Sending Supabase auth state to iframe:', supabaseAuthData);
        
        // Update iframe header with real user data
        const isWebappLoggedIn = await checkWebappLogin();
        await updateIframeHeader(supabaseAuthData.userName || null, supabaseAuthData.userEmail || null, isWebappLoggedIn);
        // updateIframeSignOutButton(true); // Hidden - users can sign out via SignOutPanel
        
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ 
            type: 'AUTH_STATE_UPDATE', 
            authState: {
              isAuthenticated: true,
              requiresLogin: false,
              userId: supabaseAuthData.userId,
              userName: supabaseAuthData.userName,
              userEmail: supabaseAuthData.userEmail,
              subscriptionInfo: supabaseAuthData.subscriptionInfo
            }
          }, '*');
        }
      } else {
        console.log('⚠️ Content script: No Supabase auth data, sending not authenticated state');
        
        // Initialize iframe header with default state
        await updateIframeHeader(null, null, false);
        // updateIframeSignOutButton(false); // Hidden - users can sign out via SignOutPanel
        
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ 
            type: 'AUTH_STATE_UPDATE', 
            authState: {
              isAuthenticated: false,
              requiresLogin: true,
              userId: undefined,
              userName: undefined,
              userEmail: undefined,
              subscriptionInfo: undefined
            }
          }, '*');
        }
      }
    };
    
    // Send auth state immediately
    sendAuthState();
    
    // Disabled webapp auth monitoring - iframe handles its own authentication
    // setTimeout(async () => {
    //   const webappAuthData = await getWebappAuthData();
    //   if (webappAuthData) {
    //     console.log('🔍 Content script: Updating iframe header after delay with:', webappAuthData.userName);
    //     updateIframeHeader(webappAuthData.userName, webappAuthData.userEmail);
    //   }
    // }, 2000);
    
    // Set up periodic Supabase auth updates to iframe
    const authUpdateInterval = setInterval(async () => {
      // Check if extension context is still valid
      if (!chrome.runtime?.id) {
        console.log('⚠️ Extension context invalidated, stopping auth updates');
        clearInterval(authUpdateInterval);
        return;
      }

      const supabaseAuthData = await getSupabaseAuthData();
      if (supabaseAuthData) {
        // Update iframe header with user name
        const isWebappLoggedIn = await checkWebappLogin();
        await updateIframeHeader(supabaseAuthData.userName || null, supabaseAuthData.userEmail || null, isWebappLoggedIn);
        // updateIframeSignOutButton(true); // Hidden - users can sign out via SignOutPanel
        
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ 
            type: 'AUTH_STATE_UPDATE', 
            authState: {
              isAuthenticated: true,
              requiresLogin: false,
              userId: supabaseAuthData.userId,
              userName: supabaseAuthData.userName,
              userEmail: supabaseAuthData.userEmail,
              subscriptionInfo: supabaseAuthData.subscriptionInfo
            }
          }, '*');
        }
      } else {
        // Clear iframe header if no auth data
        await updateIframeHeader(null, null, false);
        // updateIframeSignOutButton(false); // Hidden - users can sign out via SignOutPanel
      }
    }, 10000); // Update every 10 seconds
    
    // Store the interval for cleanup
    (iframe as any).authUpdateInterval = authUpdateInterval;
    
    // Subscription info is now handled directly in sendAuthState() via getWebappAuthData()
    
    // Listen for theme changes via postMessage
    const handleThemeChange = (event: MessageEvent) => {
      if (event.data.type === 'THEME_CHANGE') {
        console.log('Theme change detected, resizing iframe...');
        setTimeout(() => resizeIframe(), 200); // Wait for theme to apply
      }
    };
    
    window.addEventListener('message', handleThemeChange);
    
    // Store the handlers for cleanup
    (iframe as any).themeChangeHandler = handleThemeChange;
  };

  // Load saved position
  const savedPosition = localStorage.getItem('jot-iframe-position');
  if (savedPosition) {
    try {
      const { x, y } = JSON.parse(savedPosition);
      iframeContainer.style.left = `${x}px`;
      iframeContainer.style.top = `${y}px`;
      iframeContainer.style.right = 'auto';
      iframeContainer.style.bottom = 'auto';
    } catch (e) {
      console.log('Could not load saved position:', e);
    }
  }

  document.body.appendChild(iframeContainer);

  // Add keyboard shortcut to close (Escape key)
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeIframePanel();
      document.removeEventListener('keydown', handleKeyPress);
    }
  };
  document.addEventListener('keydown', handleKeyPress);

  console.log('Iframe panel created and displayed');
}

function toggleIframePanel() {
  const iframe = document.getElementById('jot-snatcher-iframe');
  if (iframe) {
    const isHidden = iframe.style.display === 'none';
    iframe.style.display = isHidden ? 'flex' : 'none';
    
    // Re-add drag functionality when showing the iframe
    if (isHidden) {
      const header = iframe.querySelector('div[style*="background: #ba745f"]') as HTMLElement;
      if (header) {
        // Remove existing listeners to avoid duplicates
        header.removeEventListener('mousedown', (e) => startDrag(e, iframe));
        document.removeEventListener('mousemove', (e) => drag(e, iframe));
        document.removeEventListener('mouseup', () => stopDrag(iframe));
        
        // Add drag functionality
        header.addEventListener('mousedown', (e) => startDrag(e, iframe));
        document.addEventListener('mousemove', (e) => drag(e, iframe));
        document.addEventListener('mouseup', () => stopDrag(iframe));
      }
      
      // Re-resize iframe when shown
      setTimeout(() => {
        const resizeIframe = () => {
          try {
            const iframeDoc = (iframe as HTMLIFrameElement).contentDocument || (iframe as HTMLIFrameElement).contentWindow?.document;
            if (!iframeDoc) return;

            const mainContent = iframeDoc.querySelector('[class*="w-popup"]') || 
                               iframeDoc.querySelector('body > div') ||
                               iframeDoc.body;
            
            if (!mainContent) return;

            const contentWidth = mainContent.scrollWidth || (mainContent as HTMLElement).offsetWidth;
            const newWidth = Math.max(500, contentWidth + 5);
            
            iframe.style.width = `${newWidth}px`;
            
            // Update stored original width for fullscreen toggle
            originalWidth = `${newWidth}px`;
            
            console.log(`Resized iframe to ${newWidth}px (content: ${contentWidth}px)`);
          } catch (e) {
            console.log('Error resizing iframe:', e);
          }
        };
        
        resizeIframe();
        
        // Also listen for theme changes when iframe is shown
        const handleThemeChange = (event: MessageEvent) => {
          if (event.data.type === 'THEME_CHANGE') {
            console.log('Theme change detected in toggle, resizing iframe...');
            setTimeout(() => resizeIframe(), 200);
          }
        };
        
        window.addEventListener('message', handleThemeChange);
      }, 100);
    }
  }
}


function closeIframePanel() {
  const iframe = document.getElementById('jot-snatcher-iframe');
  if (iframe) {
    // Clean up theme change listener
    const themeChangeHandler = (iframe as any).themeChangeHandler;
    if (themeChangeHandler) {
      window.removeEventListener('message', themeChangeHandler);
    }
    
    // Subscription intervals are now handled in the auth update interval
    
    // Clean up auth update interval
    const authUpdateInterval = (iframe as any).authUpdateInterval;
    if (authUpdateInterval) {
      clearInterval(authUpdateInterval);
    }
    
    iframe.remove();
    console.log('Iframe panel closed');
  }
}

// Detect persistent banners and calculate optimal button position
function detectPersistentBannerAndGetPosition(): { top: string; zIndex: string } {
  console.log('🔍 detectPersistentBannerAndGetPosition: Starting detection...');
  
  const commonBannerSelectors = [
    // TheLadders.com specific selectors
    '.desktop-container',
    '.search-component-container',
    '.search-input-container',
    '.search-input-container-row',
    
    // Generic banner selectors
    'header',
    '.header',
    '.banner',
    '.top-banner',
    '.persistent-banner',
    '.fixed-header',
    '.sticky-header',
    '.navbar',
    '.navigation',
    '.nav-bar',
    '[role="banner"]',
    '.site-header',
    '.main-header',
    '.page-header',
    '.top-bar',
    '.promo-banner',
    '.announcement-banner',
    '.cookie-banner',
    '.notification-banner'
  ];

  let bannerHeight = 0;
  let bannerZIndex = 0;
  let foundBanner = false;
  
  console.log('🔍 Checking for TheLadders.com banner elements...');

  // Check for TheLadders.com specific banner structure first
  const theladdersBanner = document.querySelector('.desktop-container');
  console.log('🔍 TheLadders banner element found:', theladdersBanner);
  
  if (theladdersBanner) {
    const rect = theladdersBanner.getBoundingClientRect();
    const style = window.getComputedStyle(theladdersBanner);
    const elementZIndex = parseInt(style.zIndex) || 0;
    
    console.log('🔍 TheLadders banner rect:', rect);
    console.log('🔍 TheLadders banner style:', {
      position: style.position,
      top: style.top,
      zIndex: style.zIndex,
      display: style.display,
      visibility: style.visibility
    });
    
    // If it's at the top of the page, it's the persistent banner
    if (rect.top <= 10 && rect.bottom > 0) {
      bannerHeight = rect.bottom;
      bannerZIndex = Math.max(bannerZIndex, elementZIndex);
      foundBanner = true;
      console.log(`🔍 Found TheLadders banner: .desktop-container, height: ${rect.bottom}px, z-index: ${elementZIndex}`);
    } else {
      console.log('🔍 TheLadders banner not at top of page:', { top: rect.top, bottom: rect.bottom });
    }
  } else {
    console.log('🔍 No TheLadders banner (.desktop-container) found');
  }

  // Check for other fixed/sticky positioned banners if TheLadders banner not found
  if (!foundBanner) {
    for (const selector of commonBannerSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const style = window.getComputedStyle(element);
        const position = style.position;
        const display = style.display;
        
        // Skip if not visible
        if (display === 'none' || style.visibility === 'hidden') continue;
        
        // Check if it's a fixed or sticky positioned element
        if (position === 'fixed' || position === 'sticky') {
          const rect = element.getBoundingClientRect();
          const elementZIndex = parseInt(style.zIndex) || 0;
          
          // If it's at the top of the page (top <= 10px), it's likely a persistent banner
          if (rect.top <= 10 && rect.bottom > 0) {
            bannerHeight = Math.max(bannerHeight, rect.bottom);
            bannerZIndex = Math.max(bannerZIndex, elementZIndex);
            foundBanner = true;
            console.log(`🔍 Found persistent banner: ${selector}, height: ${rect.bottom}px, z-index: ${elementZIndex}`);
          }
        }
      }
    }
  }

  // Check for floating accessibility buttons or other floating elements
  const floatingElements = document.querySelectorAll('[id*="accessibility"], [class*="accessibility"], [id*="IND"], [class*="IND"], [data-inddrag="true"]');
  console.log('🔍 Found floating elements:', floatingElements.length);
  
  for (const element of floatingElements) {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const position = style.position;
    
    console.log('🔍 Floating element:', {
      id: element.id,
      className: element.className,
      position: position,
      top: style.top,
      bottom: style.bottom,
      zIndex: style.zIndex,
      rect: { top: rect.top, bottom: rect.bottom, height: rect.height }
    });
    
    // If it's a floating element positioned at the top, treat it as a banner
    if ((position === 'fixed' || position === 'absolute') && rect.top <= 50 && rect.height > 30) {
      bannerHeight = Math.max(bannerHeight, rect.bottom);
      bannerZIndex = Math.max(bannerZIndex, parseInt(style.zIndex) || 0);
      foundBanner = true;
      console.log(`🔍 Found floating element as banner: ${element.id || element.className}, height: ${rect.bottom}px`);
    }
  }

  // Also check for any element that might be acting as a persistent banner
  // Look for elements that are positioned at the top and have significant height
  if (!foundBanner) {
    console.log('🔍 Checking for generic banner elements...');
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      // Skip if not visible, too small, or if it's the html/body element
      if (style.display === 'none' || 
          style.visibility === 'hidden' || 
          rect.height < 50 || 
          element.tagName === 'HTML' || 
          element.tagName === 'BODY' ||
          element === document.documentElement ||
          element === document.body) continue;
      
      // If element is at the very top and has substantial height, it might be a banner
      if (rect.top <= 5 && rect.bottom > 80 && rect.bottom < 200) { // Added max height check
        bannerHeight = Math.max(bannerHeight, rect.bottom);
        bannerZIndex = Math.max(bannerZIndex, parseInt(style.zIndex) || 0);
        foundBanner = true;
        console.log(`🔍 Found potential banner: ${element.tagName}.${element.className}, height: ${rect.bottom}px`);
        break; // Found a likely banner, stop searching
      }
    }
  }

  // Check specifically for the accessibility button
  const accessibilityBtn = document.getElementById('INDmenu-btn');
  let accessibilityConflict = false;
  let accessibilityBottom = 0;
  
  if (accessibilityBtn) {
    const rect = accessibilityBtn.getBoundingClientRect();
    const style = window.getComputedStyle(accessibilityBtn);
    accessibilityBottom = rect.bottom;
    accessibilityConflict = true;
    console.log('🔍 Found accessibility button:', {
      id: accessibilityBtn.id,
      rect: { top: rect.top, bottom: rect.bottom, height: rect.height },
      style: { position: style.position, bottom: style.bottom, zIndex: style.zIndex }
    });
  }

  // Calculate button position
  let topPosition = '20px';
  let zIndex = '10000';

  if (foundBanner) {
    // Position button below the banner with some padding
    topPosition = `${bannerHeight + 15}px`;
    // Ensure button appears above the banner
    zIndex = `${Math.max(10000, bannerZIndex + 100)}`;
    console.log(`📍 Positioning button at top: ${topPosition}, z-index: ${zIndex}`);
  } else if (accessibilityConflict) {
    // If accessibility button is at the top, position our button below it
    if (accessibilityBottom > 0 && accessibilityBottom < 200) {
      topPosition = `${accessibilityBottom + 15}px`;
      zIndex = '10000';
      console.log(`📍 Positioning button below accessibility button at top: ${topPosition}`);
    } else {
      console.log('📍 Accessibility button found but not at top, using default position');
    }
  } else {
    console.log('📍 No persistent banner or accessibility conflict detected, using default position');
  }

  return { top: topPosition, zIndex };
}

// Inject floating button into the page
function injectFloatingButton() {
  // Check if floating button already exists
  if (document.getElementById('jot-snatcher-fab')) {
    console.log('Floating button already exists, skipping injection');
    return;
  }

  console.log('Injecting floating button...');

  // Detect persistent banner and get optimal position
  console.log('🔍 Starting banner detection...');
  const { top: buttonTop, zIndex: buttonZIndex } = detectPersistentBannerAndGetPosition();
  console.log('🔍 Banner detection result:', { top: buttonTop, zIndex: buttonZIndex });

  // Create floating button container
  const fabContainer = document.createElement('div');
  fabContainer.id = 'jot-snatcher-fab';
  // Get the icon URL with error handling
  let iconUrl = '';
  try {
    iconUrl = chrome.runtime.getURL('icons/spjot-48.png');
    console.log('Icon URL:', iconUrl);
  } catch (error) {
    console.error('Error getting icon URL:', error);
    // Fallback to a simple text icon
    iconUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMjQiIGZpbGw9IiNiYTc0NWYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+';
  }

  fabContainer.innerHTML = `
    <div id="jot-snatcher-fab-button" style="
      position: fixed;
      top: ${buttonTop};
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(186, 116, 95, 0.9);
      border: 3px solid rgba(216, 178, 167, 0.8);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(186, 116, 95, 0.3);
      transition: all 0.3s ease;
      z-index: ${buttonZIndex};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <img src="${iconUrl}" alt="Job Collector" style="
        width: 32px;
        height: 32px;
        transition: transform 0.3s ease;
      " onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div style="
        width: 32px;
        height: 32px;
        display: none;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 18px;
      ">📄</div>
      <div style="
        position: absolute;
        bottom: -8px;
        right: -8px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #6a1d58;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
        border: 2px solid white;
      ">
        +
      </div>
    </div>
  `;

  console.log('Floating button HTML created');

  // Add to page
  document.body.appendChild(fabContainer);
  console.log('Floating button added to page');

  // Test if button is clickable
  setTimeout(() => {
    const testButton = document.getElementById('jot-snatcher-fab-button');
    if (testButton) {
      console.log('Button element found in DOM:', testButton);
      console.log('Button clickable:', testButton.style.pointerEvents);
      console.log('Button z-index:', testButton.style.zIndex);
    }
  }, 100);

  // Add click handler
  const fabButton = document.getElementById('jot-snatcher-fab-button');
  if (fabButton) {
    console.log('Floating button element found, adding click handler');
    
    // Add visual feedback for testing
    fabButton.addEventListener('mouseenter', () => {
      console.log('Mouse entered floating button');
      fabButton.style.transform = 'scale(1.1)';
    });
    
    fabButton.addEventListener('mouseleave', () => {
      console.log('Mouse left floating button');
      fabButton.style.transform = 'scale(1)';
    });
    
    fabButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Floating button clicked!');
      
      // Visual feedback
      fabButton.style.transform = 'scale(0.95)';
      setTimeout(() => {
        fabButton.style.transform = 'scale(1)';
      }, 150);
      
      // Always open iframe panel directly
      console.log('Opening iframe panel directly...');
        openIframePanel();
    });
    
    // Re-position button after a short delay to handle late-loading banners
    setTimeout(() => {
      const { top: newTop, zIndex: newZIndex } = detectPersistentBannerAndGetPosition();
      fabButton.style.top = newTop;
      fabButton.style.zIndex = newZIndex;
      console.log(`🔄 Re-positioned floating button: top: ${newTop}, z-index: ${newZIndex}`);
    }, 1000);
    
    console.log('Click handler added successfully');
  } else {
    console.error('Floating button element not found after creation');
  }
}

// Inject CSS for floating button
function injectFloatingButtonCSS() {
  const styleId = 'jot-snatcher-fab-styles';
  
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .jot-snatcher-fab {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .jot-snatcher-fab * {
      box-sizing: border-box;
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize floating button with authentication check
function initializeFloatingButton() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      injectFloatingButtonCSS();
      await checkAuthAndInjectButton();
    });
  } else {
    injectFloatingButtonCSS();
    checkAuthAndInjectButton().catch(console.error);
  }
  
  // Set up periodic webapp status check (every 60 seconds)
  setInterval(async () => {
    try {
      await checkWebappLogin();
    } catch (error) {
      console.error('❌ Error in periodic webapp status check:', error);
    }
  }, 60000); // Check every 60 seconds
}


// Check Supabase connection status
async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_CONNECTION' });
    return response && response.success && response.data && response.data.isAuthenticated;
  } catch (error) {
    console.error('❌ Error checking Supabase connection:', error);
    return false;
  }
}

// Check webapp connection status using API response
async function checkWebappConnection(): Promise<boolean> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_CONNECTION' });
    if (response && response.success && response.data) {
      // Use the verified API response to determine webapp connection
      // The 'connected' field indicates if the API call was successful
      return response.data.connected === true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error checking webapp connection:', error);
    return false;
  }
}

// Check if user is logged into the webapp (works across all domains)
async function checkWebappLogin(): Promise<boolean> {
  try {
    const currentDomain = window.location.hostname;
    console.log('🔍 Checking webapp login on domain:', currentDomain);
    
    // Check if we're on the webapp domain - if so, check localStorage directly
    const isOnWebappDomain = currentDomain.includes('sp-jot-platform.vercel.app') || 
                            currentDomain.includes('sp-jot') ||
                            currentDomain.includes('jot-platform');
    
    if (isOnWebappDomain) {
      // On webapp domain - check localStorage directly
      const authKeys = Object.keys(localStorage).filter(key =>
        key.includes('supabase') ||
        key.includes('sb-') ||
        key.includes('auth')
      );
      
      console.log('🔍 Found auth keys on webapp domain:', authKeys);
      
      for (const key of authKeys) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            // Check for valid authentication data
            if (parsed && (
              parsed.access_token || 
              parsed.session || 
              parsed.user ||
              (parsed.expires_at && parsed.expires_at > Date.now() / 1000)
            )) {
              console.log('✅ Webapp login detected on webapp domain via key:', key);
              // Store this status in Chrome storage for other domains
              await chrome.storage.local.set({ 
                webappConnected: true, 
                webappLastChecked: Date.now() 
              });
              return true;
            }
          }
        } catch (e) {
          // Continue checking other keys
        }
      }
      
      // No valid auth found on webapp domain
      console.log('❌ No webapp login detected on webapp domain');
      await chrome.storage.local.set({ 
        webappConnected: false, 
        webappLastChecked: Date.now() 
      });
      return false;
    } else {
      // On other domains (job sites) - check stored status from Chrome storage
      console.log('🔍 On job site, checking stored webapp status...');
      
      const result = await chrome.storage.local.get(['webappConnected', 'webappLastChecked']);
      const webappConnected = result.webappConnected || false;
      const lastChecked = result.webappLastChecked || 0;
      const timeSinceLastCheck = Date.now() - lastChecked;
      
      // If status is older than 5 minutes, consider it stale
      if (timeSinceLastCheck > 5 * 60 * 1000) {
        console.log('⚠️ Webapp status is stale, assuming not connected');
        await chrome.storage.local.set({ 
          webappConnected: false, 
          webappLastChecked: Date.now() 
        });
        return false;
      }
      
      console.log('📊 Stored webapp status:', webappConnected, 'last checked:', new Date(lastChecked).toLocaleTimeString());
      return webappConnected;
    }
  } catch (error) {
    console.error('❌ Error checking webapp login:', error);
    return false;
  }
}

// Check authentication status before injecting button
async function checkAuthAndInjectButton() {
  console.log('🔍 Checking authentication status before injecting button...');
  
  // Check background script auth status
  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.log('⚠️ Extension context invalidated, showing login prompt');
      injectLoginPrompt();
      return;
    }

    chrome.runtime.sendMessage({ 
      type: 'CHECK_CONNECTION'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Error checking connection:', chrome.runtime.lastError);
        // If extension context is invalidated, show login prompt
        if (chrome.runtime.lastError.message?.includes('Extension context invalidated')) {
          console.log('⚠️ Extension context invalidated, showing login prompt');
          injectLoginPrompt();
          return;
        }
        injectLoginPrompt();
        return;
      }
      
      console.log('📨 Content script received response:', response);
      
      if (response && response.success && response.data && response.data.isAuthenticated) {
        console.log('✅ User is authenticated via extension, showing floating button');
    injectFloatingButton();
      } else {
        console.log('⚠️ User is not authenticated, showing login prompt instead');
        console.log('📊 Response details:', { success: response?.success, data: response?.data });
        injectLoginPrompt();
      }
    });
  } catch (error) {
    console.error('❌ Error in checkAuthAndInjectButton:', error);
    injectLoginPrompt();
  }
}

// Get authentication data from webapp and background script
interface SupabaseAuthData {
  isLoggedIn: boolean;
  userId?: string;
  userName?: string;
  userEmail?: string;
  subscriptionInfo?: {
    tier: string;
    monthlyLimit: number;
    remainingUses: number;
    currentUsage: number;
    isActive: boolean;
  };
}


// Cache for auth data to reduce excessive calls
let cachedAuthData: SupabaseAuthData | null = null;
let lastAuthDataCheck = 0;
const AUTH_DATA_CACHE_DURATION = 3000; // Cache for 3 seconds

async function getSupabaseAuthData(): Promise<SupabaseAuthData | null> {
  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.log('⚠️ Extension context invalidated, skipping auth check');
      return null;
    }

    // Return cached data if it's still fresh
    const now = Date.now();
    if (cachedAuthData && (now - lastAuthDataCheck) < AUTH_DATA_CACHE_DURATION) {
      return cachedAuthData;
    }

    console.log('🔍 Checking direct Supabase authentication...');
    
    // Send message to background script to get auth state
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error getting auth state:', chrome.runtime.lastError);
          resolve(null);
          return;
        }
        
        if (response && response.success && response.data) {
          const authState = response.data;
          console.log('📊 Direct Supabase auth state:', authState);
          
          if (authState.isAuthenticated && authState.userId && authState.subscriptionInfo) {
            console.log('✅ User authenticated via direct Supabase:', {
              userId: authState.userId,
              userName: authState.userName,
              userEmail: authState.userEmail,
              tier: authState.subscriptionInfo.tier,
              monthlyLimit: authState.subscriptionInfo.monthlyLimit,
              currentUsage: authState.subscriptionInfo.currentUsage
            });
            
            const authData = {
              isLoggedIn: true,
              userId: authState.userId,
              userName: authState.userName,
              userEmail: authState.userEmail,
              subscriptionInfo: authState.subscriptionInfo
            };
            
            // Cache the result
            cachedAuthData = authData;
            lastAuthDataCheck = now;
            resolve(authData);
          } else {
            console.log('⚠️ User not authenticated via direct Supabase');
            cachedAuthData = null;
            lastAuthDataCheck = now;
            resolve(null);
          }
        } else {
          console.log('⚠️ No auth state received from background script');
          cachedAuthData = null;
          lastAuthDataCheck = now;
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('❌ Error getting Supabase auth data:', error);
    return null;
  }
}

// Cache for subscription info requests to prevent infinite loops
const subscriptionInfoCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds

// Get subscription info from background script
async function getSubscriptionInfoFromBackground(userId: string) {
  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.log('⚠️ Extension context invalidated, cannot get subscription info');
      return null;
    }

    // Check cache first
    const cached = subscriptionInfoCache.get(userId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📋 Using cached subscription info for user:', userId);
      return cached.data;
    }

    console.log('🔍 Getting subscription info from background script for user:', userId);
    
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'GET_SUBSCRIPTION_INFO',
        userId: userId
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error getting subscription info from background:', chrome.runtime.lastError);
          resolve(null);
          return;
        }
        
        if (response && response.success && response.data) {
          console.log('✅ Got subscription info from background:', response.data);
          // Cache the result
          subscriptionInfoCache.set(userId, {
            data: response.data,
            timestamp: Date.now()
          });
          resolve(response.data);
        } else {
          console.log('⚠️ No subscription info from background:', response);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('❌ Error getting subscription info from background:', error);
    return null;
  }
}

// Inject draggable login prompt instead of floating button
function injectLoginPrompt() {
  // Remove existing floating button if it exists
  const existingFab = document.getElementById('jot-snatcher-fab');
  if (existingFab) {
    existingFab.remove();
  }

  // Check if login prompt already exists
  if (document.getElementById('jot-snatcher-login-prompt')) {
    return;
  }

  console.log('Injecting draggable login prompt...');

  // Detect persistent banner and get optimal position for login prompt
  const { top: promptTop, zIndex: promptZIndex } = detectPersistentBannerAndGetPosition();

  // Create login prompt container
  const loginContainer = document.createElement('div');
  loginContainer.id = 'jot-snatcher-login-prompt';
  
  // Set initial position (center of screen)
  const centerX = (window.innerWidth - 320) / 2;
  const centerY = (window.innerHeight - 400) / 2;
  
  loginContainer.style.cssText = `
    position: fixed;
    top: ${Math.max(20, centerY)}px;
    left: ${Math.max(20, centerX)}px;
    width: 320px;
    background: rgba(186, 116, 95, 0.95);
    border: 2px solid rgba(216, 178, 167, 0.8);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: ${promptZIndex};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: white;
    text-align: center;
    cursor: move;
    user-select: none;
    backdrop-filter: blur(10px);
  `;

  // Add drag handle
  const dragHandle = document.createElement('div');
  dragHandle.style.cssText = `
    background: rgba(186, 116, 95, 1);
    padding: 12px 16px;
    border-radius: 12px 12px 0 0;
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(216, 178, 167, 0.3);
  `;
  
  dragHandle.innerHTML = `
    <div style="display: flex; align-items: center;">
      <img src="${chrome.runtime.getURL('icons/spjot-48.png')}" style="width: 24px; height: 24px; margin-right: 8px;" alt="JOT">
      <span style="font-weight: bold; font-size: 16px;">JOT Snatcher</span>
    </div>
    <div style="display: flex; gap: 4px;">
      <div style="width: 8px; height: 8px; background: rgba(255,255,255,0.6); border-radius: 50%;"></div>
      <div style="width: 8px; height: 8px; background: rgba(255,255,255,0.6); border-radius: 50%;"></div>
      <div style="width: 8px; height: 8px; background: rgba(255,255,255,0.6); border-radius: 50%;"></div>
    </div>
  `;

  // Add content area
  const contentArea = document.createElement('div');
  contentArea.style.cssText = `
    padding: 20px;
  `;
  
  contentArea.innerHTML = `
    <div style="margin-bottom: 16px;">
      <p style="margin: 0 0 16px 0; font-size: 14px; opacity: 0.9;">Please log in to use the extension</p>
    </div>
    <div style="margin-bottom: 16px;">
      <button id="open-extension-btn" style="
        display: inline-block;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
        width: 100%;
      " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
        Open Extension
      </button>
    </div>
    <div style="font-size: 12px; opacity: 0.7;">
      <p style="margin: 0;">Extension will activate after login</p>
    </div>
  `;

  loginContainer.appendChild(dragHandle);
  loginContainer.appendChild(contentArea);

  // Add drag functionality
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = loginContainer.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    dragHandle.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - 320;
      const maxY = window.innerHeight - 400;
      
      loginContainer.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
      loginContainer.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      dragHandle.style.cursor = 'grab';
      document.body.style.userSelect = '';
    }
  });

  document.body.appendChild(loginContainer);
  console.log('Draggable login prompt injected');

  // Add click handler for the button
  const openExtensionBtn = document.getElementById('open-extension-btn');
  if (openExtensionBtn) {
    openExtensionBtn.addEventListener('click', () => {
      console.log('Opening iframe directly...');
      // Remove the login prompt first
      loginContainer.remove();
      // Open the iframe panel directly
      openIframePanel();
    });
  }

  // Set up periodic auth check
  const authCheckInterval = setInterval(() => {
    chrome.runtime.sendMessage({ type: 'CHECK_CONNECTION' }, (response) => {
      if (response && response.success && response.data && response.data.isAuthenticated) {
        console.log('✅ User authenticated, removing login prompt and showing floating button');
        loginContainer.remove();
        clearInterval(authCheckInterval);
        injectFloatingButton();
      }
    });
  }, 60000); // Check every 60 seconds
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'INJECT_FLOATING_BUTTON':
      initializeFloatingButton();
      sendResponse({ success: true });
      break;
    
    case 'REMOVE_FLOATING_BUTTON':
      const fab = document.getElementById('jot-snatcher-fab');
      if (fab) {
        fab.remove();
      }
      sendResponse({ success: true });
      break;
    
    case 'CHECK_WEBAPP_LOGIN':
      (async () => {
        try {
          console.log('🔍 Content script: Checking webapp login status...');
          const isLoggedIn = await checkWebappLogin();
          console.log('📊 Content script: Webapp login status:', isLoggedIn);
          sendResponse({ success: true, isLoggedIn });
        } catch (error) {
          console.error('❌ Content script: Error checking webapp login:', error);
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      })();
      return true; // Keep message channel open for async response
    
    case 'EXTRACT_JOB_DATA':
      (async () => {
        try {
          console.log('🔍 Starting enhanced job extraction...');
          const jobData = await extractionManager.extractCurrentJob();
          
          if (jobData) {
            console.log('✅ Job data extracted successfully:', jobData);
            sendResponse({ success: true, data: jobData });
          } else {
            console.log('⚠️ No job data found with enhanced extraction, trying fallback...');
            const fallbackData = FallbackExtractor.extractWithCommonPatterns();
            if (fallbackData) {
              console.log('✅ Fallback extraction successful:', fallbackData);
              sendResponse({ success: true, data: fallbackData });
            } else {
              console.log('❌ No job data found on current page');
              sendResponse({ success: false, error: 'No job data found' });
            }
          }
        } catch (error) {
          console.error('❌ Error extracting job data:', error);
          sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      })();
      return true; // Keep message channel open for async response
    
    case 'CHECK_SITE_SUPPORT':
      const isSupported = extractionManager.isSiteSupported();
      const siteName = extractionManager.getCurrentSite();
      sendResponse({ 
        success: true, 
        supported: isSupported, 
        siteName: siteName 
      });
      break;
    
    case 'CLOSE_IFRAME':
      closeIframePanel();
      sendResponse({ success: true });
      break;
    
    case 'JOB_ADDED_VIA_EXTENSION':
      console.log('📤 Content script: Received job added notification:', message);
      
      // Send refresh notification to webapp
      try {
        window.postMessage({
          type: 'JOB_ADDED_VIA_EXTENSION',
          source: 'chrome-extension',
          jobId: message.jobId
        }, '*');
        console.log('📤 Content script: Sent refresh notification to webapp');
      } catch (error) {
        console.error('❌ Content script: Error sending refresh notification to webapp:', error);
      }
      
      sendResponse({ success: true });
      break;
    
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  
  return true;
});

// Listen for messages from iframe
window.addEventListener('message', async (event) => {
  if (event.data.type === 'CLOSE_IFRAME') {
    closeIframePanel();
  } else if (event.data.type === 'IFRAME_AUTH_STATE_UPDATE') {
    console.log('📨 Content script: Received auth state update from iframe:', event.data.authState);
    
    // Update the iframe header with the user information
    if (event.data.authState && event.data.authState.isAuthenticated) {
      console.log('🔍 Content script: Updating iframe header from iframe auth state:', event.data.authState.userName);
      // Only update the header if we have valid user data
      if (event.data.authState.userName && event.data.authState.userEmail) {
        await updateIframeHeader(event.data.authState.userName, event.data.authState.userEmail, false);
        updateIframeHeaderUserName(event.data.authState.userName, event.data.authState.userEmail);
        // updateIframeSignOutButton(true); // Hidden - users can sign out via SignOutPanel
        
        // Check webapp connection status and send update to iframe
        const iframe = document.getElementById('jot-snatcher-iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          // Only show webapp as connected if user is also authenticated with extension
          const isWebappLoggedIn = checkWebappLogin();
          iframe.contentWindow.postMessage({
            type: 'WEBAPP_CONNECTION_UPDATE',
            isWebappConnected: isWebappLoggedIn
          }, '*');
        }
      }
    } else {
      console.log('🔍 Content script: Clearing iframe header from iframe auth state');
      // When extension user is not authenticated, don't show webapp as connected
      await updateIframeHeader(null, null, false);
      updateIframeHeaderUserName(null, null);
      // updateIframeSignOutButton(false); // Hidden - users can sign out via SignOutPanel
      
      // When extension user is not authenticated, don't show webapp as connected
      const iframe = document.getElementById('jot-snatcher-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'WEBAPP_CONNECTION_UPDATE',
          isWebappConnected: false
        }, '*');
      }
    }
  }
});

// Initialize on page load with a delay to prevent immediate data requests
setTimeout(() => {
  console.log('🚀 Content script: Initializing after delay...');
initializeFloatingButton();
}, 3000); // Wait 3 seconds before initializing

// Monitor for Supabase authentication changes
let lastAuthState: any = null;
let lastAuthCheckTime = 0;
const AUTH_CHECK_THROTTLE = 5000; // Only check every 5 seconds

const monitorSupabaseAuth = async () => {
  // Check if extension context is still valid
  if (!chrome.runtime?.id) {
    console.log('⚠️ Extension context invalidated, stopping auth monitoring');
    return;
  }

  // Throttle auth checks to reduce console spam
  const now = Date.now();
  if (now - lastAuthCheckTime < AUTH_CHECK_THROTTLE) {
    return;
  }
  lastAuthCheckTime = now;

  const currentAuthData = await getSupabaseAuthData();
  const authChanged = JSON.stringify(currentAuthData) !== JSON.stringify(lastAuthState);
  
  if (authChanged) {
    console.log('🔄 Supabase auth state changed:', currentAuthData);
    lastAuthState = currentAuthData;
    
    if (currentAuthData && currentAuthData.isLoggedIn) {
      console.log('✅ User logged in via Supabase, showing floating button');
      // Remove login prompt if it exists
      const loginPrompt = document.getElementById('jot-snatcher-login-prompt');
      if (loginPrompt) {
        loginPrompt.remove();
      }
      // Show floating button
      injectFloatingButton();
    } else {
      console.log('⚠️ User not logged in via Supabase, showing login prompt');
      // Remove floating button if it exists
      const fab = document.getElementById('jot-snatcher-fab');
      if (fab) {
        fab.remove();
      }
      // Show login prompt
      injectLoginPrompt();
    }
  }
};

// Monitor Supabase auth changes every 60 seconds (throttled internally to 5 seconds)
setInterval(monitorSupabaseAuth, 60000);

// Re-inject on navigation (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Re-inject floating button after navigation
    setTimeout(() => {
      const existingFab = document.getElementById('jot-snatcher-fab');
      const existingLogin = document.getElementById('jot-snatcher-login-prompt');
      if (!existingFab && !existingLogin) {
        initializeFloatingButton();
      }
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });
