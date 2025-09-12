import React, { useState, useEffect } from 'react';
import { configService } from '@/services/config';
import { apiService } from '@/services/api';

interface SettingsPanelProps {
  onMonitorToggle: (visible: boolean) => void;
  showMonitor: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  onMonitorToggle, 
  showMonitor 
}) => {
  const [isDevMode, setIsDevMode] = useState(false);
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
      onMonitorToggle(false);
    }
  };

  const toggleMonitor = () => {
    const newShowMonitor = !showMonitor;
    onMonitorToggle(newShowMonitor);
  };

  return (
    <div className="border-t border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg">
      {/* Settings Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 text-left text-sm text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-hover dark:hover:bg-dark-hover transition-colors duration-200 flex items-center justify-between"
      >
        <span className="flex items-center">
          <span className="mr-2">⚙️</span>
          Settings
        </span>
        <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Settings Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Development Mode Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-light-text dark:text-dark-text">Development Mode</span>
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
            <div className="space-y-2 pt-2 border-t border-light-border dark:border-dark-border">
              <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary font-medium">
                Development Tools
              </div>
              
              {/* API Monitor Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-light-text dark:text-dark-text">API Monitor</span>
                <button
                  onClick={toggleMonitor}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    showMonitor
                      ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {showMonitor ? 'Show' : 'Hide'}
                </button>
              </div>

              {/* Quick Actions */}
              <div className="space-y-1">
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  Quick Actions
                </div>
                <div className="flex space-x-2">
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
                    className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs hover:bg-green-300 dark:hover:bg-green-700 transition-colors"
                    title="Test API Connection"
                  >
                    Test API
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('http://localhost:8080/api/ext-usage', {
                          method: 'GET',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-user-id': 'e4c6cc9a-d835-4291-b51b-ace887de4ffa'
                          }
                        });
                        if (response.ok) {
                          const data = await response.json();
                          alert(`Connection Status: CONNECTED\nUsage: ${data.currentMonth}/${data.monthlyLimit}\nTier: ${data.tier}\nRemaining: ${data.remainingUses}`);
                        } else {
                          alert(`Connection Status: DISCONNECTED\nError: HTTP ${response.status} - ${response.statusText}`);
                        }
                      } catch (error) {
                        alert(`Connection Status: DISCONNECTED\nError: ${error}`);
                      }
                    }}
                    className="px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors"
                    title="Refresh Connection Status"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => {
                      apiService.clearMonitor();
                    }}
                    className="px-2 py-1 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded text-xs hover:bg-red-300 dark:hover:bg-red-700 transition-colors"
                    title="Clear API History"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
