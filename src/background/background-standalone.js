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
            console.log('✅ DirectSupabaseAuth: Successfully initialized with existing session');
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
      
      // Set up a listener for webapp auth updates
      console.log('🔍 DirectSupabaseAuth: Setting up listener for webapp auth updates');
      
      // Periodically check for webapp auth (since we can't listen to localStorage directly)
      const checkInterval = setInterval(async () => {
        console.log('🔄 DirectSupabaseAuth: Periodically checking webapp auth...');
        const currentAuthState = this.getAuthState();
        
        // Only check if we're not already authenticated
        if (!currentAuthState.isAuthenticated) {
          // Trigger a CHECK_CONNECTION to see if webapp has sent auth data
          console.log('🔄 DirectSupabaseAuth: Not authenticated, checking for webapp auth...');
          // This will be handled by the message handler when content script checks
        } else {
          // Already authenticated, stop checking
          console.log('✅ DirectSupabaseAuth: Already authenticated, stopping periodic checks');
          clearInterval(checkInterval);
        }
      }, 2000); // Check every 2 seconds
      
      // Clear interval after 1 minute to avoid infinite checking
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('⏱️ DirectSupabaseAuth: Stopping periodic auth checks after 1 minute');
      }, 60000);
      
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
      console.log('🔍 DirectSupabaseAuth: Checking for webapp authentication...');
      
      // Check if we have a token in storage (might have been synced from webapp)
      const result = await chrome.storage.local.get(['sb-aeoyohqyhawxulisdvqj-auth-token']);
      const token = result['sb-aeoyohqyhawxulisdvqj-auth-token'];
      
      if (token) {
        console.log('✅ DirectSupabaseAuth: Found token in storage, attempting to load user data...');
        try {
          const parsedToken = JSON.parse(token);
          if (parsedToken.currentSession?.user) {
            console.log('✅ DirectSupabaseAuth: Found user in token, loading user data...');
            await this.loadUserData(parsedToken.currentSession.user);
            console.log('✅ DirectSupabaseAuth: Successfully loaded user data from webapp auth');
            return;
          }
        } catch (error) {
          console.log('⚠️ DirectSupabaseAuth: Error loading user from token:', error);
        }
      }
      
      console.log('⚠️ DirectSupabaseAuth: No valid webapp auth found');
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
      
      // Get user's usage for current month from extension_usage view
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const usageResponse = await fetch(`${this.SUPABASE_URL}/rest/v1/extension_usage?select=usage_count&user_id=eq.${user.id}&usage_month=eq.${currentMonth}`, {
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const usageData = await usageResponse.json();
      const currentUsage = usageData?.[0]?.usage_count || 0;
      
      console.log('📊 Background: Current usage from extension_usage:', currentUsage);
      
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
      
      // Usage already calculated from extension_usage view above
      const plan = subscription?.plan;
      
      // Map subscription plans to monthly limits
      // Default to 'free' tier with 5 job limit if no subscription found
      let monthlyLimit = 5; // Default free tier limit
      let tier = 'free';
      
      if (plan) {
        switch (plan) {
          case 'basic':
            monthlyLimit = 20;
            tier = 'basic';
            break;
          case 'professional':
            monthlyLimit = 100;
            tier = 'professional';
            break;
          case 'executive':
            monthlyLimit = 400;
            tier = 'executive';
            break;
          case 'premium':
            monthlyLimit = 200;
            tier = 'premium';
            break;
          default:
            // Unknown plan, use free tier
            monthlyLimit = 5;
            tier = 'free';
        }
      } else {
        console.log('No subscription plan found for user, defaulting to free tier with 5 job limit');
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
          tier: tier, // Use the tier variable, not plan
          monthlyLimit,
          remainingUses,
          currentUsage,
          isActive: subscription?.status === 'active' || tier === 'free' // Free tier is always active
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
    
    // Broadcast the auth state update to all tabs (for content scripts and iframes)
    this.broadcastAuthStateUpdate();
  }
  
  async broadcastAuthStateUpdate() {
    console.log('📤 DirectSupabaseAuth: Broadcasting auth state update to all tabs...');
    
    try {
      // Get all tabs and send the auth state update to content scripts
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'AUTH_STATE_UPDATE',
              authState: this.authState
            });
            console.log('✅ DirectSupabaseAuth: Auth state sent to tab', tab.id);
          } catch (error) {
            // Some tabs might not have content scripts, ignore those errors
          }
        }
      }
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Error broadcasting auth state:', error);
    }
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
      // If user is authenticated, they're connected
      if (this.authState.isAuthenticated && this.authState.userId) {
        console.log('✅ DirectSupabaseAuth: Connection test passed - user is authenticated');
        return true;
      }
      
      // Otherwise, check if we have a valid session token
      const result = await chrome.storage.local.get(['sb-aeoyohqyhawxulisdvqj-auth-token']);
      const token = result['sb-aeoyohqyhawxulisdvqj-auth-token'];
      
      if (!token) {
        console.log('⚠️ DirectSupabaseAuth: No token found for connection test');
        return false;
      }
      
      try {
        const parsedToken = JSON.parse(token);
        if (parsedToken.currentSession?.user && parsedToken.currentSession?.access_token) {
          console.log('✅ DirectSupabaseAuth: Token found, testing connection...');
          
          // Test a simple query to verify the session is still valid
          const testResponse = await fetch(`${this.SUPABASE_URL}/rest/v1/profiles?select=id&id=eq.${parsedToken.currentSession.user.id}&limit=1`, {
            headers: {
              'apikey': this.SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${parsedToken.currentSession.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const isConnected = testResponse.ok;
          console.log(`✅ DirectSupabaseAuth: Connection test result: ${isConnected}`);
          return isConnected;
        }
      } catch (error) {
        console.error('❌ DirectSupabaseAuth: Connection test error:', error);
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Connection test error:', error);
      return false;
    }
  }

  async signIn(email, password) {
    try {
      console.log('🔐 DirectSupabaseAuth: Attempting sign in for:', email);
      
      // Call Supabase Auth API to sign in
      const response = await fetch(`${this.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ DirectSupabaseAuth: Sign in failed:', error);
        
        let errorMessage = error.error_description || error.message || 'Login failed';
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account.';
        } else if (errorMessage.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please try again later.';
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }
      
      const data = await response.json();
      
      if (data.access_token && data.user) {
        console.log('✅ DirectSupabaseAuth: Sign in successful for:', data.user.id);
        
        // Store the session in Chrome storage
        const sessionData = {
          currentSession: {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_in ? Date.now() + (data.expires_in * 1000) : null,
            user: data.user
          }
        };
        
        await chrome.storage.local.set({ 'sb-aeoyohqyhawxulisdvqj-auth-token': JSON.stringify(sessionData) });
        console.log('✅ DirectSupabaseAuth: Session stored in Chrome storage');
        
        // Load user data
        await this.loadUserData(data.user);
        
        return { success: true };
      }
      
      return { success: false, error: 'No user data returned' };
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async signOut() {
    try {
      console.log('👋 DirectSupabaseAuth: Signing out...');
      
      // Clear the session from Chrome storage
      await chrome.storage.local.remove(['sb-aeoyohqyhawxulisdvqj-auth-token']);
      console.log('✅ DirectSupabaseAuth: Cleared session from Chrome storage');
      
      // Update auth state
      this.updateAuthState({
        isAuthenticated: false,
        requiresLogin: true,
        userId: null,
        userName: null,
        userEmail: null,
        subscriptionInfo: null,
        lastUpdated: Date.now()
      });
      
      console.log('✅ DirectSupabaseAuth: Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Sign out error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async refreshUserData() {
    console.log('🔄 DirectSupabaseAuth: Refreshing user data...');
    const result = await chrome.storage.local.get(['sb-aeoyohqyhawxulisdvqj-auth-token']);
    const token = result['sb-aeoyohqyhawxulisdvqj-auth-token'];
    
    if (!token) {
      console.log('⚠️ DirectSupabaseAuth: No session found for refresh');
      return;
    }
    
    try {
      const parsedToken = JSON.parse(token);
      if (parsedToken.currentSession?.user) {
        await this.loadUserData(parsedToken.currentSession.user);
      }
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Error refreshing user data:', error);
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

    case 'SIGN_IN':
      // Handle sign in request
      console.log('🔐 Background: Sign in request received');
      
      (async () => {
        try {
          if (!message.email || !message.password) {
            sendResponse({
              success: false,
              error: 'Email and password are required'
            });
            return;
          }
          
          const result = await supabaseAuth.signIn(message.email, message.password);
          console.log('🔐 Background: Sign in result:', result);
          
          // If sign in was successful, broadcast the updated auth state immediately
          if (result && result.success) {
            console.log('🔐 Background: Sign in successful, broadcasting auth state update...');
            const updatedAuthState = supabaseAuth.getAuthState();
            console.log('🔐 Background: Updated auth state:', updatedAuthState);
            
            // Trigger broadcast
            await supabaseAuth.broadcastAuthStateUpdate();
          }
          
          sendResponse(result);
        } catch (error) {
          console.error('❌ Background: Error during sign in:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      })();
      return true;

    case 'SIGN_OUT':
      // Handle sign out request
      console.log('👋 Background: Sign out request received');
      
      (async () => {
        try {
          const result = await supabaseAuth.signOut();
          console.log('👋 Background: Sign out result:', result);
          
          sendResponse(result);
        } catch (error) {
          console.error('❌ Background: Error during sign out:', error);
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
          // First, check if we should sync webapp auth
          const webappConnected = await checkWebappAuthentication();
          console.log('🔍 Background: Webapp connected:', webappConnected);
          
          // If webapp is connected but extension isn't, try to trigger webapp auth sync
          if (webappConnected) {
            console.log('🔍 Background: Webapp connected but extension not authenticated, checking for webapp session...');
            
            // Query webapp tabs to get auth data
            const tabs = await chrome.tabs.query({ url: 'https://app.sp-jot.com/*' });
            if (tabs && tabs.length > 0) {
              console.log('🔍 Background: Found webapp tab, requesting auth data sync...');
              try {
                const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'SYNC_AUTH_TO_EXTENSION' });
                if (response && response.authData) {
                  console.log('✅ Background: Received auth data from webapp');
                  // Store it
                  await chrome.storage.local.set({
                    'sb-aeoyohqyhawxulisdvqj-auth-token': JSON.stringify({ currentSession: response.authData })
                  });
                  // Reload user data
                  await supabaseAuth.init();
                }
              } catch (error) {
                console.log('⚠️ Background: Could not sync auth from webapp tab:', error);
              }
            }
          }
          
          // Get auth state directly from Supabase
          const authState = supabaseAuth.getAuthState();
          console.log('📊 Background: Current auth state:', authState);
          
          // Test Supabase connection
          const isConnected = await supabaseAuth.testConnection();
          console.log('🔍 Background: Supabase connection test:', isConnected);
          
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

    case 'WEBAPP_AUTH_RECEIVED':
    case 'SYNC_WEBAPP_AUTH':
      console.log('🔄 Background: Received webapp auth data:', message.authData);
      
      (async () => {
        try {
          // Store the webapp auth data
          if (message.authData && message.authData.session) {
            const sessionData = {
              currentSession: message.authData.session
            };
            
            await chrome.storage.local.set({
              'sb-aeoyohqyhawxulisdvqj-auth-token': JSON.stringify(sessionData)
            });
            console.log('✅ Background: Webapp auth token stored');
            
            // Now try to load user data from the stored session
            const result = await chrome.storage.local.get(['sb-aeoyohqyhawxulisdvqj-auth-token']);
            const token = result['sb-aeoyohqyhawxulisdvqj-auth-token'];
            
            if (token) {
              try {
                const parsedToken = JSON.parse(token);
                if (parsedToken.currentSession?.user) {
                  console.log('✅ Background: Loading user data from webapp auth');
                  await supabaseAuth.loadUserData(parsedToken.currentSession.user);
                }
              } catch (error) {
                console.error('❌ Background: Error loading user data from webapp auth:', error);
              }
            }
            
            sendResponse({ success: true });
          } else {
            console.log('⚠️ Background: No auth data in message');
            sendResponse({ success: false, error: 'No auth data provided' });
          }
        } catch (error) {
          console.error('❌ Background: Error handling webapp auth:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;

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