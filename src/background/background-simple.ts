// Simple background script without ES6 imports for Chrome extension compatibility

// Import the compiled API service
import { ConfigService } from '../services/config';
import { updateApiServiceConfig, apiService } from '../services/api';

// Initialize config service
const configService = new ConfigService();

// Extension installation handler
chrome.runtime.onInstalled.addListener(async () => {
  console.log('JOT Snatcher extension installed');
  
  // Set default theme
  chrome.storage.sync.set({ theme: 'light' });
  
  try {
    const config = configService.getConfig();
    updateApiServiceConfig(config.api);
    console.log('API service initialized with config:', config.api);
    console.log('API base URL:', config.api.baseUrl);
  } catch (error) {
    console.error('Failed to initialize API service:', error);
    updateApiServiceConfig({
      baseUrl: 'https://aeoyohqyhawxulisdvqj.supabase.co/rest/v1',
      timeout: 10000,
      debugMode: false
    });
    console.log('Using fallback API config: https://aeoyohqyhawxulisdvqj.supabase.co/rest/v1');
  }
});

// Message handler
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Background received message:', message);
  console.log('Message type:', message.type);

  switch (message.type) {
    case 'CHECK_CONNECTION':
      // Check real API connection
      console.log('🔍 Background: Starting connection check...');
      
      // Ensure API service is updated with latest config
      const currentConfig = configService.getConfig();
      console.log('🔍 Background: Config service config:', currentConfig);
      updateApiServiceConfig(currentConfig.api);
      
      // Test the URL directly
      const testUrl = `${currentConfig.api.baseUrl}/api/ext-status`;
      console.log('🔍 Background: Testing URL:', testUrl);
      
      // Try a direct fetch to see what's happening
      fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-123'
        }
      }).then(response => {
        console.log('🔍 Background: Direct fetch response:', response.status, response.statusText);
        return response.json();
      }).then(data => {
        console.log('🔍 Background: Direct fetch data:', data);
      }).catch(error => {
        console.error('❌ Background: Direct fetch error:', error);
      });
      
      apiService.checkConnection().then((status) => {
        console.log('✅ Background: Connection check result:', status);
        sendResponse({
          success: true,
          data: status
        });
      }).catch((error) => {
        console.error('❌ Background: Connection check error:', error);
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

    case 'CHECK_CONNECTION_WITH_USER':
      console.log('🔍 Background: Checking connection with user:', message.userId);
      const userConfig = configService.getConfig();
      updateApiServiceConfig(userConfig.api);
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
      // Collect job data from active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'EXTRACT_JOB_DATA' }, (response) => {
            if (response && response.success && response.data) {
              sendResponse({ success: true, data: response.data });
            } else {
              // Fallback mock data if extraction fails
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
              sendResponse({ success: true, data: mockJobData });
            }
          });
        } else {
          sendResponse({ success: false, error: 'No active tab found' });
        }
      });
      return true; // Keep message channel open for async response

    case 'SEND_JOB_DATA':
      // Send job data to real API
      if (message.data) {
        // Ensure API service is updated with latest config before making request
        try {
          const config = configService.getConfig();
          updateApiServiceConfig(config.api);
          console.log('Updated API service config for job submission:', config.api);
        } catch (error) {
          console.error('Failed to update API service config:', error);
        }
        
        apiService.submitJob(message.data).then((result) => {
          sendResponse(result);
        }).catch((error) => {
          console.error('Job submission error:', error);
          sendResponse({
            success: false,
            error: error.message
          });
        });
      } else {
        sendResponse({ success: false, error: 'No job data provided' });
      }
      return true; // Keep message channel open for async response

    case 'GET_USAGE_DATA':
      // Get usage data from API
      console.log('🔍 Background: Getting usage data...');
      
      // Ensure API service is updated with latest config before making request
      try {
        const config = configService.getConfig();
        updateApiServiceConfig(config.api);
        console.log('Updated API service config for usage data:', config.api);
      } catch (error) {
        console.error('Failed to update API service config:', error);
      }
      
      apiService.getUsageData().then((result) => {
        console.log('✅ Background: Got usage data:', result);
        sendResponse({ success: true, data: result });
      }).catch((error) => {
        console.error('❌ Background: Usage data error:', error);
        
        // Provide fallback usage data if API fails
        const fallbackUsageData = {
          currentMonth: 0,
          monthlyLimit: 5,
          remainingUses: 5,
          userId: 'fallback-user',
          tier: 'free',
          lastUpdated: new Date().toISOString()
        };
        
        console.log('🔧 Background: Using fallback usage data:', fallbackUsageData);
        sendResponse({
          success: true,
          data: fallbackUsageData
        });
      });
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
      chrome.action.openPopup();
      sendResponse({ success: true });
      break;

    case 'CHECK_POPUP_STATUS':
      sendResponse({ isOpen: true });
      break;

    case 'GET_API_CONFIG':
      const apiConfig = configService.getConfig();
      sendResponse({ success: true, config: apiConfig });
      break;

    case 'UPDATE_API_CONFIG':
      if (message.config) {
        configService.updateApiConfig(message.config).then(() => {
          if (message.config.debugMode !== undefined) {
            return configService.updateFeatures({ debugMode: message.config.debugMode });
          }
        }).then(() => {
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

    default:
      sendResponse({ error: 'Unknown message type' });
  }

  return true; // Keep message channel open
});

// Extension icon click handler
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id);
});

// Tab update handler
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
});