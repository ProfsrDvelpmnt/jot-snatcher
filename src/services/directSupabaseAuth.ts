// Direct Supabase Authentication Service for Chrome Extension
// Uses the same Supabase client as the webapp, but with chrome.storage.local

import { createClient } from '@supabase/supabase-js';

// Supabase configuration - same as webapp
const SUPABASE_URL = 'https://aeoyohqyhawxulisdvqj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb3lvaHF5aGF3eHVsaXNkdnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTQ1MzQsImV4cCI6MjA2NzU3MDUzNH0.ATT386zUTNcUN9AbBZIvgk-3LPBD25Ygk_tv-meOHEU';
// Validate API key format
const isValidApiKey = (key: string): boolean => {
  try {
    // Supabase anon keys should be JWT tokens with 3 parts separated by dots
    const parts = key.split('.');
    if (parts.length !== 3) return false;
    
    // Decode the header to check if it's a valid JWT
    const header = JSON.parse(atob(parts[0]));
    if (header.alg !== 'HS256' && header.typ !== 'JWT') return false;
    
    // Decode the payload to check if it's a Supabase anon key
    const payload = JSON.parse(atob(parts[1]));
    if (payload.iss !== 'supabase' || payload.role !== 'anon') return false;
    
    return true;
  } catch (error) {
    console.error('❌ DirectSupabaseAuth: Invalid API key format:', error);
    return false;
  }
};

// Check if API key is valid
if (!isValidApiKey(SUPABASE_ANON_KEY)) {
  console.error('❌ DirectSupabaseAuth: Invalid Supabase API key. Please check your configuration.');
}

// Create Supabase client with Chrome storage
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key: string) => {
        return new Promise((resolve) => {
          chrome.storage.local.get([key], (result) => {
            resolve(result[key] || null);
          });
        });
      },
      setItem: (key: string, value: string) => {
        return new Promise((resolve) => {
          chrome.storage.local.set({ [key]: value }, () => {
            resolve(undefined);
          });
        });
      },
      removeItem: (key: string) => {
        return new Promise((resolve) => {
          chrome.storage.local.remove([key], () => {
            resolve(undefined);
          });
        });
      },
    },
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Disable for extension context
  }
});

export interface DirectSupabaseAuthState {
  isAuthenticated: boolean;
  requiresLogin: boolean;
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
  lastUpdated: number;
}

export class DirectSupabaseAuthService {
  private static instance: DirectSupabaseAuthService;
  private authState: DirectSupabaseAuthState = {
    isAuthenticated: false,
    requiresLogin: true,
    lastUpdated: 0
  };
  private listeners: ((state: DirectSupabaseAuthState) => void)[] = [];
  private refreshInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): DirectSupabaseAuthService {
    if (!DirectSupabaseAuthService.instance) {
      DirectSupabaseAuthService.instance = new DirectSupabaseAuthService();
    }
    return DirectSupabaseAuthService.instance;
  }

  private async initializeAuth() {
    console.log('🔧 DirectSupabaseAuth: Initializing direct Supabase authentication...');
    
    try {
      // First validate the API key
      if (!isValidApiKey(SUPABASE_ANON_KEY)) {
        console.error('❌ DirectSupabaseAuth: Invalid API key, authentication disabled');
        this.updateAuthState({
          isAuthenticated: false,
          requiresLogin: true,
          lastUpdated: Date.now()
        });
        return;
      }

      // Test basic connectivity with timeout
      console.log('🔍 DirectSupabaseAuth: Testing Supabase connection...');
      try {
        const connectionPromise = supabase.from('profiles').select('count').limit(1);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );
        
        const { data, error } = await Promise.race([connectionPromise, timeoutPromise]) as any;
        
        if (error) {
          console.error('❌ DirectSupabaseAuth: Connection test failed:', error);
          // Don't return here - continue with auth initialization
          console.log('⚠️ DirectSupabaseAuth: Continuing with auth despite connection test failure');
        } else {
          console.log('✅ DirectSupabaseAuth: Connection test successful');
        }
      } catch (connectionError) {
        console.error('❌ DirectSupabaseAuth: Connection error:', connectionError);
        // Don't return here - continue with auth initialization
        console.log('⚠️ DirectSupabaseAuth: Continuing with auth despite connection error');
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 DirectSupabaseAuth: Auth state changed:', event, 'Session:', !!session, 'User ID:', session?.user?.id);
        this.handleAuthStateChange(event, session);
      });

      // Check for existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('🔍 DirectSupabaseAuth: Initial session check:', { session: !!session, error });

      if (session?.user) {
        console.log('✅ DirectSupabaseAuth: Found existing session for user:', session.user.id);
        await this.loadUserData(session.user);
      } else {
        console.log('⚠️ DirectSupabaseAuth: No existing session found');
        this.updateAuthState({
          isAuthenticated: false,
          requiresLogin: true,
          lastUpdated: Date.now()
        });
      }

      // Set up periodic refresh
      this.setupPeriodicRefresh();
      
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Error initializing:', error);
      this.updateAuthState({
        isAuthenticated: false,
        requiresLogin: true,
        lastUpdated: Date.now()
      });
    }
  }

  private async handleAuthStateChange(event: string, session: any) {
    console.log('🔄 DirectSupabaseAuth: Handling auth state change:', event, 'Session:', !!session);
    
    if (event === 'SIGNED_IN' && session?.user) {
      console.log('✅ DirectSupabaseAuth: User signed in:', session.user.id);
      await this.loadUserData(session.user);
    } else if (event === 'SIGNED_OUT') {
      console.log('👋 DirectSupabaseAuth: User signed out - updating auth state');
      this.updateAuthState({
        isAuthenticated: false,
        requiresLogin: true,
        userId: undefined,
        userName: undefined,
        userEmail: undefined,
        subscriptionInfo: undefined,
        lastUpdated: Date.now()
      });
      console.log('✅ DirectSupabaseAuth: Auth state updated after sign out');
    } else if (event === 'TOKEN_REFRESHED' && session?.user) {
      console.log('🔄 DirectSupabaseAuth: Token refreshed for user:', session.user.id);
      await this.loadUserData(session.user);
    } else {
      console.log('🔍 DirectSupabaseAuth: Unhandled auth state change:', event);
    }
  }

  private async loadUserData(user: any) {
    try {
      console.log('🔍 DirectSupabaseAuth: Loading user data for:', user.id);
      
      // Get current month usage from extension_usage view
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      console.log('📅 DirectSupabaseAuth: Getting usage for month:', currentMonth);

      const { data: usageData, error: usageError } = await supabase
        .from('extension_usage')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('usage_month', currentMonth)
        .single();

      if (usageError) {
        console.error('❌ DirectSupabaseAuth: Error loading usage data:', usageError);
      }

      const currentUsage = usageData?.usage_count || 0;
      console.log('📊 DirectSupabaseAuth: Current usage:', currentUsage);

      // Try to get subscription data from the database
      console.log('🔍 DirectSupabaseAuth: Checking for subscription data...');
      
      // Query for actual subscription data from the database
      // First try to get subscription data from a subscriptions table
      let tier = null;
      let monthlyLimit = null;
      
      try {
        // Try to get subscription data from subscriptions table
        const { data: subscriptions, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (subscriptionError) {
          console.log('⚠️ DirectSupabaseAuth: No subscriptions table or error:', subscriptionError.message);
        } else if (subscriptions && subscriptions.length > 0) {
          const subscription = subscriptions[0];
          tier = subscription.plan;
          monthlyLimit = await this.getMonthlyLimitForTier(tier);
          console.log('✅ DirectSupabaseAuth: Found subscription data:', { tier, monthlyLimit });
        }
      } catch (error) {
        console.log('⚠️ DirectSupabaseAuth: Error querying subscriptions table:', error);
      }
      
      // If no subscription data found, try to get from profiles table
      if (!tier) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.log('⚠️ DirectSupabaseAuth: No profiles table or error:', profileError.message);
          } else if (profile && profile.plan) {
            tier = profile.plan;
            monthlyLimit = await this.getMonthlyLimitForTier(tier);
            console.log('✅ DirectSupabaseAuth: Found profile plan data:', { tier, monthlyLimit });
          }
        } catch (error) {
          console.log('⚠️ DirectSupabaseAuth: Error querying profiles table:', error);
        }
      }
      
      // If still no subscription data found, determine based on usage patterns
      // This is a fallback for when subscription data is not available
      if (!tier) {
        console.log('⚠️ DirectSupabaseAuth: No subscription data found, determining tier from usage patterns');
        
        if (currentUsage >= 1000) {
          tier = 'enterprise';
        } else if (currentUsage >= 400) {
          tier = 'executive';
        } else if (currentUsage >= 200) {
          tier = 'premium';
        } else if (currentUsage >= 150) {
          tier = 'professional';
        } else if (currentUsage >= 5) {
          tier = 'basic';
        } else {
          // User has no usage yet, but they have a login, so they must have a plan
          // Default to basic plan for new users
          tier = 'basic';
        }
        
        // Get the actual monthly limit from Supabase for the determined tier
        monthlyLimit = await this.getMonthlyLimitForTier(tier);
        
        console.log('📊 DirectSupabaseAuth: Determined tier from usage patterns:', { tier, monthlyLimit, currentUsage });
      }

      console.log('📊 DirectSupabaseAuth: Determined tier:', tier, 'with limit:', monthlyLimit);

      const remainingUses = Math.max(0, monthlyLimit! - currentUsage);

      const subscriptionInfo = {
        tier: tier,
        monthlyLimit: monthlyLimit!,
        remainingUses: remainingUses,
        currentUsage: currentUsage,
        isActive: true // All determined tiers are active
      };

      console.log('📊 DirectSupabaseAuth: Final subscription info:', subscriptionInfo);

      // Extract user name from user metadata
      const userName = this.extractUserName(user, null);

      // Update auth state with complete data
      this.updateAuthState({
        isAuthenticated: true,
        requiresLogin: false,
        userId: user.id,
        userName: userName,
        userEmail: user.email || '',
        subscriptionInfo: subscriptionInfo,
        lastUpdated: Date.now()
      });

      console.log('✅ DirectSupabaseAuth: User data loaded successfully');
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Error loading user data:', error);
      this.updateAuthState({
        isAuthenticated: false,
        requiresLogin: true,
        lastUpdated: Date.now()
      });
    }
  }

  private async getMonthlyLimitForTier(tier: string): Promise<number> {
    // Query Supabase for the actual monthly limit for this tier
    try {
      console.log('🔍 DirectSupabaseAuth: Querying monthly limit for tier:', tier);
      
      // Query subscription_plans table for the actual limit
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('monthly_limit')
        .eq('plan_name', tier)
        .single();

      if (planError) {
        console.log('⚠️ DirectSupabaseAuth: No subscription_plans table or error:', planError.message);
        
        // Fallback: try to get from subscription data if available
        const { data: subscriptionData, error: subError } = await supabase
          .from('subscriptions')
          .select('monthly_limit')
          .eq('plan', tier)
          .eq('status', 'active')
          .single();

        if (subError) {
          console.log('⚠️ DirectSupabaseAuth: No subscription data found, using fallback limit');
          // Last resort fallback - this should be avoided in production
          return this.getFallbackLimit(tier);
        }

        return subscriptionData.monthly_limit || this.getFallbackLimit(tier);
      }

      return planData.monthly_limit || this.getFallbackLimit(tier);
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Error querying monthly limit:', error);
      return this.getFallbackLimit(tier);
    }
  }

  private getFallbackLimit(tier: string): number {
    // Emergency fallback - this should only be used if Supabase is completely unavailable
    console.warn('⚠️ DirectSupabaseAuth: Using emergency fallback limits - this should not happen in production');
    const emergencyLimits: { [key: string]: number } = {
      'free': 5,
      'basic': 20,
      'professional': 150,
      'executive': 400,
      'premium': 200,
      'enterprise': 1000
    };
    return emergencyLimits[tier] || 5;
  }

  private extractUserName(user: any, profile: any): string {
    // Extract user name from user metadata or email
    return user.user_metadata?.first_name || 
           user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.email?.split('@')[0] || 
           'User';
  }

  private updateAuthState(newState: Partial<DirectSupabaseAuthState>) {
    const previousState = { ...this.authState };
    this.authState = { ...this.authState, ...newState };
    
    // Only notify if state actually changed
    if (this.hasStateChanged(previousState, this.authState)) {
      console.log('📤 DirectSupabaseAuth: Auth state updated:', this.authState);
      this.notifyListeners();
    }
  }

  private hasStateChanged(prev: DirectSupabaseAuthState, current: DirectSupabaseAuthState): boolean {
    return (
      prev.isAuthenticated !== current.isAuthenticated ||
      prev.requiresLogin !== current.requiresLogin ||
      prev.userId !== current.userId ||
      prev.userName !== current.userName ||
      prev.userEmail !== current.userEmail ||
      JSON.stringify(prev.subscriptionInfo) !== JSON.stringify(current.subscriptionInfo)
    );
  }

  private setupPeriodicRefresh() {
    // Clear any existing interval first
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Refresh every 5 minutes, but only if authenticated
    this.refreshInterval = setInterval(async () => {
      // Double-check authentication state before proceeding
      if (!this.authState.isAuthenticated) {
        console.log('🔄 DirectSupabaseAuth: Skipping periodic refresh - not authenticated');
        return;
      }
      
      console.log('🔄 DirectSupabaseAuth: Periodic refresh...');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await this.loadUserData(session.user);
      } else {
        console.log('🔄 DirectSupabaseAuth: No session found during refresh, signing out');
        this.updateAuthState({
          isAuthenticated: false,
          requiresLogin: true,
          userId: undefined,
          userName: undefined,
          userEmail: undefined,
          subscriptionInfo: undefined,
          lastUpdated: Date.now()
        });
        // Clear the interval since we're no longer authenticated
        if (this.refreshInterval) {
          clearInterval(this.refreshInterval);
          this.refreshInterval = null;
        }
      }
    }, 5 * 60 * 1000);
  }

  // Public methods
  public getAuthState(): DirectSupabaseAuthState {
    console.log('🔍 DirectSupabaseAuth: getAuthState called, current state:', this.authState);
    return { ...this.authState };
  }

  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  public requiresLogin(): boolean {
    return this.authState.requiresLogin;
  }

  public getUserId(): string | undefined {
    return this.authState.userId;
  }

  public getUserName(): string | undefined {
    return this.authState.userName;
  }

  public getUserEmail(): string | undefined {
    return this.authState.userEmail;
  }

  public getSubscriptionInfo(): any {
    return this.authState.subscriptionInfo;
  }

  public addAuthStateListener(listener: (state: DirectSupabaseAuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Sign in with email and password using direct Supabase
  public async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 DirectSupabaseAuth: Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ DirectSupabaseAuth: Sign in failed:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }

      if (data.user) {
        console.log('✅ DirectSupabaseAuth: Sign in successful for:', data.user.id);
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

  // Sign out using direct Supabase
  public async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('👋 DirectSupabaseAuth: Signing out...');
      
      // Clear the periodic refresh interval immediately
      if (this.refreshInterval) {
        console.log('🔄 DirectSupabaseAuth: Clearing periodic refresh interval');
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ DirectSupabaseAuth: Sign out error:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }

      console.log('✅ DirectSupabaseAuth: Supabase sign out successful');

      // Immediately clear auth state - don't wait for Supabase event
      console.log('🔄 DirectSupabaseAuth: Immediately clearing auth state');
      this.updateAuthState({
        isAuthenticated: false,
        requiresLogin: true,
        userId: undefined,
        userName: undefined,
        userEmail: undefined,
        subscriptionInfo: undefined,
        lastUpdated: Date.now()
      });

      // Clear any stored session data
      try {
        await chrome.storage.local.remove(['supabase_session', 'auth_state']);
        console.log('✅ DirectSupabaseAuth: Cleared stored session data');
      } catch (storageError) {
        console.log('⚠️ DirectSupabaseAuth: Could not clear storage:', storageError);
      }

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

  // Get the Supabase client for direct API calls
  public getSupabaseClient() {
    return supabase;
  }

  // Submit job directly to Supabase
  public async submitJob(jobData: any): Promise<{ success: boolean; error?: string; job?: any }> {
    try {
      if (!this.authState.isAuthenticated || !this.authState.userId) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('📝 DirectSupabaseAuth: Submitting job:', jobData);

      const { data, error } = await supabase
        .from('jobs')
        .insert({
          user_id: this.authState.userId,
          ...jobData,
          date_saved: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ DirectSupabaseAuth: Job submission failed:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }

      console.log('✅ DirectSupabaseAuth: Job submitted successfully:', data);
      
      // Refresh user data to update usage stats
      await this.refreshUserData();
      
      return { success: true, job: data };
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Job submission error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Refresh user data
  public async refreshUserData(): Promise<void> {
    console.log('🔄 DirectSupabaseAuth: Refreshing user data...');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await this.loadUserData(session.user);
    }
  }

  // Test connection to Supabase
  public async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 DirectSupabaseAuth: Testing Supabase connection...');
      
      // Test basic connection by getting current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ DirectSupabaseAuth: Connection test failed:', error);
        return false;
      }
      
      // Check if we have a valid session
      if (!session?.user) {
        console.log('⚠️ DirectSupabaseAuth: No auth token found');
        // Debug: Check what's in Chrome storage
        chrome.storage.local.get(null, (items) => {
          console.log('🔍 DirectSupabaseAuth: Chrome storage contents:', Object.keys(items));
          const authKeys = Object.keys(items).filter(key => key.includes('auth') || key.includes('supabase'));
          console.log('🔍 DirectSupabaseAuth: Auth-related keys:', authKeys);
        });
        return false;
      }
      
      console.log('🔍 DirectSupabaseAuth: Session found for user:', session.user.id);
      
      // If we have a session, test a simple query
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .limit(1);
      
      if (queryError) {
        console.error('❌ DirectSupabaseAuth: Query test failed:', queryError);
        return false;
      }
      
      console.log('✅ DirectSupabaseAuth: Connection test successful');
      return true;
    } catch (error) {
      console.error('❌ DirectSupabaseAuth: Connection test failed:', error);
      return false;
    }
  }

  // Cleanup
  public destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.listeners = [];
  }

  private notifyListeners() {
    console.log('📤 DirectSupabaseAuth: Notifying', this.listeners.length, 'listeners');
    this.listeners.forEach((listener, index) => {
      try {
        console.log(`📤 DirectSupabaseAuth: Notifying listener ${index + 1}`);
        listener(this.authState);
      } catch (error) {
        console.error('❌ DirectSupabaseAuth: Error in auth state listener:', error);
      }
    });
  }
}

// Export singleton instance
export const directSupabaseAuth = DirectSupabaseAuthService.getInstance();
