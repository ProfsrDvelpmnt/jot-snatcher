import React, { useState } from 'react';
import { TabContainer } from '../Popup/TabContainer';
import { StatusBar } from '../Popup/StatusBar';
import { JobDetails } from '../Popup/JobDetails';
import { JobDescription } from '../Popup/JobDescription';
import { StatusPanel } from '../Popup/StatusPanel';
import { AdminPanel } from '../Popup/AdminPanel';
import { SignOutPanel } from '../Popup/SignOutPanel';
import { UsageDisplay } from '../Header/UsageDisplay';
import { useJobData } from '@/hooks/useJobData';
import { isAdminEmail } from '@/utils/adminUtils';
// import { useAdmin } from '@/hooks/useAdmin'; // TEMPORARY: Disabled for troubleshooting
// import { TABS } from '@/utils/constants';

interface FloatingContentProps {
  onMinimize: () => void;
}

export const FloatingContent: React.FC<FloatingContentProps> = ({ onMinimize }) => {
  const [activeTab, setActiveTab] = useState('details');
  
  const {
    jobData,
    usageData,
    isConnected,
    isLoading,
    isAuthenticated,
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
      console.log('🔄 FloatingContent: User requested sign out');
      // For floating content, we can send a message to close the iframe
      window.parent.postMessage({ type: 'SIGN_OUT' }, '*');
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
    <div className="w-full h-full bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text rounded-2xl shadow-2xl border border-light-border dark:border-dark-border overflow-hidden flex flex-col">
      {/* Minimize Button */}
      <button
        onClick={onMinimize}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold transition-all duration-200 hover:scale-110"
        title="Minimize"
      >
        −
      </button>

      {/* Header */}
      <div className="bg-terracotta text-white p-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={chrome.runtime.getURL('icons/spjot-48.png')} 
              alt="SP JOT Collector" 
              className="w-8 h-8 mr-3"
            />
            <div>
              <h2 className="text-lg font-bold">SP JOT Collector</h2>
              <p className="text-sm text-white/80">Extract and edit job information</p>
            </div>
          </div>
          {/* Usage Display in Header */}
          <div className="flex items-center">
            <UsageDisplay 
              usageData={usageData || undefined} 
              isCompact={true}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
          <TabContainer
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isAdmin={isAdmin}
          />
      </div>

      {/* Status */}
      <div className="px-4">
        <StatusBar
          isConnected={isConnected}
          statusText={isConnected ? "Connected to SP-JOT" : "Not Connected"}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>

    </div>
  );
};
