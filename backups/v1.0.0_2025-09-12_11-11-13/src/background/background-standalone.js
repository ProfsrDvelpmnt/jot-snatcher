// Standalone background script for Chrome extension - no imports

// Function to get real usage data from database
async function getRealUsageData(userId, subscriptionInfo) {
  try {
    console.log('🔍 Getting real usage data for user:', userId);
    
    // Get current month in YYYY-MM format
    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log('📅 Current month:', currentMonth);
    
    // Make direct fetch request to Supabase REST API
    const url = `https://aeoyohqyhawxulisdvqj.supabase.co/rest/v1/extension_job_submissions?select=id&user_id=eq.${userId}&usage_month=eq.${currentMonth}`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb3lvaHF5aGF3eHVsaXNkdnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTQ1MzQsImV4cCI6MjA2NzU3MDUzNH0.ATT386zUTNcUN9AbBZIvgk-3LPBD25Ygk_tv-meOHEU',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb3lvaHF5aGF3eHVsaXNkdnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTQ1MzQsImV4cCI6MjA2NzU3MDUzNH0.ATT386zUTNcUN9AbBZIvgk-3LPBD25Ygk_tv-meOHEU',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ HTTP error querying extension_job_submissions:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const currentUsage = data?.length || 0;
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

  async testConnection() {
    try {
      console.log('🔍 DirectSupabaseAuth: Testing Supabase connection...');
      
      // Test basic connection by checking if we have a valid session
      const result = await chrome.storage.local.get(['sb-aeoyohqyhawxulisdvqj-auth-token']);
      const token = result['sb-aeoyohqyhawxulisdvqj-auth-token'];
      
      if (!token) {
        console.log('⚠️ DirectSupabaseAuth: No auth token found');
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
          
          if (testResponse.ok) {
            console.log('✅ DirectSupabaseAuth: Connection test successful');
            return true;
          } else {
            console.log('❌ DirectSupabaseAuth: Connection test failed - invalid session');
            return false;
          }
        }
      } catch (error) {
        console.log('❌ DirectSupabaseAuth: Connection test failed - invalid token:', error);
        return false;
      }
      
      console.log('❌ DirectSupabaseAuth: Connection test failed - no session');
      return false;
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Connection test failed:', error);
      return false;
    }
  }
}

// Initialize the authentication service
const supabaseAuth = new DirectSupabaseAuthService();

// Handle messages from content scripts and popup
console.log('🚀 Background script loaded and message listener registered');
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
      console.log('🔍 Background: Connection check - using direct Supabase authentication');
      
      (async () => {
        try {
          // Get auth state directly from Supabase
          const authState = supabaseAuth.getAuthState();
          console.log('🔍 Background: Current auth state:', authState);
          
          // Test Supabase connection
          const isConnected = await supabaseAuth.testConnection();
          console.log('🔍 Background: Connection test result:', isConnected);
          
          // Get real usage data from database
          let usageData = null;
          if (authState.isAuthenticated && authState.userId && authState.subscriptionInfo) {
            try {
              console.log('🔍 Background: Getting real usage data from database...');
              usageData = await getRealUsageData(authState.userId, authState.subscriptionInfo);
              console.log('✅ Background: Real usage data:', usageData);
            } catch (error) {
              console.error('❌ Background: Failed to get real usage data:', error);
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

          const response = {
            success: true,
            data: {
              connected: isConnected,
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
          
          console.log('✅ Background: Connection check result:', response);
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
      console.log('🔍 Background: Getting usage data...');
      
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
              console.log('🔍 Background: Getting real usage data from database...');
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
                console.log('✅ Background: Got real usage data from database:', usageData);
              }
            } catch (error) {
              console.error('❌ Background: Failed to get real usage data from database:', error);
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
            console.log('⚠️ Background: Using fallback subscription info:', usageData);
          }
          
          console.log('✅ Background: Usage data retrieved:', usageData);
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
      console.log('🔍 Background: Submitting job data...');
      
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
          
          // Submit job data directly to Supabase
          const jobResponse = await fetch(`${supabaseAuth.SUPABASE_URL}/rest/v1/jobs`, {
            method: 'POST',
            headers: {
              'apikey': supabaseAuth.SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${supabaseAuth.SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: authState.userId,
              position: message.jobData.position,
              company: message.jobData.company,
              location: message.jobData.location,
              url: message.jobData.url,
              source: message.jobData.source || 'extension'
            })
          });
          
          if (jobResponse.ok) {
            console.log('✅ Background: Job submitted successfully');
            sendResponse({
              success: true,
              data: { message: 'Job submitted successfully' }
            });
          } else {
            console.error('❌ Background: Job submission failed:', jobResponse.status);
            sendResponse({
              success: false,
              error: `Job submission failed: ${jobResponse.status}`
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
          
          const authState = supabaseAuth.getAuthState();
          if (!authState.isAuthenticated || !authState.userId) {
            sendResponse({
              success: false,
              error: 'User not authenticated'
            });
            return;
          }
          
          // For now, just return success - actual job extraction would happen here
          sendResponse({
            success: true,
            data: { message: 'Job extraction would happen here' }
          });
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