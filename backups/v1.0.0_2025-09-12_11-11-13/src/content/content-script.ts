


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
    (window as any).debugCurrentSite = () => {
      const site = window.location.hostname.toLowerCase();
      if (site.includes('linkedin')) return ExtractorDebugger.debugExtraction('linkedin');
      if (site.includes('monster')) return ExtractorDebugger.debugExtraction('monster');
      if (site.includes('ziprecruiter')) return ExtractorDebugger.debugExtraction('ziprecruiter');
      if (site.includes('greenhouse')) return ExtractorDebugger.debugExtraction('greenhouse');
      if (site.includes('hiring.cafe')) return ExtractorDebugger.debugExtraction('hiring-cafe');
      if (site.includes('indeed')) return ExtractorDebugger.debugExtraction('indeed');
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
let originalHeight = '700px';
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
async function updateIframeHeader(userName: string | null, userEmail: string | null, isWebappLoggedIn: boolean = false) {
  console.log('🔍 Content script: updateIframeHeader called with:', { userName, userEmail, isWebappLoggedIn });
  
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
  const webappStatus = isWebappLoggedIn ? 'Connected to SP-JOT' : 'Not Connected to SP-JOT';
  const webappColor = isWebappLoggedIn ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
  const supabaseStatus = isSupabaseConnected ? 'Supabase Connected' : 'Supabase Disconnected';
  const supabaseColor = isSupabaseConnected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
  
  title.innerHTML = `
    <img src="${chrome.runtime.getURL('icons/spjot-48.png')}" style="width: 40px; height: 40px;" alt="JOT">
    <div style="display: flex; flex-direction: column; align-items: flex-start;">
      <span style="font-size: 28px; font-weight: bold; line-height: 1.2;">JOT Snatcher</span>
      <span style="font-size: 16px; opacity: 0.9; line-height: 1.3; margin-top: 4px;">
        <span id="jot-snatcher-webapp-status" style="color: ${webappColor}; font-weight: 600;">${webappStatus}</span>
        <span id="jot-snatcher-supabase-status" style="color: ${supabaseColor}; font-weight: 600; margin-left: 12px;">• ${supabaseStatus}</span>
        <span id="jot-snatcher-username" style="margin-left: 12px; font-weight: 500;"></span>
      </span>
    </div>
  `;
  
  // Now update the userName element if we have user data
  if (userName && userEmail) {
    const userNameElement = title.querySelector('#jot-snatcher-username') as HTMLElement;
    if (userNameElement) {
      userNameElement.textContent = `• ${userName}`;
      userNameElement.style.color = 'rgba(255, 255, 255, 0.9)';
      console.log('✅ Content script: Updated iframe header with user name:', userName);
    }
  } else {
    console.log('✅ Content script: Reset iframe header to default');
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
    userNameElement.textContent = `• ${userName}`;
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

  // Create iframe container
  const iframeContainer = document.createElement('div');
  iframeContainer.id = 'jot-snatcher-iframe';
  iframeContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 520px;
    height: 720px;
    max-height: 85vh;
    background: white;
    border: 2px solid #ba745f;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 10001;
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
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    min-height: 80px;
  `;

  const title = document.createElement('div');
  title.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: bold;
    font-size: 24px;
  `;
  title.innerHTML = `
    <img src="${chrome.runtime.getURL('icons/spjot-48.png')}" style="width: 32px; height: 32px;" alt="JOT">
    <div style="display: flex; flex-direction: column; align-items: flex-start;">
      <span style="font-size: 24px; font-weight: bold; line-height: 1.2;">JOT Snatcher</span>
      <span style="font-size: 14px; opacity: 0.8; line-height: 1.2;">Collects Jobs <span id="jot-snatcher-username" style="margin-left: 8px;"></span></span>
    </div>
  `;

  const controls = document.createElement('div');
  controls.style.cssText = `
    display: flex;
    gap: 8px;
    align-items: center;
  `;

  // Fullscreen toggle button
  const fullscreenBtn = document.createElement('button');
  fullscreenBtn.innerHTML = '⛶';
  fullscreenBtn.style.cssText = `
    width: 28px;
    height: 28px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
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
      originalHeight = iframeContainer.style.height || '700px';
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
    width: 28px;
    height: 28px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
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
      // Expand
      iframeContainer.style.height = '700px';
      iframeContainer.style.maxHeight = '85vh';
      minimizeBtn.innerHTML = '⤢';
      minimizeBtn.title = 'Minimize';
    } else {
      // Minimize
      iframeContainer.style.height = '60px';
      iframeContainer.style.maxHeight = '60px';
      minimizeBtn.innerHTML = '⤡';
      minimizeBtn.title = 'Expand';
    }
  };
  minimizeBtn.title = 'Minimize';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    width: 28px;
    height: 28px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
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
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    min-width: 80px;
  `;
  
  // Add theme options
  const lightOption = document.createElement('option');
  lightOption.value = 'light';
  lightOption.textContent = 'Light';
  lightOption.style.cssText = 'background: #f3f4f6; color: #1f2937;';
  
  const darkOption = document.createElement('option');
  darkOption.value = 'dark';
  darkOption.textContent = 'Dark';
  darkOption.style.cssText = 'background: #1f2937; color: #f3f4f6;';
  
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
        await updateIframeHeader(supabaseAuthData.userName || null, supabaseAuthData.userEmail || null, true);
        updateIframeSignOutButton(true);
        
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
        updateIframeSignOutButton(false);
        
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
        await updateIframeHeader(supabaseAuthData.userName || null, supabaseAuthData.userEmail || null, true);
        updateIframeSignOutButton(true);
        
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
        updateIframeSignOutButton(false);
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

// Inject floating button into the page
function injectFloatingButton() {
  // Check if floating button already exists
  if (document.getElementById('jot-snatcher-fab')) {
    console.log('Floating button already exists, skipping injection');
    return;
  }

  console.log('Injecting floating button...');

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
      top: 20px;
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
      z-index: 10000;
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
}

// Check if user is logged into webapp
async function checkWebappLogin(): Promise<boolean> {
  try {
    const webappToken = localStorage.getItem('sb-aeoyohqyhawxulisdvqj-auth-token');
    if (!webappToken) {
      return false;
    }
    
    const parsed = JSON.parse(webappToken);
    return !!(parsed && parsed.access_token && parsed.user);
  } catch (error) {
    console.error('❌ Error checking webapp login:', error);
    return false;
  }
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

// Check authentication status before injecting button
async function checkAuthAndInjectButton() {
  console.log('🔍 Checking authentication status before injecting button...');
  
  // Check if user is logged into webapp
  const isWebappLoggedIn = await checkWebappLogin();
  console.log('🔍 Webapp login status:', isWebappLoggedIn);
  
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

async function getSupabaseAuthData(): Promise<SupabaseAuthData | null> {
  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.log('⚠️ Extension context invalidated, skipping auth check');
      return null;
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
            
            resolve({
              isLoggedIn: true,
              userId: authState.userId,
              userName: authState.userName,
              userEmail: authState.userEmail,
              subscriptionInfo: authState.subscriptionInfo
            });
          } else {
            console.log('⚠️ User not authenticated via direct Supabase');
            resolve(null);
          }
        } else {
          console.log('⚠️ No auth state received from background script');
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

// Inject login prompt instead of floating button
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

  console.log('Injecting login prompt...');

  // Create login prompt container
  const loginContainer = document.createElement('div');
  loginContainer.id = 'jot-snatcher-login-prompt';
  loginContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    background: rgba(186, 116, 95, 0.95);
    border: 2px solid rgba(216, 178, 167, 0.8);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 20px;
    color: white;
    text-align: center;
  `;

  loginContainer.innerHTML = `
    <div style="margin-bottom: 16px;">
      <img src="${chrome.runtime.getURL('icons/spjot-48.png')}" style="width: 48px; height: 48px; margin-bottom: 8px;" alt="JOT">
      <h3 style="margin: 0; font-size: 18px; font-weight: bold;">JOT Snatcher</h3>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Please log in to use the extension</p>
    </div>
    <div style="margin-bottom: 16px;">
      <button id="open-extension-btn" style="
        display: inline-block;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
      " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
        Open Extension
      </button>
    </div>
    <div style="font-size: 12px; opacity: 0.7;">
      <p style="margin: 0;">Extension will activate after login</p>
    </div>
  `;

  document.body.appendChild(loginContainer);
  console.log('Login prompt injected');

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
  }, 2000); // Check every 2 seconds
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
    
    case 'EXTRACT_JOB_DATA':
      try {
        console.log('🔍 Starting enhanced job extraction...');
        const jobData = extractionManager.extractCurrentJob();
        
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
      break;
    
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
        const isWebappLoggedIn = await checkWebappLogin();
        await updateIframeHeader(event.data.authState.userName, event.data.authState.userEmail, isWebappLoggedIn);
        updateIframeHeaderUserName(event.data.authState.userName, event.data.authState.userEmail);
        updateIframeSignOutButton(true);
        
        // Send webapp connection status update to iframe
        const iframe = document.getElementById('jot-snatcher-iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'WEBAPP_CONNECTION_UPDATE',
            isWebappConnected: isWebappLoggedIn
          }, '*');
        }
      }
    } else {
      console.log('🔍 Content script: Clearing iframe header from iframe auth state');
      const isWebappLoggedIn = await checkWebappLogin();
      await updateIframeHeader(null, null, isWebappLoggedIn);
      updateIframeHeaderUserName(null, null);
      updateIframeSignOutButton(false);
      
      // Send webapp connection status update to iframe
      const iframe = document.getElementById('jot-snatcher-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'WEBAPP_CONNECTION_UPDATE',
          isWebappConnected: isWebappLoggedIn
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
const monitorSupabaseAuth = async () => {
  // Check if extension context is still valid
  if (!chrome.runtime?.id) {
    console.log('⚠️ Extension context invalidated, stopping auth monitoring');
    return;
  }

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

// Monitor Supabase auth changes every 2 seconds
setInterval(monitorSupabaseAuth, 2000);

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
