// Configuration service for API settings
import { ApiConfig } from './api';

export interface ExtensionConfig {
  api: ApiConfig;
  features: {
    autoCollect: boolean;
    notifications: boolean;
    debugMode: boolean;
  };
  ui: {
    theme: 'light' | 'dark';
    showFloatingButton: boolean;
  };
}

const defaultConfig: ExtensionConfig = {
  api: {
    baseUrl: 'https://aeoyohqyhawxulisdvqj.supabase.co/rest/v1', // Direct Supabase REST API
    apiKey: undefined,
    timeout: 10000,
  },
  features: {
    autoCollect: false,
    notifications: true,
    debugMode: false,
  },
  ui: {
    theme: 'light',
    showFloatingButton: true,
  },
};

export class ConfigService {
  private config: ExtensionConfig;

  constructor() {
    this.config = { ...defaultConfig };
    this.loadConfig();
  }

  // Load configuration from storage
  private async loadConfig(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['extensionConfig'], (result) => {
        if (result.extensionConfig) {
          this.config = { ...defaultConfig, ...result.extensionConfig };
        }
        resolve();
      });
    });
  }

  // Save configuration to storage
  async saveConfig(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ extensionConfig: this.config }, () => {
        resolve();
      });
    });
  }

  // Get current configuration
  getConfig(): ExtensionConfig {
    return { ...this.config };
  }

  // Update API configuration
  async updateApiConfig(apiConfig: Partial<ApiConfig>): Promise<void> {
    this.config.api = { ...this.config.api, ...apiConfig };
    await this.saveConfig();
  }

  // Update feature settings
  async updateFeatures(features: Partial<ExtensionConfig['features']>): Promise<void> {
    this.config.features = { ...this.config.features, ...features };
    await this.saveConfig();
  }

  // Update UI settings
  async updateUI(ui: Partial<ExtensionConfig['ui']>): Promise<void> {
    this.config.ui = { ...this.config.ui, ...ui };
    await this.saveConfig();
  }

  // Get API base URL
  getApiBaseUrl(): string {
    return this.config.api.baseUrl;
  }

  // Get API key
  getApiKey(): string | undefined {
    return this.config.api.apiKey;
  }

  // Check if API is configured
  isApiConfigured(): boolean {
    return !!(this.config.api.baseUrl && this.config.api.baseUrl !== 'https://your-webapp.com');
  }

  // Check if debug mode is enabled
  isDebugMode(): boolean {
    return this.config.features.debugMode;
  }

  // Toggle debug mode
  async toggleDebugMode(): Promise<void> {
    await this.updateFeatures({ debugMode: !this.config.features.debugMode });
  }

  // Reset to default configuration
  async resetToDefault(): Promise<void> {
    this.config = { ...defaultConfig };
    await this.saveConfig();
  }
}

// Export singleton instance
export const configService = new ConfigService();
