// Simple Authentication Service for Chrome Extension
// Uses Chrome storage instead of direct Supabase calls

export interface SimpleAuthState {
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

export class SimpleAuthService {
  private static instance: SimpleAuthService;
  private authState: SimpleAuthState = {
    isAuthenticated: false,
    requiresLogin: true,
    lastUpdated: 0
  };
  private listeners: ((state: SimpleAuthState) => void)[] = [];

  private constructor() {
    this.loadAuthState();
  }

  public static getInstance(): SimpleAuthService {
    if (!SimpleAuthService.instance) {
      SimpleAuthService.instance = new SimpleAuthService();
    }
    return SimpleAuthService.instance;
  }

  private async loadAuthState() {
    try {
      console.log('🔧 SimpleAuth: Loading auth state from storage...');
      const result = await chrome.storage.local.get(['authState']);
      console.log('🔧 SimpleAuth: Raw storage result:', result);
      
      if (result.authState) {
        const previousState = { ...this.authState };
        this.authState = { ...this.authState, ...result.authState };
        console.log('🔧 SimpleAuth: Loaded auth state from storage:', this.authState);
        console.log('🔧 SimpleAuth: Previous state:', previousState);
        const stateChanged = this.hasStateChanged(previousState, this.authState);
        console.log('🔧 SimpleAuth: State changed:', stateChanged);
        
        // Notify listeners if state changed
        if (stateChanged) {
          console.log('🔔 SimpleAuth: Notifying listeners of state change');
          this.notifyListeners();
        }
      } else {
        console.log('🔧 SimpleAuth: No auth state found in storage');
      }
    } catch (error) {
      console.error('❌ SimpleAuth: Error loading auth state:', error);
    }
  }

  private async saveAuthState() {
    try {
      await chrome.storage.local.set({ authState: this.authState });
      console.log('💾 SimpleAuth: Saved auth state to storage');
    } catch (error) {
      console.error('❌ SimpleAuth: Error saving auth state:', error);
    }
  }

  private updateAuthState(newState: Partial<SimpleAuthState>) {
    const previousState = { ...this.authState };
    this.authState = { ...this.authState, ...newState, lastUpdated: Date.now() };
    
    // Only notify if state actually changed
    if (this.hasStateChanged(previousState, this.authState)) {
      console.log('📤 SimpleAuth: Auth state updated:', this.authState);
      this.saveAuthState();
      this.notifyListeners();
    }
  }

  private hasStateChanged(prev: SimpleAuthState, current: SimpleAuthState): boolean {
    return (
      prev.isAuthenticated !== current.isAuthenticated ||
      prev.requiresLogin !== current.requiresLogin ||
      prev.userId !== current.userId ||
      prev.userName !== current.userName ||
      prev.userEmail !== current.userEmail ||
      JSON.stringify(prev.subscriptionInfo) !== JSON.stringify(current.subscriptionInfo)
    );
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.authState);
      } catch (error) {
        console.error('❌ SimpleAuth: Error in auth state listener:', error);
      }
    });
  }

  // Public methods
  public getAuthState(): SimpleAuthState {
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

  public addAuthStateListener(listener: (state: SimpleAuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Sign in with email and password
  public async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 SimpleAuth: Attempting sign in for:', email);
      
      // For now, use a simple validation
      // In production, this would call your Supabase API
      if (email && password) {
        // Mock successful login
        this.updateAuthState({
          isAuthenticated: true,
          requiresLogin: false,
          userId: 'user-' + Date.now(),
          userName: email.split('@')[0],
          userEmail: email,
          subscriptionInfo: {
            tier: 'basic',
            monthlyLimit: 20,
            remainingUses: 20,
            currentUsage: 0,
            isActive: true
          }
        });
        
        console.log('✅ SimpleAuth: Sign in successful');
        return { success: true };
      } else {
        return { success: false, error: 'Email and password are required' };
      }
    } catch (error) {
      console.error('❌ SimpleAuth: Sign in error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Sign out
  public async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('👋 SimpleAuth: Signing out...');
      
      this.updateAuthState({
        isAuthenticated: false,
        requiresLogin: true,
        userId: undefined,
        userName: undefined,
        userEmail: undefined,
        subscriptionInfo: undefined
      });
      
      console.log('✅ SimpleAuth: Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('❌ SimpleAuth: Sign out error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Refresh authentication
  public async refreshAuth(): Promise<void> {
    console.log('🔄 SimpleAuth: Refreshing authentication...');
    await this.loadAuthState();
  }

  // Cleanup
  public destroy() {
    this.listeners = [];
  }
}

// Export singleton instance
export const simpleAuth = SimpleAuthService.getInstance();
