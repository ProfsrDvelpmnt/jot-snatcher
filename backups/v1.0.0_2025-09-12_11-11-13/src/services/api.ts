// API service for JOT Snatcher
// Now uses direct Supabase connection instead of Edge Functions
import { directSupabaseAuth } from './directSupabaseAuth';

export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  debugMode?: boolean;
}

export interface ApiCall {
  id: string;
  endpoint: string;
  method: string;
  timestamp: number;
  status: 'pending' | 'success' | 'error';
  duration?: number;
  error?: string;
  response?: any;
}

export interface ApiMonitor {
  calls: ApiCall[];
  isConnected: boolean;
  lastError?: string;
  totalCalls: number;
  successRate: number;
}

export interface JobSubmission {
  // Core job information
  organization: string;
  position: string;
  link: string;
  salary: string;
  salary_type: 'annual' | 'hourly' | 'monthly' | 'contract';
  salary_min: number | null;
  salary_max: number | null;
  location: string;
  type: string; // 'Full Time', 'Part Time', 'Contract', 'Seasonal'
  environment: string; // 'Remote', 'Hybrid', 'In-Person'
  stage: string; // 'Saved', 'Applying', 'Applied', 'Contacted', 'Interviewing', 'Offer'
  source: string; // 'indeed', 'linkedin', 'glassdoor', etc.
  job_site: string; // 'Indeed', 'LinkedIn', 'Glassdoor', etc.
  
  // Dates
  date_saved: string;
  date_posted: string | null;
  
  // Optional fields
  job_posting_url?: string | null;
  resume_url?: string | null;
  contact_message_url?: string | null;
  interview_status?: string | null;
  date_applying?: string | null;
  date_applied?: string | null;
  date_contacted?: string | null;
  date_interviewing?: string | null;
  date_offer?: string | null;
  date_negotiating?: string | null;
  date_hired?: string | null;
  date_archived?: string | null;
  
  // User tracking
  userId?: string;
}

export interface UsageData {
  currentMonth: number;
  monthlyLimit: number;
  remainingUses: number;
  userId?: string;
  tier?: string;
  lastUpdated?: string;
  
  // Legacy fields for backward compatibility
  totalJobs?: number;
  dailyLimit?: number;
  remainingJobs?: number;
}

export interface ConnectionStatus {
  connected: boolean;
  jobData: any | null;
  usageData: UsageData | null;
  error?: string;
  isAuthenticated?: boolean;
  requiresLogin?: boolean;
}

export class ApiService {
  private config: ApiConfig;
  private userId: string | null = null;
  private monitor: ApiMonitor = {
    calls: [],
    isConnected: false,
    totalCalls: 0,
    successRate: 0
  };
  private listeners: ((monitor: ApiMonitor) => void)[] = [];

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 10000,
      debugMode: false,
      ...config
    };
  }

  // Add listener for monitoring updates
  addMonitorListener(listener: (monitor: ApiMonitor) => void) {
    this.listeners.push(listener);
  }

  // Remove listener
  removeMonitorListener(listener: (monitor: ApiMonitor) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Get current monitor state
  getMonitor(): ApiMonitor {
    return { ...this.monitor };
  }

  // Update monitor and notify listeners
  private updateMonitor(updates: Partial<ApiMonitor>) {
    this.monitor = { ...this.monitor, ...updates };
    this.listeners.forEach(listener => listener(this.monitor));
  }

  // Log API call for monitoring
  private logApiCall(call: Omit<ApiCall, 'id' | 'timestamp'>) {
    if (!this.config.debugMode) return;

    const apiCall: ApiCall = {
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...call
    };

    this.monitor.calls.unshift(apiCall);
    
    // Keep only last 50 calls
    if (this.monitor.calls.length > 50) {
      this.monitor.calls = this.monitor.calls.slice(0, 50);
    }

    this.monitor.totalCalls++;
    this.updateMonitor({ calls: this.monitor.calls, totalCalls: this.monitor.totalCalls });
  }

  // Set user ID for API calls
  setUserId(userId: string) {
    this.userId = userId;
  }

  // Get user ID from storage or generate one
  async getUserId(): Promise<string> {
    if (this.userId) return this.userId;

    return new Promise((resolve) => {
      chrome.storage.sync.get(['userId'], (result) => {
        if (result.userId) {
          this.userId = result.userId;
          resolve(result.userId);
        } else {
          // Use the provided UUID for testing, or generate a new one
          const newUserId = 'e4c6cc9a-d835-4291-b51b-ace887de4ffa'; // Your webapp user ID
          chrome.storage.sync.set({ userId: newUserId }, () => {
            this.userId = newUserId;
            resolve(newUserId);
          });
        }
      });
    });
  }

  // Make authenticated API request
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const userId = await this.getUserId();
    const startTime = Date.now();

    // Log API call start
    this.logApiCall({
      endpoint,
      method: options.method || 'GET',
      status: 'pending'
    });

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    };

    if (this.config.apiKey) {
      defaultHeaders['apikey'] = this.config.apiKey;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      const isSuccess = response.ok;
      
      // Log API call result
      this.logApiCall({
        endpoint,
        method: options.method || 'GET',
        status: isSuccess ? 'success' : 'error',
        duration,
        error: isSuccess ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        response: isSuccess ? await response.clone().json().catch(() => null) : null
      });

      // Check for authentication errors
      const isAuthError = response.status === 401 || response.status === 403;
      const isConnected = isSuccess && !isAuthError;

      // Update connection status
      this.updateMonitor({ 
        isConnected,
        lastError: isConnected ? undefined : `HTTP ${response.status}: ${response.statusText}`
      });

      // Update success rate
      const successCount = this.monitor.calls.filter(call => call.status === 'success').length;
      const successRate = this.monitor.totalCalls > 0 ? (successCount / this.monitor.totalCalls) * 100 : 0;
      this.updateMonitor({ successRate });

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log API call error
      this.logApiCall({
        endpoint,
        method: options.method || 'GET',
        status: 'error',
        duration,
        error: errorMessage
      });

      // Update connection status
      this.updateMonitor({ 
        isConnected: false,
        lastError: errorMessage
      });

      throw error;
    }
  }

  // Check connection status using direct Supabase connection
  async checkConnection(): Promise<ConnectionStatus> {
    try {
      console.log('🔍 API Service: Checking connection via direct Supabase');
      
      // Check if user is authenticated via direct Supabase
      const isAuthenticated = directSupabaseAuth.isAuthenticated();
      const requiresLogin = directSupabaseAuth.requiresLogin();
      
      console.log('🔍 API Service: Auth status:', { isAuthenticated, requiresLogin });
      
      if (!isAuthenticated) {
        console.log('🔒 API Service: User not authenticated');
        return {
          connected: false,
          jobData: null,
          usageData: null,
          isAuthenticated: false,
          requiresLogin: true,
          error: 'Authentication required. Please log in.'
        };
      }
      
      // Get usage data from auth service
      const usageData = await this.getUsageData();
      
      console.log('✅ API Service: Connection successful via direct Supabase');
      
      return {
        connected: true,
        jobData: null, // No job data from connection check
        usageData: usageData,
        isAuthenticated: true,
        requiresLogin: false
      };
    } catch (error) {
      console.error('❌ API Service: Connection check failed:', error);
      return {
        connected: false,
        jobData: null,
        usageData: null,
        isAuthenticated: false,
        requiresLogin: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Submit job data using direct Supabase connection
  async submitJob(jobData: JobSubmission): Promise<{ success: boolean; error?: string; usageInfo?: any; job?: any }> {
    try {
      console.log('📝 API Service: Submitting job via direct Supabase connection');
      
      // Convert to kanban format
      const kanbanJobData = {
        organization: jobData.organization,
        position: jobData.position,
        salary: jobData.salary || null,
        location: jobData.location || null,
        type: jobData.type || 'Full Time',
        environment: jobData.environment || 'Remote',
        salary_type: jobData.salary_type || null,
        salary_min: jobData.salary_min || null,
        salary_max: jobData.salary_max || null,
        source: jobData.source || null,
        job_site: jobData.job_site || null,
        link: jobData.link || null,
        date_saved: jobData.date_saved || new Date().toISOString(),
        stage: jobData.stage || 'Saved'
      };

      // Use direct Supabase auth service to submit job
      const result = await directSupabaseAuth.submitJob(kanbanJobData);
      
      if (result.success) {
        // Get updated usage info from auth state
        const subscriptionInfo = directSupabaseAuth.getSubscriptionInfo();
        return {
          success: true,
          usageInfo: subscriptionInfo,
          job: result.job
        };
      } else {
        return {
          success: false,
          error: result.error || 'Unknown error'
        };
      }
    } catch (error) {
      console.error('Job submission failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get usage data from direct Supabase auth service
  async getUsageData(): Promise<UsageData | null> {
    try {
      console.log('📊 API Service: Getting usage data via direct Supabase connection');
      
      const subscriptionInfo = directSupabaseAuth.getSubscriptionInfo();
      
      if (!subscriptionInfo) {
        console.log('⚠️ API Service: No subscription info available');
        return null;
      }

      const usageData: UsageData = {
        currentMonth: subscriptionInfo.currentUsage,
        monthlyLimit: subscriptionInfo.monthlyLimit,
        remainingUses: subscriptionInfo.remainingUses,
        userId: directSupabaseAuth.getUserId(),
        tier: subscriptionInfo.tier,
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ API Service: Got usage data:', usageData);
      return usageData;
    } catch (error) {
      console.error('Failed to get usage data:', error);
      return null;
    }
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      // Use extension-specific health endpoint
      const response = await this.makeRequest('/ext-health');
      return response.ok;
    } catch (error) {
      console.error('API test failed:', error);
      return false;
    }
  }

  // Clear monitoring data
  clearMonitor() {
    this.monitor = {
      calls: [],
      isConnected: false,
      totalCalls: 0,
      successRate: 0
    };
    this.updateMonitor(this.monitor);
  }
}

// Default API configuration - using direct Supabase REST API
export const defaultApiConfig: ApiConfig = {
  baseUrl: 'https://aeoyohqyhawxulisdvqj.supabase.co/rest/v1', // Direct Supabase REST API
  apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb3lvaHF5aGF3eHVsaXNkdnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTQ1MzQsImV4cCI6MjA2NzU3MDUzNH0.ATT386zUTNcUN9AbBZIvgk-3LPBD25Ygk_tv-meOHEU',
  timeout: 10000,
  debugMode: false, // Set to true for development monitoring
};

// Create API service instance with default config
let apiService: ApiService = new ApiService(defaultApiConfig);

// Function to update API service configuration
export const updateApiServiceConfig = (config: ApiConfig) => {
  apiService = new ApiService(config);
};

// Export the service
export { apiService };
