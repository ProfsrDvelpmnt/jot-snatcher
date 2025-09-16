import React, { useState } from 'react';
import { TabContainer } from '../Popup/TabContainer';
import { StatusBar } from '../Popup/StatusBar';
import { UsageCounter } from '../Popup/UsageCounter';
import { JobDetails } from '../Popup/JobDetails';
import { JobDescription } from '../Popup/JobDescription';
import { AdminPanel } from '../Popup/AdminPanel';
import { SettingsPanel } from '../Popup/SettingsPanel';
import { ApiMonitor } from '../Dev/ApiMonitor';
import { useJobData } from '@/hooks/useJobData';
import { useAdmin } from '@/hooks/useAdmin';
// import { TABS } from '@/utils/constants';

interface FloatingContentProps {
  onMinimize: () => void;
}

export const FloatingContent: React.FC<FloatingContentProps> = ({ onMinimize }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [showMonitor, setShowMonitor] = useState(false);
  
  // Use admin detection hook
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  
  const {
    jobData,
    usageData,
    isConnected,
    isLoading,
    successMessage,
    setSuccessMessage,
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
            successMessage={successMessage}
            setSuccessMessage={setSuccessMessage}
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
        <UsageCounter usageData={usageData} />
      </div>

      {/* Content */}
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
