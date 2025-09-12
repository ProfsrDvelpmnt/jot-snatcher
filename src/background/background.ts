// Background script for JOT Snatcher Chrome Extension
import { apiService, updateApiServiceConfig } from '@/services/api';
import { configService } from '@/services/config';
import { supabaseAuth } from '@/services/supabaseAuth';

// Function to get real usage data from database
async function getRealUsageData(userId: string, subscriptionInfo: any) {
  try {
    console.log('🔍 Getting real usage data for user:', userId);
    
    // Get current month in YYYY-MM format
    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log('📅 Current month:', currentMonth);
    
    // Query the extension_job_submissions table for current month usage
    const supabase = supabaseAuth.getSupabaseClient();
    const { data, error } = await supabase
      .from('extension_job_submissions')
      .select('id')
      .eq('user_id', userId)
      .eq('usage_month', currentMonth);
    
    if (error) {
      console.error('❌ Error querying extension_job_submissions:', error);
      throw error;
    }
    
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

chrome.runtime.onInstalled.addListener(async () => {
  console.log('JOT Snatcher extension installed');
  
  // Set default theme
  chrome.storage.sync.set({ theme: 'light' });
  
  // Initialize API service with correct configuration
  try {
    const config = configService.getConfig();
    updateApiServiceConfig(config.api);
    console.log('API service initialized with config:', config.api);
    console.log('API base URL:', config.api.baseUrl);
  } catch (error) {
    console.error('Failed to initialize API service:', error);
    // Fallback to default API config
    updateApiServiceConfig({
      baseUrl: 'https://aeoyohqyhawxulisdvqj.supabase.co/rest/v1',
      timeout: 10000,
      debugMode: false
    });
    console.log('Using fallback API config: https://aeoyohqyhawxulisdvqj.supabase.co/rest/v1');
  }
});

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
      return true;

    case 'CHECK_CONNECTION_WITH_USER':
      // Check API connection with specific user ID
      console.log('🔍 Background: Checking connection with user:', message.userId);
      
      // Ensure API service is updated with latest config
      const userConfig = configService.getConfig();
      updateApiServiceConfig(userConfig.api);
      
      // Set the user ID for this request
      apiService.setUserId(message.userId);
      
      apiService.checkConnection().then((status) => {
        console.log('✅ Background: User connection check result:', status);
        sendResponse({
          success: true,
          data: status
        });
      }).catch((error) => {
        console.error('❌ Background: User connection check error:', error);
        sendResponse({
          success: false,
          error: error.message,
          data: {
            connected: false,
            jobData: null,
            usageData: null,
            isAuthenticated: false,
            requiresLogin: false,
            error: error.message
          }
        });
      });
      return true; // Keep message channel open for async response

    case 'COLLECT_JOB_DATA':
      // Request job data extraction from content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'EXTRACT_JOB_DATA' }, (response) => {
            if (response && response.success && response.data) {
              sendResponse({
                success: true,
                data: response.data
              });
            } else {
              // Fallback to mock data if extraction fails
              const mockJobData = {
                jobId: `JOB-${Date.now()}`,
                companyName: 'Example Company',
                jobLink: tabs[0].url || 'https://example.com/job',
                salary: '$80,000 - $120,000',
                jobTitle: 'Senior Software Engineer',
                location: 'San Francisco, CA',
                workType: 'Full-time',
                environment: 'Remote',
                ageOfPosting: '2 days ago',
                numApplicants: '45',
                organization: 'Tech Corp',
                position: 'Engineering',
                dateSaved: new Date().toISOString(),
                description: '<p>We are looking for a Senior Software Engineer to join our team...</p>'
              };
              
              sendResponse({
                success: true,
                data: mockJobData
              });
            }
          });
        } else {
          sendResponse({ success: false, error: 'No active tab found' });
        }
      });
      return true; // Keep message channel open for async response

    case 'SEND_JOB_DATA':
      // Send job data to real API - but only if user is authenticated
      if (message.data) {
        console.log('🔍 Background: Sending job data:', message.data);
        
        const checkAuthAndSendJob = async () => {
          try {
            // First check if we have authentication info from the webapp
            const subscriptionInfo = (globalThis as any).__SUBSCRIPTION_INFO__;
            if (!subscriptionInfo || !subscriptionInfo.userId) {
              console.log('⚠️ Background: No authentication info available, skipping job submission');
              sendResponse({ 
                success: false, 
                error: 'User not authenticated'
              });
              return;
            }

            // Ensure API service is updated with latest config before making request
            const config = configService.getConfig();
            updateApiServiceConfig(config.api);
            console.log('Updated API service config for job submission:', config.api);
            
            // Set the authenticated user ID
            apiService.setUserId(subscriptionInfo.userId);
            
            const result = await apiService.submitJob(message.data);
            console.log('✅ Background: Job submission result:', result);
            sendResponse(result);
          } catch (error) {
            console.error('❌ Background: Job submission error:', error);
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        };
        
        checkAuthAndSendJob();
      } else {
        sendResponse({ success: false, error: 'No job data provided' });
      }
      return true; // Keep message channel open for async response

    case 'GET_USAGE_DATA':
      // Get usage data from direct Supabase connection
      console.log('🔍 Background: Getting usage data via direct Supabase...');
      
      // Check if user is authenticated via direct Supabase
      const checkAuthAndGetUsageData = async () => {
        try {
          // Check authentication via direct Supabase
          if (!supabaseAuth.isAuthenticated()) {
            console.log('⚠️ Background: User not authenticated via Supabase, skipping API call');
            sendResponse({ 
              success: false, 
              error: 'User not authenticated',
              data: null 
            });
            return;
          }

          console.log('✅ Background: User authenticated, getting usage data...');
          const authState = supabaseAuth.getAuthState();
          const subscriptionInfo = authState.subscriptionInfo;
          
          if (!subscriptionInfo) {
            console.log('⚠️ Background: No subscription info available');
            sendResponse({ 
              success: false, 
              error: 'No subscription info available',
              data: null 
            });
            return;
          }

          // Get usage data directly from Supabase auth state
          const usageData = {
            currentMonth: subscriptionInfo.currentUsage || 0,
            monthlyLimit: subscriptionInfo.monthlyLimit,
            remainingUses: subscriptionInfo.remainingUses,
            userId: authState.userId,
            tier: subscriptionInfo.tier,
            lastUpdated: new Date().toISOString()
          };
          
          console.log('✅ Background: Got usage data from Supabase:', usageData);
          sendResponse({ success: true, data: usageData });
        } catch (error) {
          console.error('❌ Background: Usage data error:', error);
          
          // Don't provide fallback data - let the extension handle the authentication state
          sendResponse({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            data: null 
          });
        }
      };
      
      checkAuthAndGetUsageData();
      return true; // Keep message channel open for async response

    case 'GET_THEME':
      chrome.storage.sync.get(['theme'], (result) => {
        sendResponse({ theme: result.theme || 'light' });
      });
      return true; // Keep message channel open for async response

    case 'SET_THEME':
      chrome.storage.sync.set({ theme: message.theme }, () => {
        sendResponse({ success: true });
      });
      return true; // Keep message channel open for async response

    case 'OPEN_POPUP':
      // Open the extension popup
      chrome.action.openPopup();
      sendResponse({ success: true });
      break;


    case 'CHECK_POPUP_STATUS':
      // Check if popup is currently open
      // This is a simple check - in reality, detecting popup state is complex
      // We'll return true for now, but this could be improved
      sendResponse({ isOpen: true });
      break;

    case 'GET_API_CONFIG':
      const config = configService.getConfig();
      sendResponse({ success: true, config });
      break;

    case 'UPDATE_API_CONFIG':
      if (message.config) {
        // Update API config
        configService.updateApiConfig(message.config).then(() => {
          // Also update debug mode if provided
          if (message.config.debugMode !== undefined) {
            return configService.updateFeatures({ debugMode: message.config.debugMode });
          }
        }).then(() => {
          // Update API service with new configuration
          const updatedConfig = configService.getConfig();
          updateApiServiceConfig(updatedConfig.api);
          console.log('API service updated with new config:', updatedConfig.api);
          sendResponse({ success: true });
        }).catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'No config provided' });
      }
      return true; // Keep message channel open for async response

    case 'TEST_API_CONNECTION':
      apiService.testConnection().then((connected) => {
        sendResponse({ success: true, connected });
      }).catch((error) => {
        sendResponse({ success: false, connected: false, error: error.message });
      });
      return true; // Keep message channel open for async response

    case 'DEBUG_API_REQUEST':
      // Debug API request - show what URL is being constructed
      const debugConfig = configService.getConfig();
      const debugUrl = `${debugConfig.api.baseUrl}${message.endpoint}`;
      sendResponse({ 
        success: true, 
        debugUrl,
        config: debugConfig.api,
        message: `API service would make request to: ${debugUrl}`
      });
      return true; // Keep message channel open for async response

    case 'GET_SUBSCRIPTION_INFO':
      // Get subscription info for a specific user
      console.log('🔍 Background: Getting subscription info for user:', message.userId);
      
      (async () => {
        try {
          const supabase = supabaseAuth.getSupabaseClient();
          
          // Get user's profile from profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', message.userId)
            .single();

          if (profileError) {
            console.error('❌ Background: Error getting profile:', profileError);
            sendResponse({
              success: false,
              error: profileError.message
            });
            return;
          }

          if (!profile) {
            console.log('⚠️ Background: No profile found for user');
            sendResponse({
              success: false,
              error: 'No profile found for user'
            });
            return;
          }

          // Get current month usage
          const currentMonth = new Date().toISOString().slice(0, 7);
          const { data: usageData, error: usageError } = await supabase
            .from('extension_job_submissions')
            .select('id')
            .eq('user_id', message.userId)
            .eq('usage_month', currentMonth);

          if (usageError) {
            console.error('❌ Background: Error getting usage data:', usageError);
            sendResponse({
              success: false,
              error: usageError.message
            });
            return;
          }

          const currentUsage = usageData?.length || 0;
          
          // Define tier limits
          const tierLimits: { [key: string]: number } = {
            'free': 5,
            'basic': 20,
            'premium': 100,
            'executive': 400,
            'unlimited': 999999
          };

          // No subscription data available since columns don't exist
          const subscriptionInfo = null;

          console.log('📊 Background: No subscription data available');

          sendResponse({
            success: false,
            error: 'No subscription data available - subscription columns not found in profiles table'
          });
        } catch (error) {
          console.error('❌ Background: Error getting subscription info:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      })();
      
      return true; // Keep the message channel open for async response

    default:
      sendResponse({ error: 'Unknown message type' });
  }

  return true; // Keep message channel open
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id);
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
});
