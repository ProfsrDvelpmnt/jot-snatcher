// Storage synchronization service for Chrome Extension
// This service allows the extension to access authentication data from both
// localStorage (webapp) and chrome.storage.local (extension)

export interface AuthData {
  currentSession?: any;
  expiresAt?: number;
  refreshToken?: string;
  accessToken?: string;
}

export class StorageSyncService {
  private static instance: StorageSyncService;
  
  private constructor() {}
  
  public static getInstance(): StorageSyncService {
    if (!StorageSyncService.instance) {
      StorageSyncService.instance = new StorageSyncService();
    }
    return StorageSyncService.instance;
  }
  
  // Check for authentication data in webapp's localStorage
  public async getWebappAuthData(): Promise<AuthData | null> {
    try {
      console.log('🔍 StorageSync: Checking webapp localStorage for auth data...');
      
      // Get all localStorage keys
      const keys = Object.keys(localStorage);
      const supabaseKeys = keys.filter(key => 
        key.includes('supabase') || 
        key.includes('sb-') ||
        key.includes('auth-token')
      );
      
      console.log('📊 StorageSync: Found Supabase keys in localStorage:', supabaseKeys);
      
      for (const key of supabaseKeys) {
        const value = localStorage.getItem(key);
        if (value && key.includes('auth-token')) {
          try {
            const parsed = JSON.parse(value);
            console.log('📊 StorageSync: Parsed webapp auth data:', Object.keys(parsed));
            
            if (parsed.currentSession && parsed.currentSession.user) {
              console.log('✅ StorageSync: Found valid webapp session');
              return parsed;
            }
          } catch (error) {
            console.log('⚠️ StorageSync: Failed to parse webapp auth data:', error);
          }
        }
      }
      
      console.log('⚠️ StorageSync: No valid webapp auth data found');
      return null;
    } catch (error) {
      console.error('❌ StorageSync: Error checking webapp localStorage:', error);
      return null;
    }
  }
  
  // Check for authentication data in extension's chrome.storage.local
  public async getExtensionAuthData(): Promise<AuthData | null> {
    try {
      console.log('🔍 StorageSync: Checking extension chrome.storage.local for auth data...');
      
      // Check for Supabase auth tokens in Chrome storage
      const result = await chrome.storage.local.get(['sb-aeoyohqyhawxulisdvqj-auth-token']);
      const token = result['sb-aeoyohqyhawxulisdvqj-auth-token'];
      
      if (token) {
        try {
          const parsed = JSON.parse(token);
          console.log('📊 StorageSync: Found extension auth data:', Object.keys(parsed));
          
          if (parsed.currentSession && parsed.currentSession.user) {
            console.log('✅ StorageSync: Found valid extension session');
            return parsed;
          }
        } catch (error) {
          console.log('⚠️ StorageSync: Failed to parse extension auth data:', error);
        }
      }
      
      console.log('⚠️ StorageSync: No valid extension auth data found');
      return null;
    } catch (error) {
      console.error('❌ StorageSync: Error checking extension storage:', error);
      return null;
    }
  }
  
  // Get authentication data from either storage system
  public async getAuthData(): Promise<AuthData | null> {
    console.log('🔍 StorageSync: Getting authentication data from any available source...');
    
    // First try extension storage (if user logged in through extension)
    const extensionAuth = await this.getExtensionAuthData();
    if (extensionAuth) {
      console.log('✅ StorageSync: Using extension auth data');
      return extensionAuth;
    }
    
    // Then try webapp storage (if user logged in through webapp)
    const webappAuth = await this.getWebappAuthData();
    if (webappAuth) {
      console.log('✅ StorageSync: Using webapp auth data');
      
      // Sync webapp auth data to extension storage for future use
      await this.syncWebappToExtension(webappAuth);
      return webappAuth;
    }
    
    console.log('❌ StorageSync: No authentication data found in any storage');
    return null;
  }
  
  // Sync webapp auth data to extension storage
  public async syncWebappToExtension(webappAuth: AuthData): Promise<void> {
    try {
      console.log('🔄 StorageSync: Syncing webapp auth data to extension storage...');
      
      // Store the webapp auth data in extension storage
      await chrome.storage.local.set({
        'sb-aeoyohqyhawxulisdvqj-auth-token': JSON.stringify(webappAuth)
      });
      
      console.log('✅ StorageSync: Webapp auth data synced to extension storage');
    } catch (error) {
      console.error('❌ StorageSync: Failed to sync webapp auth data:', error);
    }
  }
  
  // Check if user is authenticated in any storage system
  public async isAuthenticated(): Promise<boolean> {
    const authData = await this.getAuthData();
    return authData !== null && !!authData.currentSession?.user;
  }
  
  // Get current user from any storage system
  public async getCurrentUser(): Promise<any | null> {
    const authData = await this.getAuthData();
    return authData?.currentSession?.user || null;
  }
  
  // Get session data from any storage system
  public async getSession(): Promise<any | null> {
    const authData = await this.getAuthData();
    return authData?.currentSession || null;
  }
}

// Export singleton instance
export const storageSync = StorageSyncService.getInstance();
