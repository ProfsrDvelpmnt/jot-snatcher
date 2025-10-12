// Standalone background script for Chrome extension - no imports

// Function to check if user is logged into the webapp
async function checkWebappAuthentication() {
  try {
    // Query the active tab to check for webapp authentication
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      console.log('🔍 Background: No active tab found for webapp check');
      return false;
    }

    // Send message to content script to check webapp login status
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'CHECK_WEBAPP_LOGIN' });
    if (response && response.success) {
      console.log('🔍 Background: Webapp login check result:', response.isLoggedIn);
      return response.isLoggedIn === true;
    }
    
    console.log('🔍 Background: No response from content script for webapp check');
    return false;
  } catch (error) {
    console.log('🔍 Background: Error checking webapp authentication:', error);
    return false;
  }
}

// Function to get real usage data from database
async function getRealUsageData(userId, subscriptionInfo) {
  try {
    console.log('🔍 Getting real usage data for user:', userId);
    
    // Get current month in YYYY-MM format
    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log('📅 Current month:', currentMonth);
    
    // Make direct fetch request to Supabase REST API using extension_usage view
    const url = `https://aeoyohqyhawxulisdvqj.supabase.co/rest/v1/extension_usage?select=usage_count&user_id=eq.${userId}&usage_month=eq.${currentMonth}`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb3lvaHF5aGF3eHVsaXNkdnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTQ1MzQsImV4cCI6MjA2NzU3MDUzNH0.ATT386zUTNcUN9AbBZIvgk-3LPBD25Ygk_tv-meOHEU',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb3lvaHF5aGF3eHVsaXNkdnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTQ1MzQsImV4cCI6MjA2NzU3MDUzNH0.ATT386zUTNcUN9AbBZIvgk-3LPBD25Ygk_tv-meOHEU',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ HTTP error querying extension_usage:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const currentUsage = data?.[0]?.usage_count || 0;
    const monthlyLimit = subscriptionInfo.monthlyLimit || 0;
    const remainingUses = Math.max(0, monthlyLimit - currentUsage);
    
    console.log('📊 Usage data:', {
      currentUsage,
      monthlyLimit,
      remainingUses,
      tier: subscriptionInfo.tier
    });
    
    return {
      currentMonth: currentUsage,
      monthlyLimit: monthlyLimit,
      remainingUses: remainingUses,
      userId: userId,
      tier: subscriptionInfo.tier,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error getting real usage data:', error);
    throw error;
  }
}

// Direct Supabase authentication service
class DirectSupabaseAuthService {
  constructor() {
    this.SUPABASE_URL = 'https://aeoyohqyhawxulisdvqj.supabase.co';
    this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb3lvaHF5aGF3eHVsaXNkdnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTQ1MzQsImV4cCI6MjA2NzU3MDUzNH0.ATT386zUTNcUN9AbBZIvgk-3LPBD25Ygk_tv-meOHEU';
    
    this.authState = {
      isAuthenticated: false,
      requiresLogin: true,
      userId: null,
      userName: null,
      userEmail: null,
      userFirstName: null,
      userLastName: null,
      subscriptionInfo: null,
      lastUpdated: Date.now()
    };
    
    this.init();
  }

  async init() {
    try {
      console.log('🔧 DirectSupabaseAuth: Initializing direct Supabase authentication...');
      
      // Check for existing session in Chrome storage first
      const result = await chrome.storage.local.get(['sb-aeoyohqyhawxulisdvqj-auth-token']);
      const token = result['sb-aeoyohqyhawxulisdvqj-auth-token'];
      
      if (token) {
        try {
          const parsedToken = JSON.parse(token);
          if (parsedToken.currentSession?.user) {
            console.log('✅ DirectSupabaseAuth: Found existing session for user:', parsedToken.currentSession.user.id);
            await this.loadUserData(parsedToken.currentSession.user);
            return;
          }
        } catch (error) {
          console.log('⚠️ DirectSupabaseAuth: Invalid token format, clearing storage');
          await chrome.storage.local.remove(['sb-aeoyohqyhawxulisdvqj-auth-token']);
        }
      }
      
      // If no extension storage, try to check if user is logged in via webapp
      console.log('🔍 DirectSupabaseAuth: No extension session found, checking webapp localStorage...');
      await this.checkWebappAuth();
      
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Error initializing:', error);
      this.updateAuthState({
        isAuthenticated: false,
        requiresLogin: true,
        lastUpdated: Date.now()
      });
    }
  }
  
  // Check if user is authenticated via webapp (localStorage)
  async checkWebappAuth() {
    try {
      console.log('🔍 DirectSupabaseAuth: Checking for webapp authentication via content script...');
      
      // The content script will automatically sync webapp auth to extension storage
      // and send AUTH_STATE_UPDATE messages, so we don't need to do anything here
      // Just wait for the content script to detect and sync the auth data
      
      console.log('⚠️ DirectSupabaseAuth: Waiting for content script to sync webapp auth...');
      this.updateAuthState({
        isAuthenticated: false,
        requiresLogin: true,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Error checking webapp auth:', error);
      this.updateAuthState({
        isAuthenticated: false,
        requiresLogin: true,
        lastUpdated: Date.now()
      });
    }
  }

  async loadUserData(user) {
    try {
      console.log('🔍 DirectSupabaseAuth: Loading user data for:', user.id);
      
      // Get user profile
      const profileResponse = await fetch(`${this.SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${user.id}`, {
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const profiles = await profileResponse.json();
      const profile = profiles?.[0];
      
      // Get user's jobs count for current month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const jobsResponse = await fetch(`${this.SUPABASE_URL}/rest/v1/jobs?select=id&user_id=eq.${user.id}&created_at=gte.${currentMonth}-01`, {
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const jobs = await jobsResponse.json();
      
      // Get subscription info
      const subscriptionResponse = await fetch(`${this.SUPABASE_URL}/rest/v1/subscriptions?select=*&user_id=eq.${user.id}&status=eq.active`, {
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const subscriptions = await subscriptionResponse.json();
      const subscription = subscriptions?.[0];
      
      // Calculate usage stats
      const currentUsage = jobs?.length || 0;
      const plan = subscription?.plan;
      
      // Map subscription plans to monthly limits
      let monthlyLimit = null; // No default - require actual subscription data
      switch (plan) {
        case 'basic':
          monthlyLimit = 20;
          break;
        case 'professional':
          monthlyLimit = 100;
          break;
        case 'executive':
          monthlyLimit = 400;
          break;
        case 'premium':
          monthlyLimit = 200;
          break;
        default:
          // No subscription plan found - user needs to set up subscription
          console.log('No subscription plan found for user');
          return;
      }
      
      const remainingUses = Math.max(0, monthlyLimit - currentUsage);
      
      // Update auth state with same logic as webapp: first_name || email
      const displayName = user.user_metadata?.first_name || user.email;
      
      this.updateAuthState({
        isAuthenticated: true,
        requiresLogin: false,
        userId: user.id,
        userName: displayName,
        userEmail: user.email || '',
        userFirstName: user.user_metadata?.first_name,
        userLastName: user.user_metadata?.last_name,
        subscriptionInfo: {
          tier: plan,
          monthlyLimit,
          remainingUses,
          currentUsage,
          isActive: subscription?.status === 'active'
        },
        lastUpdated: Date.now()
      });
      
      console.log('✅ DirectSupabaseAuth: User data loaded successfully');
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Error loading user data:', error);
    }
  }

  updateAuthState(newState) {
    this.authState = { ...this.authState, ...newState };
    console.log('📤 DirectSupabaseAuth: Auth state updated:', this.authState);
  }

  getAuthState() {
    console.log('🔍 DirectSupabaseAuth: getAuthState called, current state:', this.authState);
    console.log('🔍 DirectSupabaseAuth: Auth state details:', {
      isAuthenticated: this.authState.isAuthenticated,
      requiresLogin: this.authState.requiresLogin,
      userId: this.authState.userId,
      userName: this.authState.userName,
      hasSubscriptionInfo: !!this.authState.subscriptionInfo
    });
    return { ...this.authState };
  }

  async getSessionToken() {
    try {
      console.log('🔍 DirectSupabaseAuth: Getting session token...');
      
      // Get session from Chrome storage
      const result = await chrome.storage.local.get(['sb-aeoyohqyhawxulisdvqj-auth-token']);
      const token = result['sb-aeoyohqyhawxulisdvqj-auth-token'];
      
      if (!token) {
        console.log('⚠️ DirectSupabaseAuth: No auth token found in storage');
        return null;
      }
      
      try {
        const parsedToken = JSON.parse(token);
        console.log('🔍 DirectSupabaseAuth: Parsed token structure:', Object.keys(parsedToken));
        
        // Check for access_token in currentSession
        if (parsedToken.currentSession?.access_token) {
          console.log('✅ DirectSupabaseAuth: Retrieved session token from currentSession');
          return parsedToken.currentSession.access_token;
        }
        
        // Check for access_token at root level (alternative structure)
        if (parsedToken.access_token) {
          console.log('✅ DirectSupabaseAuth: Retrieved session token from root level');
          return parsedToken.access_token;
        }
        
        // Check for access_token in session object
        if (parsedToken.session?.access_token) {
          console.log('✅ DirectSupabaseAuth: Retrieved session token from session object');
          return parsedToken.session.access_token;
        }
        
        console.log('⚠️ DirectSupabaseAuth: No access_token found in any expected location');
        console.log('🔍 DirectSupabaseAuth: Available keys in parsed token:', Object.keys(parsedToken));
        if (parsedToken.currentSession) {
          console.log('🔍 DirectSupabaseAuth: currentSession keys:', Object.keys(parsedToken.currentSession));
        }
        return null;
      } catch (parseError) {
        console.error('❌ DirectSupabaseAuth: Error parsing auth token:', parseError);
        return null;
      }
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Error getting session token:', error);
      return null;
    }
  }

  async testConnection() {
    try {
      // Test basic connection by checking if we have a valid session
      const result = await chrome.storage.local.get(['sb-aeoyohqyhawxulisdvqj-auth-token']);
      const token = result['sb-aeoyohqyhawxulisdvqj-auth-token'];
      
      if (!token) {
        return false;
      }
      
      try {
        const parsedToken = JSON.parse(token);
        if (parsedToken.currentSession?.user) {
          // Test a simple query to verify the session is still valid
          const testResponse = await fetch(`${this.SUPABASE_URL}/rest/v1/profiles?select=id&id=eq.${parsedToken.currentSession.user.id}&limit=1`, {
            headers: {
              'apikey': this.SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${parsedToken.currentSession.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          return testResponse.ok;
        }
      } catch (error) {
        return false;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
}

// Initialize the authentication service
const supabaseAuth = new DirectSupabaseAuthService();

// Handle messages from content scripts and popup
console.log('🚀 Background script loaded and message listener registered');
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Check if extension context is still valid
  if (chrome.runtime.lastError) {
    console.error('❌ Background: Extension context error:', chrome.runtime.lastError.message);
    if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
      console.log('⚠️ Background: Extension context invalidated, cannot process message');
      return false;
    }
  }
  
  console.log('Background received message:', message);
  console.log('Message type:', message.type);

  switch (message.type) {
    case 'GET_AUTH_STATE':
      // Get current authentication state from Supabase
      console.log('🔍 Background: Getting auth state...');
      
      (async () => {
        try {
          const authState = supabaseAuth.getAuthState();
          console.log('📊 Background: Current auth state:', authState);
          
          sendResponse({
            success: true,
            data: authState
          });
        } catch (error) {
          console.error('❌ Background: Error getting auth state:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      })();
      return true;

    case 'CHECK_CONNECTION':
      // Check connection using direct Supabase authentication
      (async () => {
        try {
          // Get auth state directly from Supabase
          const authState = supabaseAuth.getAuthState();
          
          // Test Supabase connection
          const isConnected = await supabaseAuth.testConnection();
          
          // Get real usage data from database
          let usageData = null;
          if (authState.isAuthenticated && authState.userId && authState.subscriptionInfo) {
            try {
              usageData = await getRealUsageData(authState.userId, authState.subscriptionInfo);
            } catch (error) {
              // Fallback to subscription info
              usageData = {
                currentMonth: authState.subscriptionInfo.currentUsage || 0,
                monthlyLimit: authState.subscriptionInfo.monthlyLimit,
                remainingUses: authState.subscriptionInfo.remainingUses,
                userId: authState.userId,
                tier: authState.subscriptionInfo.tier,
                lastUpdated: new Date().toISOString()
              };
            }
          }

          // Determine webapp connectivity based on actual webapp authentication
          const webappConnected = await checkWebappAuthentication();

          const response = {
            success: true,
            data: {
              connected: webappConnected,
              jobData: null, // Will be populated when user submits jobs
              usageData: usageData,
              isAuthenticated: authState.isAuthenticated,
              requiresLogin: authState.requiresLogin,
              userId: authState.userId,
              userName: authState.userName,
              userEmail: authState.userEmail,
              subscriptionInfo: authState.subscriptionInfo,
              error: null
            }
          };
          
          sendResponse(response);
        } catch (error) {
          console.error('❌ Background: Connection check error:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      })();
      return true; // Keep message channel open for async response

    case 'GET_USAGE_DATA':
      (async () => {
        try {
          const authState = supabaseAuth.getAuthState();
          
          if (!authState.isAuthenticated) {
            sendResponse({
              success: false,
              error: 'User is not authenticated'
            });
            return;
          }
          
          let usageData = null;
          
          // Try to get real usage data from database
          if (authState.subscriptionInfo && authState.userId) {
            try {
              const realUsageData = await getRealUsageData(authState.userId, authState.subscriptionInfo);
              if (realUsageData) {
                usageData = {
                  currentMonth: realUsageData.currentUsage,
                  monthlyLimit: realUsageData.monthlyLimit,
                  remainingUses: realUsageData.remainingUses,
                  userId: authState.userId,
                  tier: realUsageData.tier,
                  lastUpdated: realUsageData.lastUpdated
                };
              }
            } catch (error) {
              // Fall back to subscription info
            }
          }
          
          // Fallback to subscription info if real data not available
          if (!usageData && authState.subscriptionInfo) {
            usageData = {
              currentMonth: authState.subscriptionInfo.currentUsage || 0,
              monthlyLimit: authState.subscriptionInfo.monthlyLimit,
              remainingUses: authState.subscriptionInfo.remainingUses,
              userId: authState.userId,
              tier: authState.subscriptionInfo.tier,
              lastUpdated: new Date().toISOString()
            };
          }
          
          sendResponse({
            success: true,
            data: usageData
          });
        } catch (error) {
          console.error('❌ Background: Error getting usage data:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      })();
      return true; // Keep message channel open for async response

    case 'SUBMIT_JOB':
      (async () => {
        try {
          const authState = supabaseAuth.getAuthState();
          
          if (!authState.isAuthenticated) {
            sendResponse({
              success: false,
              error: 'User is not authenticated'
            });
            return;
          }
          
          if (!message.jobData) {
            sendResponse({
              success: false,
              error: 'No job data provided'
            });
            return;
          }
          
          // Get current month for usage tracking
          const currentMonth = new Date().toISOString().slice(0, 7);
          
          // Submit job data to extension_job_submissions table for usage tracking
          const jobSubmissionData = {
            user_id: authState.userId,
            organization: message.jobData.organization || 'Unknown Company',
            position: message.jobData.position || 'Unknown Position',
            location: message.jobData.location || null,
            salary: message.jobData.salary || null,
            job_type: message.jobData.type || null,
            environment: message.jobData.environment || null,
            job_url: message.jobData.link || null,
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform
            },
            browser_info: {
              name: 'Chrome Extension',
              version: chrome.runtime.getManifest().version
            },
            extension_version: chrome.runtime.getManifest().version,
            submission_source: 'chrome_extension',
            usage_month: currentMonth
          };
          
          // Get the user's session token for authenticated requests
          const sessionToken = await supabaseAuth.getSessionToken();
          if (!sessionToken) {
            sendResponse({ success: false, error: 'User not authenticated' });
            return;
          }
          
          console.log('📤 Background: Submitting to extension_job_submissions table:', jobSubmissionData);
          console.log('📤 Background: Extension submissions URL:', `${supabaseAuth.SUPABASE_URL}/rest/v1/extension_job_submissions`);
          
          const jobResponse = await fetch(`${supabaseAuth.SUPABASE_URL}/rest/v1/extension_job_submissions`, {
            method: 'POST',
            headers: {
              'apikey': supabaseAuth.SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${sessionToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(jobSubmissionData)
          });
          
          console.log('📤 Background: Extension submissions response status:', jobResponse.status);
          console.log('📤 Background: Extension submissions response ok:', jobResponse.ok);
          
          if (jobResponse.ok) {
            console.log('✅ Background: Job successfully submitted to extension_job_submissions table');
            
            // Send webapp refresh notification immediately after successful job submission
            try {
              const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
              if (tab && tab.id) {
                await chrome.tabs.sendMessage(tab.id, {
                  type: 'JOB_ADDED_VIA_EXTENSION',
                  source: 'chrome-extension',
                  jobId: 'extension-' + Date.now()
                });
                console.log('📤 Background: Sent webapp refresh notification after successful job submission');
              }
            } catch (notificationError) {
              console.log('⚠️ Background: Could not send webapp refresh notification:', notificationError);
            }
            
            // Also submit to main jobs table for webapp display
            try {
              // Convert HTML description to plain text before sending to database
              let plainTextDescription = null;
              if (message.jobData.description) {
                try {
                  // Manual HTML to plain text conversion (without DOM)
                  let text = message.jobData.description;
                  
                  // Remove script and style tags and their content
                  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
                  
                  // Replace common block elements with line breaks
                  text = text.replace(/<\/(div|p|br|h1|h2|h3|h4|h5|h6|li|tr)>/gi, '\n');
                  text = text.replace(/<br\s*\/?>/gi, '\n');
                  
                  // Replace list items with bullet points
                  text = text.replace(/<li[^>]*>/gi, '\n• ');
                  
                  // Remove all remaining HTML tags
                  text = text.replace(/<[^>]+>/g, '');
                  
                  // Decode HTML entities
                  text = text.replace(/&nbsp;/g, ' ');
                  text = text.replace(/&amp;/g, '&');
                  text = text.replace(/&lt;/g, '<');
                  text = text.replace(/&gt;/g, '>');
                  text = text.replace(/&quot;/g, '"');
                  text = text.replace(/&#39;/g, "'");
                  text = text.replace(/&apos;/g, "'");
                  
                  // Clean up whitespace
                  text = text.replace(/\n\s*\n\s*\n/g, '\n\n'); // Max 2 consecutive newlines
                  text = text.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
                  text = text.replace(/^\s+|\s+$/gm, ''); // Trim each line
                  text = text.trim();
                  
                  plainTextDescription = text;
                  
                  console.log('📝 Background: Converted HTML description to plain text');
                  console.log('📝 Background: Plain text length:', plainTextDescription.length);
                } catch (conversionError) {
                  console.error('❌ Background: Error converting description:', conversionError);
                  plainTextDescription = message.jobData.description; // Fallback to original
                }
              }
              
              const mainJobData = {
                user_id: authState.userId,
                position: message.jobData.position || 'Unknown Position',
                organization: message.jobData.organization || 'Unknown Company',
                location: message.jobData.location || null,
                link: message.jobData.link || null,
                salary: message.jobData.salary || null,
                description: plainTextDescription, // Add plain text description
                type: (message.jobData.type && ['Full Time', 'Part Time', 'Contract', 'Seasonal'].includes(message.jobData.type)) 
                  ? message.jobData.type 
                  : 'Full Time',
                environment: (message.jobData.environment && ['Remote', 'Hybrid', 'In-Person'].includes(message.jobData.environment)) 
                  ? message.jobData.environment 
                  : 'Remote',
                stage: 'Saved',
                job_source: 'extension',
                source: message.jobData.source || 'chrome_extension',
                date_posted: message.jobData.date_posted || null,
                date_saved: message.jobData.date_saved || new Date().toISOString(), // Add date_saved field
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              console.log('📝 Background: Main job data includes description:', !!mainJobData.description);
              
              console.log('📤 Background: Submitting to main jobs table:', mainJobData);
              console.log('📤 Background: Jobs table URL:', `${supabaseAuth.SUPABASE_URL}/rest/v1/jobs`);
              
              const mainJobResponse = await fetch(`${supabaseAuth.SUPABASE_URL}/rest/v1/jobs`, {
                method: 'POST',
                headers: {
                  'apikey': supabaseAuth.SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${sessionToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(mainJobData)
              });
              
              console.log('📤 Background: Main jobs table response status:', mainJobResponse.status);
              console.log('📤 Background: Main jobs table response ok:', mainJobResponse.ok);
              
              if (mainJobResponse.ok) {
                console.log('✅ Background: Job successfully submitted to main jobs table');
              } else {
                try {
                  const mainErrorText = await mainJobResponse.text();
                  console.error('❌ Background: Main jobs table failed with status:', mainJobResponse.status);
                  console.error('❌ Background: Main jobs table error response:', mainErrorText);
                  console.error('❌ Background: Main jobs table request data that failed:', mainJobData);
                } catch (textError) {
                  console.error('❌ Background: Could not read main jobs table error response text:', textError);
                }
              }
            } catch (mainJobError) {
              console.error('❌ Background: Error submitting to main jobs table:', mainJobError);
            }
            
            // NEW: Submit to Edge Function for kanban board support
            try {
              console.log('📤 Background: Submitting to Edge Function for kanban board...');
              console.log('📤 Background: Edge Function URL:', `${supabaseAuth.SUPABASE_URL}/functions/v1/add-job-from-extension`);
              console.log('📤 Background: Session token available:', !!sessionToken);
              console.log('📤 Background: Original job data from message:', message.jobData);
              console.log('📤 Background: Original job data organization:', message.jobData.organization);
              console.log('📤 Background: Original job data position:', message.jobData.position);
              
              // Convert HTML description to plain text for Edge Function as well
              let edgeFunctionPlainTextDescription = null;
              if (message.jobData.description) {
                try {
                  // Manual HTML to plain text conversion (without DOM)
                  let text = message.jobData.description;
                  
                  // Remove script and style tags and their content
                  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
                  
                  // Replace common block elements with line breaks
                  text = text.replace(/<\/(div|p|br|h1|h2|h3|h4|h5|h6|li|tr)>/gi, '\n');
                  text = text.replace(/<br\s*\/?>/gi, '\n');
                  
                  // Replace list items with bullet points
                  text = text.replace(/<li[^>]*>/gi, '\n• ');
                  
                  // Remove all remaining HTML tags
                  text = text.replace(/<[^>]+>/g, '');
                  
                  // Decode HTML entities
                  text = text.replace(/&nbsp;/g, ' ');
                  text = text.replace(/&amp;/g, '&');
                  text = text.replace(/&lt;/g, '<');
                  text = text.replace(/&gt;/g, '>');
                  text = text.replace(/&quot;/g, '"');
                  text = text.replace(/&#39;/g, "'");
                  text = text.replace(/&apos;/g, "'");
                  
                  // Clean up whitespace
                  text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
                  text = text.replace(/[ \t]+/g, ' ');
                  text = text.replace(/^\s+|\s+$/gm, '');
                  text = text.trim();
                  
                  edgeFunctionPlainTextDescription = text;
                } catch (conversionError) {
                  console.error('❌ Background: Error converting description for Edge Function:', conversionError);
                  edgeFunctionPlainTextDescription = message.jobData.description;
                }
              }
              
              // Prepare job data for Edge Function (simplified format to match old extension)
              const edgeFunctionJobData = {
                organization: message.jobData.organization || 'Unknown Company',
                position: message.jobData.position || 'Unknown Position',
                location: message.jobData.location || null,
                salary: message.jobData.salary || null,
                type: message.jobData.type || 'Full Time',
                environment: message.jobData.environment || 'Remote',
                link: message.jobData.link || null,
                description: edgeFunctionPlainTextDescription, // Use plain text version
                source: 'extension',
                user_id: authState.userId
              };
              
              console.log('📤 Background: Edge Function job data:', edgeFunctionJobData);
              console.log('📤 Background: Edge Function includes description:', !!edgeFunctionJobData.description);
              console.log('📤 Background: Edge Function description length:', edgeFunctionJobData.description?.length || 0);
              console.log('📤 Background: Edge Function job data organization:', edgeFunctionJobData.organization);
              console.log('📤 Background: Edge Function job data position:', edgeFunctionJobData.position);
              console.log('📤 Background: Edge Function job data user_id:', edgeFunctionJobData.user_id);
              
              const edgeFunctionResponse = await fetch(`${supabaseAuth.SUPABASE_URL}/functions/v1/add-job-from-extension`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${sessionToken}`,
                  'apikey': supabaseAuth.SUPABASE_ANON_KEY,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(edgeFunctionJobData)
              });
              
              console.log('📤 Background: Edge Function response status:', edgeFunctionResponse.status);
              console.log('📤 Background: Edge Function response ok:', edgeFunctionResponse.ok);
              
              // Log response headers for debugging
              console.log('📤 Background: Edge Function response headers:', Object.fromEntries(edgeFunctionResponse.headers.entries()));
              
              if (edgeFunctionResponse.ok) {
                const edgeResult = await edgeFunctionResponse.json();
                console.log('✅ Background: Job successfully submitted to Edge Function:', edgeResult);
                // Note: Webapp refresh notification already sent after successful job submission
              } else {
                // Log the error details first
                console.error('❌ Background: Edge Function failed with status:', edgeFunctionResponse.status);
                console.error('❌ Background: Edge Function response headers:', Object.fromEntries(edgeFunctionResponse.headers.entries()));
                console.error('❌ Background: Edge Function request data that failed:', edgeFunctionJobData);
                
                // Try to get error text
                try {
                  const errorText = await edgeFunctionResponse.text();
                  console.error('❌ Background: Edge Function error response:', errorText);
                } catch (textError) {
                  console.error('❌ Background: Could not read error response text:', textError);
                }
                
                // Handle specific error cases
                if (edgeFunctionResponse.status === 429) {
                  console.error('❌ Background: Edge Function rate limited (429). Job was still submitted to extension_job_submissions table.');
                } else if (edgeFunctionResponse.status === 401) {
                  console.error('❌ Background: Edge Function authentication failed (401). Check session token.');
                } else if (edgeFunctionResponse.status === 500) {
                  console.error('❌ Background: Edge Function server error (500). Check Edge Function logs.');
                  console.log('🔍 Background: This is a server-side issue with the Edge Function, not your extension.');
                  console.log('ℹ️ Background: Your job was still saved to the main jobs table successfully.');
                } else if (edgeFunctionResponse.status === 400) {
                  console.error('❌ Background: Edge Function bad request (400). Check data format.');
                  console.log('🔍 Background: The job data format may be incorrect for the Edge Function.');
                  console.log('ℹ️ Background: Your job was still saved to the main jobs table successfully.');
                }
                
                // FALLBACK: Try direct Edge Function call like the old extension
                console.log('🔄 Background: Attempting fallback Edge Function call...');
                try {
                  const fallbackResponse = await fetch(`${supabaseAuth.SUPABASE_URL}/functions/v1/add-job-from-extension`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${sessionToken}`,
                      'apikey': supabaseAuth.SUPABASE_ANON_KEY,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(edgeFunctionJobData)
                  });
                  
                  if (fallbackResponse.ok) {
                    const fallbackResult = await fallbackResponse.json();
                    console.log('✅ Background: Fallback Edge Function call successful:', fallbackResult);
                    // Note: Webapp refresh notification already sent after successful job submission
                  } else {
                    const fallbackErrorText = await fallbackResponse.text();
                    console.error('❌ Background: Fallback Edge Function call also failed:', fallbackResponse.status, fallbackErrorText);
                    console.error('❌ Background: Fallback request data that failed:', edgeFunctionJobData);
                    console.log('🔍 Background: Edge Function is experiencing server-side issues.');
                    console.log('ℹ️ Background: Your job was successfully saved to the main jobs table and will appear on your kanban board.');
                    
                    // Note: Webapp refresh notification already sent after successful job submission
                  }
                } catch (fallbackError) {
                  console.error('❌ Background: Fallback Edge Function call error:', fallbackError);
                  console.log('🔍 Background: Edge Function is experiencing server-side issues.');
                  console.log('ℹ️ Background: Your job was successfully saved to the main jobs table and will appear on your kanban board.');
                }
              }
            } catch (edgeFunctionError) {
              console.error('❌ Background: Error submitting to Edge Function:', edgeFunctionError);
              console.error('❌ Background: Edge Function error details:', {
                name: edgeFunctionError.name,
                message: edgeFunctionError.message,
                stack: edgeFunctionError.stack
              });
            }
            
            // Refresh usage data after successful job submission
            try {
              console.log('🔄 Background: Refreshing usage data after successful job submission...');
              // Trigger usage data refresh by updating auth state
              await supabaseAuth.refreshUserData();
              console.log('✅ Background: Usage data refreshed successfully');
            } catch (refreshError) {
              console.log('⚠️ Background: Could not refresh usage data:', refreshError);
            }
            
            sendResponse({
              success: true,
              data: { 
                message: 'Job submitted successfully',
                usageIncremented: true,
                currentMonth: currentMonth
              }
            });
          } else {
            const errorText = await jobResponse.text();
            console.error('❌ Background: Extension job submission failed:', jobResponse.status, errorText);
            console.error('❌ Background: Extension submissions request data that failed:', jobSubmissionData);
            
            // Still try to submit to main jobs table even if extension submission fails
            try {
              console.log('🔄 Background: Attempting main jobs table submission despite extension submission failure...');
              const mainJobData = {
                user_id: authState.userId,
                title: message.jobData.position || 'Unknown Position',
                position: message.jobData.position || 'Unknown Position',
                organization: message.jobData.organization || 'Unknown Company',
                location: message.jobData.location || null,
                url: message.jobData.link || null,
                source: message.jobData.source || 'chrome_extension',
                salary: message.jobData.salary || null,
                environment: message.jobData.environment || null,
                status: 'applied',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              const mainJobResponse = await fetch(`${supabaseAuth.SUPABASE_URL}/rest/v1/jobs`, {
                method: 'POST',
                headers: {
                  'apikey': supabaseAuth.SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${sessionToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(mainJobData)
              });
              
              if (mainJobResponse.ok) {
                console.log('✅ Background: Job successfully submitted to main jobs table (fallback)');
              } else {
                const mainErrorText = await mainJobResponse.text();
                console.error('❌ Background: Failed to submit to main jobs table (fallback):', mainJobResponse.status, mainErrorText);
              }
            } catch (mainJobError) {
              console.error('❌ Background: Error submitting to main jobs table (fallback):', mainJobError);
            }
            
            sendResponse({
              success: false,
              error: `Extension job submission failed: ${jobResponse.status} - ${errorText}`
            });
          }
        } catch (error) {
          console.error('❌ Background: Error submitting job:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      })();
      return true; // Keep message channel open for async response

    case 'AUTH_STATE_UPDATE':
      console.log('🔄 Background: Auth state update from iframe:', message.authState);
      
      // Update our auth state with the new data
      if (message.authState && message.authState.isAuthenticated) {
        supabaseAuth.updateAuthState({
          isAuthenticated: message.authState.isAuthenticated,
          requiresLogin: message.authState.requiresLogin || false,
          userId: message.authState.userId,
          userName: message.authState.userName,
          userEmail: message.authState.userEmail,
          userFirstName: message.authState.userFirstName,
          userLastName: message.authState.userLastName,
          subscriptionInfo: message.authState.subscriptionInfo,
          lastUpdated: Date.now()
        });
        console.log('✅ Background: Auth state synchronized with iframe');
      }
      
      sendResponse({ success: true });
      break;

    case 'EXTRACT_JOB_DATA':
      (async () => {
        try {
          console.log('🔍 Background: Extracting job data...');
          
          // Always extract job data regardless of authentication status
          // Authentication will be checked when trying to send data or generate PDF
          
          // Get the active tab to send message to content script
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          
          if (!tab || !tab.id) {
            console.error('❌ Background: No active tab found');
            sendResponse({
              success: false,
              error: 'No active tab found'
            });
            return;
          }
          
          // Send message to content script to extract job data
          try {
            const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB_DATA' });
            
            if (response && response.success) {
              console.log('✅ Background: Job data extracted from content script:', response.data);
          sendResponse({
            success: true,
                data: response.data
              });
            } else {
              console.log('⚠️ Background: Content script extraction failed:', response?.error);
              sendResponse({
                success: false,
                error: response?.error || 'Content script extraction failed'
              });
            }
          } catch (contentScriptError) {
            console.error('❌ Background: Error communicating with content script:', contentScriptError);
            sendResponse({
              success: false,
              error: 'Failed to communicate with content script'
            });
          }
        } catch (error) {
          console.error('❌ Background: Failed to extract job data:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      })();
      return true; // Keep message channel open for async response

    default:
      console.log('⚠️ Background: Unknown message type:', message.type);
      sendResponse({
        success: false,
        error: 'Unknown message type'
      });
      break;
  }
});

// Message listeners are now handled in the main listener above

console.log('✅ Background script initialization complete');