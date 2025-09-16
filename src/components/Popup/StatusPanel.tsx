import React, { useState } from 'react';
import { SubscriptionCard } from './SubscriptionCard';

interface StatusPanelProps {
  isConnected: boolean;
  usageData: any;
  isAuthenticated: boolean;
  userName?: string;
  userEmail?: string;
  onRefresh?: () => void;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  isConnected,
  usageData,
  isAuthenticated,
  userName,
  userEmail,
  onRefresh
}) => {
  const [isExtensionCardExpanded, setIsExtensionCardExpanded] = useState(false);

  return (
    <div className="px-4 space-y-6">
      {/* New Subscription Card (from image) */}
      <SubscriptionCard usageData={usageData} />
      
      {/* Original Extension Status Card */}
      <div className="bg-light-card-bg dark:bg-dark-card-bg rounded-lg border border-light-border dark:border-dark-border">
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
            📊 Extension Status
          </h3>
          <button
            onClick={() => setIsExtensionCardExpanded(!isExtensionCardExpanded)}
            className="p-1 hover:bg-light-border dark:hover:bg-dark-border rounded transition-colors duration-200"
            title={isExtensionCardExpanded ? "Collapse" : "Expand"}
          >
            <svg 
              className={`w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary transition-transform duration-200 ${
                isExtensionCardExpanded ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {isExtensionCardExpanded && (
          <div className="px-4 pb-4">
            <div className="space-y-4">
              {/* Authentication Status */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">🔐</span>
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Authentication</span>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-medium ${
                  isAuthenticated 
                    ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                    : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                }`}>
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>

              {/* User Info */}
              {isAuthenticated && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    👤 User Information
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div><strong>Name:</strong> {userName || 'N/A'}</div>
                    <div><strong>Email:</strong> {userEmail || 'N/A'}</div>
                  </div>
                </div>
              )}

              {/* System Information */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  ⚙️ System Information
                </div>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div><strong>Extension Version:</strong> 1.0.0</div>
                  <div><strong>Browser:</strong> Chrome</div>
                  <div><strong>Current Site:</strong> {window.location.hostname}</div>
                  <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};