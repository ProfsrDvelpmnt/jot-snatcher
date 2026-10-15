import { useState, useEffect } from 'react';
import { JobSubmission, UsageData } from '../services/api';
import { supabaseAuth } from '../services/supabaseAuth';
import { PDFExporter } from '../utils/pdfExporter';

export const useJobData = () => {
  const [jobData, setJobData] = useState<JobSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [captureNotice, setCaptureNotice] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes from content script
    const handleAuthStateChange = (newAuthState: any) => {
      console.log('🔄 Iframe: Auth state changed in useJobData:', newAuthState);
      setIsConnected(newAuthState.isAuthenticated);
      setIsAuthenticated(newAuthState.isAuthenticated);
      setRequiresLogin(newAuthState.requiresLogin || false);
      setUserName(newAuthState.userName || null);
      setUserId(newAuthState.userId || null);
      
      // Update usage data if available, or clear it if user is not authenticated
      if (newAuthState.isAuthenticated && newAuthState.subscriptionInfo) {
        console.log('📊 Iframe: Updating usage data from auth state:', newAuthState.subscriptionInfo);
        setUsageData(newAuthState.subscriptionInfo);
      } else if (!newAuthState.isAuthenticated) {
        console.log('📊 Iframe: Clearing usage data - user not authenticated');
        setUsageData(null);
      }
    };
    
    // Listen for messages from content script
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'AUTH_STATE_UPDATE' && event.data?.authState) {
        console.log('📨 Iframe: Received auth state update in useJobData:', event.data.authState);
        handleAuthStateChange(event.data.authState);
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    const checkAuthenticationStatus = async () => {
      try {
        console.log('🔍 Checking authentication status using DirectSupabaseAuth...');
        
        const response = await chrome.runtime.sendMessage({ type: 'CHECK_CONNECTION' });
        const data = response?.success ? response.data : null;
        const signedIn = !!data?.isAuthenticated;
        setIsConnected(signedIn);
        setIsAuthenticated(signedIn);
        setRequiresLogin(!signedIn);
        setUserName(data?.userName || null);
        setUserId(data?.userId || null);
        if (data?.usageData) setUsageData(data.usageData);
        else setUsageData(null);
        if (data?.sessionExpired) setSuccessMessage('Your session expired. Sign in again.');
      } catch (error) {
        console.error('❌ Error checking authentication status:', error);
        setIsConnected(false);
        setIsAuthenticated(false);
        setRequiresLogin(true);
      }
    };

    // Check authentication status on mount (but only if there's an existing session)
    checkAuthenticationStatus();
    
    // Cleanup function
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  // Set up authentication state listener
  useEffect(() => {
    const unsubscribe = supabaseAuth.addAuthStateListener((authState) => {
      console.log('🔄 Auth state changed:', authState);
      
      // Only update state if there's a significant change to prevent loops
      const currentAuth = isAuthenticated;
      const currentUserId = userId;
      
      if (authState.isAuthenticated !== currentAuth || authState.userId !== currentUserId) {
        console.log('📊 Iframe: Updating usage data from auth state:', authState.subscriptionInfo);
        setIsConnected(authState.isAuthenticated);
        setIsAuthenticated(authState.isAuthenticated);
        setRequiresLogin(authState.requiresLogin);
        setUserName(authState.userName || null);
        setUserId(authState.userId || null);
        
        // Update usage data if authenticated
        if (authState.isAuthenticated && authState.subscriptionInfo) {
          // Convert subscription info to UsageData format
          const usageData = {
            currentMonth: authState.subscriptionInfo.currentUsage || 0,
            monthlyLimit: authState.subscriptionInfo.monthlyLimit || 0,
            remainingUses: authState.subscriptionInfo.remainingUses || 0,
            tier: authState.subscriptionInfo.tier || 'free',
            isActive: authState.subscriptionInfo.isActive || false
          };
          setUsageData(usageData);
        } else {
          console.log('📊 Iframe: Clearing usage data - user not authenticated');
          setUsageData(null);
        }
      }
    });

    return unsubscribe;
  }, [isAuthenticated, userId]);

  const collectJobData = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Collecting job data...');
      const result = await chrome.runtime.sendMessage({ type: 'EXTRACT_JOB_DATA' });
      
      if (result.success && result.data) {
        setJobData(result.data);
        setCaptureNotice(result.generic ? "This site isn't fully supported yet. Please review the fields." : null);
        console.log('✅ Job data collected:', result.data);
      } else {
        console.log('❌ Failed to collect job data:', result.error);
      }
    } catch (error) {
      console.error('❌ Error collecting job data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportJobData = async () => {
    if (!jobData) {
      console.log('⚠️ No job data to export');
      return;
    }

    try {
      console.log('🚀 Starting PDF export...');
      await PDFExporter.exportJobDataAsPDF(jobData);
      console.log('✅ Job data exported as PDF');
    } catch (error) {
      console.error('❌ Error exporting job data as PDF:', error);
      
      // Fallback to JSON export if PDF fails
      try {
        console.log('🔄 Falling back to JSON export...');
        const dataStr = JSON.stringify(jobData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `job-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        console.log('✅ Job data exported as JSON (fallback)');
      } catch (fallbackError) {
        console.error('❌ Error with JSON fallback export:', fallbackError);
      }
    }
  };

  const sendJobData = async () => {
    if (!jobData) {
      console.log('⚠️ No job data to send');
      return;
    }

    if (!isAuthenticated) {
      setSuccessMessage('Your session expired. Sign in again.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📤 Sending job data...');
      const result = await chrome.runtime.sendMessage({ 
        type: 'SUBMIT_JOB', 
        jobData: jobData 
      });
      
      if (result.success) {
        console.log('✅ Job data sent successfully');
        // Clear job data after successful send
        setJobData(null);
        // Force refresh of auth state to get updated usage data
        await chrome.runtime.sendMessage({ type: 'CHECK_CONNECTION' });
        // Wait a moment for database to be updated, then refresh usage data
        setTimeout(async () => {
          await refreshUsageData();
        }, 1000);
        // Show success message
        setSuccessMessage('🎉 Job submitted successfully! Form cleared and usage updated.');
        // Clear success message after 8 seconds (longer for popup)
        setTimeout(() => setSuccessMessage(null), 8000);
        console.log('🎉 Job submitted successfully! Form cleared and usage updated.');
      } else {
        console.log('❌ Failed to send job data:', result.error);
        const message = result.sessionExpired
          ? 'Your session expired. Sign in again.'
          : `❌ Failed to submit job: ${result.error}`;
        setSuccessMessage(message);
        // Clear error message after 8 seconds (longer for popup)
        setTimeout(() => setSuccessMessage(null), 8000);
      }
    } catch (error) {
      console.error('❌ Error sending job data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearJobData = () => {
    setJobData(null);
    console.log('🗑️ Job data cleared');
  };

  const updateJobData = (updates: Partial<JobSubmission>) => {
    if (jobData) {
      setJobData({ ...jobData, ...updates });
      console.log('📝 Job data updated:', updates);
    }
  };

  // Function to refresh usage data
  const refreshUsageData = async (): Promise<void> => {
    try {
      console.log('🔄 Refreshing usage data...');
      setIsLoading(true);
      
      // Try to get fresh usage data from background script
      const usageResult = await chrome.runtime.sendMessage({ type: 'GET_USAGE_DATA' });
      console.log('📊 Refreshed usage data result:', usageResult);
      
      if (usageResult.success && usageResult.data) {
        setUsageData(usageResult.data);
        console.log('✅ Usage data refreshed successfully:', usageResult.data);
      } else {
        console.log('⚠️ Could not refresh usage data:', usageResult.error);
      }
    } catch (error) {
      console.error('❌ Error refreshing usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    jobData,
    usageData,
    isConnected,
    isLoading,
    isAuthenticated,
    requiresLogin,
    userName,
    userId,
    successMessage,
    captureNotice,
    setSuccessMessage,
    collectJobData,
    exportJobData,
    sendJobData,
    clearJobData,
    updateJobData,
    refreshUsageData,
  };
};