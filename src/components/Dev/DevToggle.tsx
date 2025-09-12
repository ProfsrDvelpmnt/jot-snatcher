import React, { useState, useEffect } from 'react';
import { configService } from '@/services/config';
import { apiService } from '@/services/api';

interface DevToggleProps {
  onMonitorToggle: (visible: boolean) => void;
}

export const DevToggle: React.FC<DevToggleProps> = ({ onMonitorToggle }) => {
  const [isDevMode, setIsDevMode] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);

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
      onMonitorToggle(false);
    }
  };

  const toggleMonitor = () => {
    const newShowMonitor = !showMonitor;
    setShowMonitor(newShowMonitor);
    onMonitorToggle(newShowMonitor);
  };

  // Only show in development mode
  if (!isDevMode) return null;

  return (
    <div className="fixed top-4 left-4 z-50 flex flex-col space-y-2">
      {/* Dev Mode Toggle */}
      <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-2 shadow-lg">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-yellow-800 dark:text-yellow-200">🔧 DEV MODE</span>
          <button
            onClick={toggleDevMode}
            className="px-2 py-1 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded text-xs hover:bg-yellow-300 dark:hover:bg-yellow-700"
          >
            Disable
          </button>
        </div>
      </div>

      {/* Monitor Toggle */}
      <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-2 shadow-lg">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-blue-800 dark:text-blue-200">📊 API Monitor</span>
          <button
            onClick={toggleMonitor}
            className={`px-2 py-1 rounded text-xs ${
              showMonitor
                ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
            } hover:opacity-80`}
          >
            {showMonitor ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-2 shadow-lg">
        <div className="text-sm text-green-800 dark:text-green-200 mb-1">Quick Actions</div>
        <div className="flex space-x-1">
          <button
            onClick={() => {
              // Test API connection
              apiService.testConnection().then((result: boolean) => {
                alert(result ? 'API Connection: OK' : 'API Connection: FAILED');
              });
            }}
            className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs hover:bg-green-300 dark:hover:bg-green-700"
            title="Test API Connection"
          >
            Test API
          </button>
          <button
            onClick={() => {
              // Clear API monitor
              apiService.clearMonitor();
            }}
            className="px-2 py-1 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded text-xs hover:bg-red-300 dark:hover:bg-red-700"
            title="Clear API History"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
