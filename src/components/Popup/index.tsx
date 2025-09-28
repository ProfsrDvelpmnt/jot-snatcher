import React, { useState } from 'react';
import { PopupHeader } from './PopupHeader';
import { TabContainer } from './TabContainer';
import { StatusBar } from './StatusBar';
import { UsageCounter } from './UsageCounter';
import { JobDetails } from './JobDetails';
import { JobDescription } from './JobDescription';
import { StatusPanel } from './StatusPanel';
import { AdminPanel } from './AdminPanel';
import { SignOutPanel } from './SignOutPanel';
import { LoginForm } from '../LoginForm';
import { DraggableLoginForm } from '../DraggableLoginForm';
import { useJobData } from '@/hooks/useJobData';
import { isAdminEmail } from '@/utils/adminUtils';
// import { TABS } from '@/utils/constants';

export const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState('details');
  
  const {
    jobData,
    usageData,
    isConnected,
    isLoading,
    isAuthenticated,
    requiresLogin,
    userName,
    successMessage,
    setSuccessMessage,
    collectJobData,
    exportJobData,
    sendJobData,
    clearJobData,
    updateJobData,
    refreshUsageData,
  } = useJobData();

  // Check if current user is admin
  const isAdmin = isAdminEmail(userName || '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleSignOut = async () => {
    try {
      console.log('🔄 Popup: User requested sign out');
      // For popup, we can simply redirect to login or clear local state
      // The actual sign out logic would depend on the authentication system
      window.location.reload(); // Simple approach for popup
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <JobDetails
            jobData={jobData}
            onCollect={collectJobData}
            onExport={exportJobData}
            onSend={sendJobData}
            onClear={clearJobData}
            onUpdate={updateJobData}
            isLoading={isLoading}
            successMessage={successMessage}
            setSuccessMessage={setSuccessMessage}
          />
        );
      case 'description':
        return <JobDescription jobData={jobData} onUpdate={updateJobData} />;
      case 'status':
        return (
          <StatusPanel
            isConnected={isConnected}
            usageData={usageData}
            isAuthenticated={isAuthenticated}
            onRefresh={refreshUsageData}
          />
        );
      case 'admin':
        return <AdminPanel isAdmin={isAdmin} />;
      case 'signout':
        return <SignOutPanel onSignOut={handleSignOut} userName={userName || undefined} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-popup h-popup bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-all duration-300 flex flex-col overflow-hidden">
              <PopupHeader hideInIframe={true} usageData={usageData} />
      
      {/* Show login form if not authenticated */}
      {requiresLogin ? (
        <DraggableLoginForm />
      ) : (
        <>
          <TabContainer
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isAdmin={isAdmin}
          />
          
                  <StatusBar
                    isConnected={isConnected}
                    statusText={isConnected ? "Connected to SP-JOT" : "Not Connected"}
                  />
        </>
      )}
      
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>

    </div>
  );
};
