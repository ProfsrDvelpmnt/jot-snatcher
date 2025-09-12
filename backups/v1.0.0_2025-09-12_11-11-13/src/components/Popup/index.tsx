import React, { useState } from 'react';
import { PopupHeader } from './PopupHeader';
import { TabContainer } from './TabContainer';
import { StatusBar } from './StatusBar';
import { UsageCounter } from './UsageCounter';
import { JobDetails } from './JobDetails';
import { JobDescription } from './JobDescription';
import { AdminPanel } from './AdminPanel';
import { SettingsPanel } from './SettingsPanel';
import { ApiMonitor } from '../Dev/ApiMonitor';
import { LoginForm } from '../LoginForm';
import { useJobData } from '@/hooks/useJobData';
// import { TABS } from '@/utils/constants';

export const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState('details');
  const [isAdmin] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  
  const {
    jobData,
    usageData,
    isConnected,
    isLoading,
    isAuthenticated,
    requiresLogin,
    collectJobData,
    exportJobData,
    sendJobData,
    clearJobData,
    updateJobData,
  } = useJobData();

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
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
          />
        );
      case 'description':
        return <JobDescription jobData={jobData} onUpdate={updateJobData} />;
      case 'admin':
        return <AdminPanel isAdmin={isAdmin} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-popup h-popup bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-all duration-300 flex flex-col overflow-hidden">
      <PopupHeader hideInIframe={true} />
      
      {/* Show login form if not authenticated */}
      {requiresLogin ? (
        <LoginForm />
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
          
          <UsageCounter usageData={usageData} />
        </>
      )}
      
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>

      {/* Settings Panel at Bottom */}
      <SettingsPanel 
        onMonitorToggle={setShowMonitor} 
        showMonitor={showMonitor} 
      />
      
      {/* API Monitor Overlay */}
      <ApiMonitor isVisible={showMonitor} onClose={() => setShowMonitor(false)} />
    </div>
  );
};
