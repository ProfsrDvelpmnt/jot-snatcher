import React, { useState } from 'react';

interface SignOutPanelProps {
  onSignOut: () => void;
  userName?: string;
  userEmail?: string;
}

export const SignOutPanel: React.FC<SignOutPanelProps> = ({ 
  onSignOut, 
  userName, 
  userEmail 
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSignOutClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSignOut = () => {
    setShowConfirmation(false);
    onSignOut();
  };

  const handleCancelSignOut = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="px-4">
      <div className="bg-light-card-bg dark:bg-dark-card-bg rounded-lg p-6 border border-light-border dark:border-dark-border">
        <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
          🔐 Account Management
        </h3>
        
        <div className="space-y-4">
          {/* User Information */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
              👤 Current Session
            </div>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div><strong>Name:</strong> {userName || 'N/A'}</div>
              {userEmail && <div><strong>Email:</strong> {userEmail}</div>}
            </div>
          </div>

          {/* Sign Out Section */}
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-3">
              🚪 Sign Out
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              Sign out of your current session. You will need to log in again to use the extension.
            </p>
            
            {!showConfirmation ? (
              <button
                onClick={handleSignOutClick}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Sign Out
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    ⚠️ Confirm Sign Out
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Are you sure you want to sign out? You will need to log in again to use the extension.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmSignOut}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Yes, Sign Out
                  </button>
                  <button
                    onClick={handleCancelSignOut}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
