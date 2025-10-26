// Standalone background script for Chrome extension - no imports (PRODUCTION VERSION - NO CONSOLE LOGS)

// Function to check if user is logged into the webapp
async function checkWebappAuthentication() {
  try {
    // Query the active tab to check for webapp authentication
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      return false;
    }

    // Send message to content script to check webapp login status
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'CHECK_WEBAPP_LOGIN' });
    if (response && response.success) {
      return response.isLoggedIn === true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// Function to get real usage data from database
async function getRealUsageData(userId, subscriptionInfo) {
  try {
    // Get current month in YYYY-MM format
    const currentMonth = new Date().toISOString().slice(0, 7);
    
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Calculate usage stats
    const currentUsage = data.length > 0 ? data[0].usage_count : 0;
    const maxUsage = subscriptionInfo?.plan === 'pro' ? 500 : 50;
    const remainingUsage = Math.max(0, maxUsage - currentUsage);
    
    return {
      currentUsage,
      maxUsage,
      remainingUsage,
      plan: subscriptionInfo?.plan || 'free',
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
    };
  } catch (error) {
    // Return default values on error
    return {
      currentUsage: 0,
      maxUsage: 50,
      remainingUsage: 50,
      plan: 'free',
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
    };
  }
}

// Initialize direct Supabase authentication
async function initializeDirectSupabaseAuth() {
  try {
    // Direct Supabase configuration
    const supabaseUrl = 'https://aeoyohqyhawxulisdvqj.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb3lvaHF5aGF3eHVsaXNkdnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTQ1MzQsImV4cCI6MjA2NzU3MDUzNH0.ATT386zUTNcUN9AbBZIvgk-3LPBD25Ygk_tv-meOHEU';
    
    // Create a simple Supabase client
    const supabase = {
      auth: {
        async getSession() {
          try {
            const result = await chrome.storage.local.get(['supabase_session']);
            const session = result.supabase_session;
            
            if (session && session.access_token && session.expires_at) {
              const now = Math.floor(Date.now() / 1000);
              if (session.expires_at > now) {
                return { data: { session }, error: null };
              }
            }
            
            return { data: { session: null }, error: null };
          } catch (error) {
            return { data: { session: null }, error };
          }
        },
        
        async signInWithPassword({ email, password }) {
          try {
            const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
              method: 'POST',
              headers: {
                'apikey': supabaseKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            });
            
            const data = await response.json();
            
            if (response.ok && data.access_token) {
              const session = {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
                user: data.user
              };
              
              await chrome.storage.local.set({ supabase_session: session });
              return { data, error: null };
            } else {
              return { data: null, error: data };
            }
          } catch (error) {
            return { data: null, error };
          }
        },
        
        async signOut() {
          try {
            await chrome.storage.local.remove(['supabase_session']);
            return { error: null };
          } catch (error) {
            return { error };
          }
        }
      },
      
      from: (table) => ({
        select: (columns = '*') => ({
          eq: (column, value) => ({
            async single() {
              try {
                const sessionResult = await chrome.storage.local.get(['supabase_session']);
                const session = sessionResult.supabase_session;
                
                if (!session || !session.access_token) {
                  throw new Error('No valid session');
                }
                
                const url = `${supabaseUrl}/rest/v1/${table}?select=${columns}&${column}=eq.${value}&limit=1`;
                const response = await fetch(url, {
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                return { data: data[0] || null, error: null };
              } catch (error) {
                return { data: null, error };
              }
            }
          }),
          
          async single() {
            try {
              const sessionResult = await chrome.storage.local.get(['supabase_session']);
              const session = sessionResult.supabase_session;
              
              if (!session || !session.access_token) {
                throw new Error('No valid session');
              }
              
              const url = `${supabaseUrl}/rest/v1/${table}?select=${columns}&limit=1`;
              const response = await fetch(url, {
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const data = await response.json();
              return { data: data[0] || null, error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        }),
        
        insert: (data) => ({
          select: (columns = '*') => ({
            async single() {
              try {
                const sessionResult = await chrome.storage.local.get(['supabase_session']);
                const session = sessionResult.supabase_session;
                
                if (!session || !session.access_token) {
                  throw new Error('No valid session');
                }
                
                const url = `${supabaseUrl}/rest/v1/${table}`;
                const response = await fetch(url, {
                  method: 'POST',
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                  },
                  body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                return { data: result[0] || result, error: null };
              } catch (error) {
                return { data: null, error };
              }
            }
          })
        })
      })
    };
    
    return supabase;
  } catch (error) {
    return null;
  }
}

// Message listener for background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'CHECK_CONNECTION':
          try {
            const supabase = await initializeDirectSupabaseAuth();
            if (!supabase) {
              sendResponse({ success: false, error: 'Failed to initialize Supabase' });
              return;
            }
            
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !sessionData.session) {
              sendResponse({ 
                success: true, 
                data: { 
                  isAuthenticated: false, 
                  requiresLogin: true 
                } 
              });
              return;
            }
            
            const userId = sessionData.session.user.id;
            
            // Get user profile to check subscription
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('is_admin, subscription_tier, subscription_status')
              .eq('user_id', userId)
              .single();
            
            let subscriptionInfo = {
              plan: 'free',
              status: 'active'
            };
            
            if (profileData) {
              subscriptionInfo = {
                plan: profileData.subscription_tier || 'free',
                status: profileData.subscription_status || 'active',
                isAdmin: profileData.is_admin || false
              };
            }
            
            // Get usage data
            const usageData = await getRealUsageData(userId, subscriptionInfo);
            
            sendResponse({ 
              success: true, 
              data: { 
                isAuthenticated: true,
                requiresLogin: false,
                userId: userId,
                userName: sessionData.session.user.user_metadata?.full_name || sessionData.session.user.email,
                userEmail: sessionData.session.user.email,
                subscriptionInfo: subscriptionInfo,
                usageData: usageData
              } 
            });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
          
        case 'GET_AUTH_STATE':
          try {
            const supabase = await initializeDirectSupabaseAuth();
            if (!supabase) {
              sendResponse({ success: false, error: 'Failed to initialize Supabase' });
              return;
            }
            
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !sessionData.session) {
              sendResponse({ 
                success: true, 
                data: { 
                  isAuthenticated: false, 
                  requiresLogin: true 
                } 
              });
              return;
            }
            
            const userId = sessionData.session.user.id;
            
            // Get user profile to check subscription
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('is_admin, subscription_tier, subscription_status')
              .eq('user_id', userId)
              .single();
            
            let subscriptionInfo = {
              plan: 'free',
              status: 'active'
            };
            
            if (profileData) {
              subscriptionInfo = {
                plan: profileData.subscription_tier || 'free',
                status: profileData.subscription_status || 'active',
                isAdmin: profileData.is_admin || false
              };
            }
            
            // Get usage data
            const usageData = await getRealUsageData(userId, subscriptionInfo);
            
            sendResponse({ 
              success: true, 
              data: { 
                isAuthenticated: true,
                requiresLogin: false,
                userId: userId,
                userName: sessionData.session.user.user_metadata?.full_name || sessionData.session.user.email,
                userEmail: sessionData.session.user.email,
                subscriptionInfo: subscriptionInfo,
                usageData: usageData
              } 
            });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
          
        case 'SUBMIT_JOB':
          try {
            const supabase = await initializeDirectSupabaseAuth();
            if (!supabase) {
              sendResponse({ success: false, error: 'Failed to initialize Supabase' });
              return;
            }
            
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !sessionData.session) {
              sendResponse({ success: false, error: 'User not authenticated' });
              return;
            }
            
            const userId = sessionData.session.user.id;
            
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
            
            const plainTextDescription = text || null;
            
            // Prepare job data for main jobs table
            const mainJobData = {
              user_id: userId,
              position: message.jobData.position || 'Unknown Position',
              organization: message.jobData.organization || 'Unknown Company',
              location: message.jobData.location || null,
              link: message.jobData.link || null,
              salary: message.jobData.salary || null,
              description: plainTextDescription,
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
              date_saved: message.jobData.date_saved || new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Insert into main jobs table
            const { data: jobResult, error: jobError } = await supabase
              .from('jobs')
              .insert(mainJobData)
              .select()
              .single();
            
            if (jobError) {
              sendResponse({ success: false, error: jobError.message });
              return;
            }
            
            // Also try to submit to Edge Function for kanban board
            try {
              // Manual HTML to plain text conversion for Edge Function (without DOM)
              let edgeFunctionText = message.jobData.description;
              
              // Remove script and style tags and their content
              edgeFunctionText = edgeFunctionText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
              edgeFunctionText = edgeFunctionText.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
              
              // Replace common block elements with line breaks
              edgeFunctionText = edgeFunctionText.replace(/<\/(div|p|br|h1|h2|h3|h4|h5|h6|li|tr)>/gi, '\n');
              edgeFunctionText = edgeFunctionText.replace(/<br\s*\/?>/gi, '\n');
              
              // Replace list items with bullet points
              edgeFunctionText = edgeFunctionText.replace(/<li[^>]*>/gi, '\n• ');
              
              // Remove all remaining HTML tags
              edgeFunctionText = edgeFunctionText.replace(/<[^>]+>/g, '');
              
              // Decode HTML entities
              edgeFunctionText = edgeFunctionText.replace(/&nbsp;/g, ' ');
              edgeFunctionText = edgeFunctionText.replace(/&amp;/g, '&');
              edgeFunctionText = edgeFunctionText.replace(/&lt;/g, '<');
              edgeFunctionText = edgeFunctionText.replace(/&gt;/g, '>');
              edgeFunctionText = edgeFunctionText.replace(/&quot;/g, '"');
              edgeFunctionText = edgeFunctionText.replace(/&#39;/g, "'");
              edgeFunctionText = edgeFunctionText.replace(/&apos;/g, "'");
              
              // Clean up whitespace
              edgeFunctionText = edgeFunctionText.replace(/\n\s*\n\s*\n/g, '\n\n'); // Max 2 consecutive newlines
              edgeFunctionText = edgeFunctionText.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
              edgeFunctionText = edgeFunctionText.replace(/^\s+|\s+$/gm, ''); // Trim each line
              edgeFunctionText = edgeFunctionText.trim();
              
              const edgeFunctionPlainTextDescription = edgeFunctionText || null;
              
              const edgeFunctionJobData = {
                organization: message.jobData.organization || 'Unknown Company',
                position: message.jobData.position || 'Unknown Position',
                location: message.jobData.location || null,
                salary: message.jobData.salary || null,
                type: message.jobData.type || 'Full Time',
                environment: message.jobData.environment || 'Remote',
                link: message.jobData.link || null,
                description: edgeFunctionPlainTextDescription,
                source: 'extension',
                user_id: userId
              };
              
              // Submit to Edge Function
              const edgeFunctionUrl = 'https://aeoyohqyhawxulisdvqj.supabase.co/functions/v1/submit-job';
              const edgeFunctionResponse = await fetch(edgeFunctionUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${sessionData.session.access_token}`
                },
                body: JSON.stringify(edgeFunctionJobData)
              });
              
              if (edgeFunctionResponse.ok) {
                // Edge Function submission successful
              }
            } catch (edgeFunctionError) {
              // Edge Function submission failed, but main job was saved successfully
            }
            
            // Update usage data
            const usageData = await getRealUsageData(userId, { plan: 'free' });
            
            sendResponse({ 
              success: true, 
              job: jobResult,
              usageInfo: usageData
            });
            
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Keep message channel open for async response
});

// Install event listener
chrome.runtime.onInstalled.addListener(() => {
  // Extension installed or updated
});

// Startup event listener  
chrome.runtime.onStartup.addListener(() => {
  // Extension started
});

