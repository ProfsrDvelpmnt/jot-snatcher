import React, { useState } from 'react';
import { TabContainer } from '../Popup/TabContainer';
import { StatusBar } from '../Popup/StatusBar';
import { UsageCounter } from '../Popup/UsageCounter';
import { JobDetails } from '../Popup/JobDetails';
import { JobDescription } from '../Popup/JobDescription';
import { AdminPanel } from '../Popup/AdminPanel';
import { SettingsPanel } from '../Popup/SettingsPanel';
import { ApiMonitor } from '../Dev/ApiMonitor';
import { LoginForm } from '../LoginForm';
import { useJobData } from '@/hooks/useJobData';
import { useTheme } from '@/hooks/useTheme';
import { THEME_OPTIONS } from '@/utils/constants';
import { supabaseAuth } from '@/services/supabaseAuth';
import type { DirectSupabaseAuthState } from '@/services/directSupabaseAuth';
// import { TABS } from '@/utils/constants';

export const IframeContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('details');
  const [isAdmin] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  // Authentication state for iframe - start with not authenticated
  const [authState, setAuthState] = useState<DirectSupabaseAuthState>(() => {
    const initialState: DirectSupabaseAuthState = {
      isAuthenticated: false,
      requiresLogin: true,
      lastUpdated: 0
    };
    console.log('🔍 Iframe: Initial auth state (not authenticated):', initialState);
    return initialState;
  });

  // Supabase connection status (now used for both indicators)
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Check actual API connection
  const checkApiConnection = async (): Promise<boolean> => {
    try {
      // Send message to content script to check connection
      const response = await new Promise((resolve) => {
        window.parent.postMessage({ type: 'CHECK_API_CONNECTION' }, '*');
        
        // Listen for response
        const handleResponse = (event: MessageEvent) => {
          if (event.data.type === 'API_CONNECTION_RESPONSE') {
            window.removeEventListener('message', handleResponse);
            resolve(event.data.isConnected);
          }
        };
        window.addEventListener('message', handleResponse);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          window.removeEventListener('message', handleResponse);
          resolve(false);
        }, 5000);
      });
      
      return response as boolean;
    } catch (error) {
      console.error('❌ Error checking API connection:', error);
      return false;
    }
  };

  // Listen for theme changes and authentication data from content script
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'THEME_CHANGE') {
        toggleTheme(event.data.theme);
      } else if (event.data.type === 'AUTH_STATE_UPDATE') {
        console.log('📨 Iframe: Received auth state update from content script:', event.data.authState);
        console.log('📊 Iframe: Auth state details:', {
          isAuthenticated: event.data.authState?.isAuthenticated,
          userName: event.data.authState?.userName,
          userEmail: event.data.authState?.userEmail,
          userId: event.data.authState?.userId,
          subscriptionInfo: event.data.authState?.subscriptionInfo
        });
        setAuthState(event.data.authState);
      } else if (event.data.type === 'SIGN_OUT') {
        console.log('📨 Iframe: Received sign out message from content script');
        console.log('🔄 Iframe: Calling handleSignOut...');
        handleSignOut();
      } else if (event.data.type === 'WEBAPP_CONNECTION_UPDATE') {
        console.log('📨 Iframe: Received webapp connection update:', event.data.isWebappConnected);
        // SP-JOT status now mirrors Supabase status, so we can ignore this message
        // or use it to update Supabase status if needed
        setIsSupabaseConnected(event.data.isWebappConnected);
      }
    };

    // Listen for auth state changes from Supabase (but only after user interaction)
    const unsubscribe = supabaseAuth.addAuthStateListener((newAuthState) => {
      console.log('📨 Iframe: Auth state changed from SimpleAuth:', newAuthState);
      console.log('📊 Iframe: Auth state details:', {
        isAuthenticated: newAuthState.isAuthenticated,
        requiresLogin: newAuthState.requiresLogin,
        userName: newAuthState.userName,
        userEmail: newAuthState.userEmail,
        userId: newAuthState.userId,
        subscriptionInfo: newAuthState.subscriptionInfo
      });
      
      // Update local state
      setAuthState(newAuthState);
      
      // Only set Supabase connection status to true if user is authenticated AND we can verify API connection
      if (newAuthState.isAuthenticated) {
        // Check actual API connection before showing as connected
        checkApiConnection().then((isConnected) => {
          setIsSupabaseConnected(isConnected);
        });
      } else {
        setIsSupabaseConnected(false);
      }
      
      // Only send messages if this is a significant state change
      // Avoid sending messages for every minor update to prevent loops
      if (newAuthState.isAuthenticated !== authState.isAuthenticated || 
          newAuthState.userId !== authState.userId) {
        
        console.log('📤 Iframe: Significant auth state change, sending updates');
        
        // Send to background script
        try {
          chrome.runtime.sendMessage({
            type: 'AUTH_STATE_UPDATE',
            authState: newAuthState
          }).then((response) => {
            if (response?.success) {
              console.log('✅ Iframe: Auth state sent to background script successfully');
            } else {
              console.log('⚠️ Iframe: Failed to send auth state to background script');
            }
          }).catch((error) => {
            console.error('❌ Iframe: Error sending auth state to background script:', error);
          });
        } catch (error) {
          console.error('❌ Iframe: chrome.runtime.sendMessage not available:', error);
        }
        
        // Send to content script for header updates
        console.log('📤 Iframe: Sending auth state to content script for header update');
        window.parent.postMessage({
          type: 'IFRAME_AUTH_STATE_UPDATE',
          authState: newAuthState
        }, '*');
      } else {
        console.log('📊 Iframe: Minor auth state change, skipping message sending to prevent loops');
      }
    });

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      unsubscribe();
    };
  }, [toggleTheme]);
  
  const {
    jobData,
    usageData,
    isLoading,
    userName,
    userId,
    isAuthenticated,
    collectJobData,
    exportJobData,
    sendJobData,
    clearJobData,
    updateJobData,
    refreshUsageData,
  } = useJobData();

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleClose = () => {
    // Send message to content script to close iframe
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'CLOSE_IFRAME' }, '*');
    } else {
      // Fallback: try to close via chrome runtime
      chrome.runtime.sendMessage({ type: 'CLOSE_IFRAME' });
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('🔄 Iframe: User requested sign out');
      console.log('🔍 Iframe: Current auth state before sign out:', authState);
      console.log('🔍 Iframe: Current Supabase connection status:', isSupabaseConnected);
      
      const result = await supabaseAuth.signOut();
      console.log('🔍 Iframe: Sign out result:', result);
      
      if (result.success) {
        console.log('✅ Iframe: Sign out successful');
        
        // Immediately clear all states - don't wait for listeners
        console.log('🔄 Iframe: Immediately clearing all states');
        setAuthState({
          isAuthenticated: false,
          requiresLogin: true,
          userId: undefined,
          userName: undefined,
          userEmail: undefined,
          subscriptionInfo: undefined,
          lastUpdated: Date.now()
        });
        
        // Clear Supabase connection status (now used for both indicators)
        setIsSupabaseConnected(false);
        
        console.log('✅ Iframe: All states cleared immediately');
      } else {
        console.error('❌ Iframe: Sign out failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Iframe: Error during sign out:', error);
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
          />
        );
      case 'description':
        return <JobDescription jobData={jobData} onUpdate={updateJobData} onSignOut={handleSignOut} />;
      case 'admin':
        return <AdminPanel isAdmin={isAdmin} />;
      default:
        return null;
    }
  };

  // Check if we're in an iframe context
  const isInIframe = window.parent !== window;

  return (
    <div className="w-popup h-popup bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-all duration-300 flex flex-col overflow-hidden">
      {/* Header is now handled by content script iframe container */} b
      
      {/* Show login form if not authenticated */}
      {authState.requiresLogin ? (
        <LoginForm />
      ) : (
        <>
          <TabContainer
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isAdmin={isAdmin}
          />
          
          <StatusBar
            isConnected={isSupabaseConnected}
            statusText={isSupabaseConnected ? "Connected to SP-JOT" : "Not Connected to SP-JOT"}
            isSupabaseConnected={isSupabaseConnected}
            supabaseStatusText={isSupabaseConnected ? "Supabase Connected" : "Supabase Disconnected"}
          />
          
          <UsageCounter usageData={usageData} onRefresh={refreshUsageData} />
          
          <div className="flex-1 overflow-y-auto">
            {renderTabContent()}
          </div>
        </>
      )}

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
