import React, { useState, useEffect } from 'react';

interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  debugMode?: boolean;
}

interface ApiConfigProps {
  onConfigUpdate?: (config: ApiConfig) => void;
}

export const ApiConfig: React.FC<ApiConfigProps> = ({ onConfigUpdate }) => {
  const [config, setConfig] = useState<ApiConfig>({
    baseUrl: 'http://127.0.0.1:8080',
    apiKey: '',
    timeout: 10000,
    debugMode: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_API_CONFIG' });
      if (response.success && response.config) {
        setConfig(response.config.api || config);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_API_CONFIG',
        config: config
      });
      
      if (response.success) {
        setTestResult({ success: true, message: 'Configuration saved successfully!' });
        onConfigUpdate?.(config);
      } else {
        setTestResult({ success: false, message: response.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to save configuration' });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'TEST_API_CONNECTION' });
      
      if (response.success) {
        if (response.connected) {
          setTestResult({ success: true, message: 'API connection successful!' });
        } else {
          setTestResult({ success: false, message: 'API connection failed' });
        }
      } else {
        setTestResult({ success: false, message: response.error || 'Connection test failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Connection test failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ApiConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setTestResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure your webapp API endpoints to enable real job data collection and usage tracking.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Base URL
          </label>
          <input
            type="url"
            value={config.baseUrl}
            onChange={(e) => handleInputChange('baseUrl', e.target.value)}
            placeholder="https://your-webapp.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            The base URL of your webapp API (e.g., https://api.yourwebapp.com)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key (Optional)
          </label>
          <input
            type="password"
            value={config.apiKey || ''}
            onChange={(e) => handleInputChange('apiKey', e.target.value)}
            placeholder="Your API key"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            API key for authentication (if required by your webapp)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timeout (milliseconds)
          </label>
          <input
            type="number"
            value={config.timeout || 10000}
            onChange={(e) => handleInputChange('timeout', parseInt(e.target.value) || 10000)}
            min="1000"
            max="60000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Request timeout in milliseconds (1000-60000)
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div>
            <label className="text-sm font-medium text-yellow-800">
              Debug Mode
            </label>
            <p className="text-xs text-yellow-700 mt-1">
              Enable development monitoring and API call tracking
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.debugMode || false}
              onChange={(e) => handleInputChange('debugMode', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {testResult && (
        <div className={`p-3 rounded-lg ${
          testResult.success 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {testResult.message}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={testConnection}
          disabled={isLoading || !config.baseUrl}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button
          onClick={saveConfig}
          disabled={isLoading || !config.baseUrl}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Required API Endpoints</h3>
        <p className="text-sm text-blue-700 mb-2">
          Your webapp needs to implement these extension-specific endpoints:
        </p>
        <ul className="text-xs text-blue-700 space-y-1 ml-4">
          <li>• <code>GET /api/ext-health</code> - Health check for extension</li>
          <li>• <code>GET /api/ext-status</code> - Check connection and get usage data</li>
          <li>• <code>POST /api/ext-jobs</code> - Submit collected job data</li>
          <li>• <code>GET /api/ext-usage</code> - Get user's daily usage</li>
        </ul>
      </div>

      {config.debugMode && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-2">🔧 Debug Mode Enabled</h3>
          <p className="text-sm text-green-700 mb-2">
            Development tools are now available in the extension iframe:
          </p>
          <ul className="text-xs text-green-700 space-y-1 ml-4">
            <li>• <strong>API Monitor</strong> - Real-time API call tracking</li>
            <li>• <strong>Performance Metrics</strong> - Response times and success rates</li>
            <li>• <strong>Error Logging</strong> - Detailed error messages</li>
            <li>• <strong>Response Inspection</strong> - View API response data</li>
          </ul>
          <p className="text-xs text-green-600 mt-2">
            💡 Visit a job site and click the floating button to see the development tools!
          </p>
        </div>
      )}
    </div>
  );
};
