import React, { useState, useEffect } from 'react';
import { configService } from '@/services/config';
import { apiService } from '@/services/api';
import { ApiMonitor } from '../Dev/ApiMonitor';

interface AdminPanelProps {
  isAdmin: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isAdmin }) => {
  const [isDevMode, setIsDevMode] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Check if we're in development mode
    const checkDevMode = () => {
      const config = configService.getConfig();
      setIsDevMode(config.features.debugMode);
    };

    checkDevMode();
    
    // Listen for config changes
    const interval = setInterval(checkDevMode, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleDevMode = async () => {
    const newDevMode = !isDevMode;
    await configService.updateFeatures({ debugMode: newDevMode });
    setIsDevMode(newDevMode);
    
    if (!newDevMode) {
      setShowMonitor(false);
    }
  };

  const toggleMonitor = () => {
    const newShowMonitor = !showMonitor;
    setShowMonitor(newShowMonitor);
  };

  if (!isAdmin) {
    return (
      <div className="px-4 py-8 text-center text-light-text-secondary dark:text-dark-text-secondary">
        <div className="text-4xl mb-2">🔒</div>
        <p>Admin access required</p>
        <p className="text-sm mt-1">Contact administrator for access</p>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="bg-light-card-bg dark:bg-dark-card-bg rounded-lg p-4 border border-light-border dark:border-dark-border">
        <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
          🔧 Admin Panel
        </h3>
        
        <div className="space-y-4">
          {/* Development Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center">
              <span className="text-yellow-600 dark:text-yellow-400 mr-2">⚙️</span>
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Development Mode</span>
            </div>
            <button
              onClick={toggleDevMode}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                isDevMode
                  ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {isDevMode ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Development Tools - Only show when dev mode is enabled */}
          {isDevMode && (
            <div className="space-y-3 pt-3 border-t border-light-border dark:border-dark-border">
              <div className="text-sm font-medium text-light-text dark:text-dark-text">
                🔍 Development Tools
              </div>
              
              {/* API Monitor Toggle */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">📊</span>
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">API Monitor</span>
                </div>
                <button
                  onClick={toggleMonitor}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    showMonitor
                      ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {showMonitor ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Quick Actions */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                  ⚡ Quick Actions
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('http://localhost:8080/api/ext-health', {
                          method: 'GET',
                          headers: {
                            'Content-Type': 'application/json'
                          }
                        });
                        const result = response.ok;
                        alert(result ? 'API Connection: OK' : `API Connection: FAILED (${response.status})`);
                      } catch (error) {
                        alert(`API Connection: FAILED - ${error}`);
                      }
                    }}
                    className="px-3 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs hover:bg-green-300 dark:hover:bg-green-700 transition-colors"
                    title="Test API Connection"
                  >
                    Test API
                  </button>
                  <button
                    onClick={() => {
                      apiService.clearMonitor();
                    }}
                    className="px-3 py-1 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded text-xs hover:bg-red-300 dark:hover:bg-red-700 transition-colors"
                    title="Clear API History"
                  >
                    Clear History
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔧 Admin: Exporting debug info...');
                      const debugInfo = {
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        url: window.location.href,
                        config: configService.getConfig(),
                        apiMonitor: apiService.getMonitor()
                      };
                      console.log('📊 Debug Info:', debugInfo);
                      alert('Debug info exported to console');
                    }}
                    className="px-3 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors"
                    title="Export Debug Info"
                  >
                    Export Debug
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API Monitor Overlay */}
      <ApiMonitor isVisible={showMonitor} onClose={() => setShowMonitor(false)} />
    </div>
  );
};
