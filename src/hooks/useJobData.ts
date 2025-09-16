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
        
        // Use direct Supabase auth to check authentication status
        const authState = supabaseAuth.getAuthState();
        console.log('🔍 DirectSupabaseAuth state:', authState);
        
        setIsConnected(authState.isAuthenticated);
        setIsAuthenticated(authState.isAuthenticated);
        setRequiresLogin(authState.requiresLogin);
        setUserName(authState.userName || null);
        setUserId(authState.userId || null);
        
        if (authState.isAuthenticated) {
          console.log('✅ User is authenticated, proceeding with data collection...');
          
          // Try to get usage data through the background script
          try {
            console.log('🔍 Trying to get usage data from background script...');
            const usageResult = await chrome.runtime.sendMessage({ type: 'GET_USAGE_DATA' });
            console.log('📊 Usage data result:', usageResult);
            
            if (usageResult.success && usageResult.data) {
              setUsageData(usageResult.data);
              console.log('✅ Got usage data from API:', usageResult.data);
            } else if (usageResult.error && usageResult.error.includes('not authenticated')) {
              console.log('⚠️ User not authenticated for API calls, using webapp data only');
            } else {
              console.log('⚠️ Could not get usage data from background script, trying direct Supabase auth data...');
              
              // Try to extract usage data from direct Supabase auth state
              const extractUsageData = () => {
                const supabaseUserData = authState.subscriptionInfo;
                console.log('🔍 Checking Supabase usage data:', supabaseUserData);
                
                // Check if we have real subscription data (not default/initial data)
                const hasRealData = supabaseUserData && 
                                  supabaseUserData.tier && 
                                  supabaseUserData.monthlyLimit;
                
                if (hasRealData) {
                  const usageData = {
                    currentMonth: supabaseUserData.currentUsage || 0,
                    monthlyLimit: supabaseUserData.monthlyLimit,
                    remainingUses: supabaseUserData.remainingUses || (supabaseUserData.monthlyLimit - (supabaseUserData.currentUsage || 0)),
                    userId: authState.userId || 'supabase-user',
                    tier: supabaseUserData.tier,
                    lastUpdated: new Date().toISOString()
                  };
                  setUsageData(usageData);
                  console.log('✅ Got real usage data from Supabase:', usageData);
                  return true;
                } else if (supabaseUserData) {
                  console.log('⚠️ Supabase data found but appears to be default/initial data:', {
                    tier: supabaseUserData.tier,
                    monthlyLimit: supabaseUserData.monthlyLimit,
                    isDefault: supabaseUserData.tier === 'unknown' || supabaseUserData.monthlyLimit === 0
                  });
                  return false;
                } else {
                  console.log('⚠️ No Supabase usage data available');
                  return false;
                }
              };

              // Try immediately
              if (!extractUsageData()) {
                // If not found, wait a bit and try again (webapp might still be loading)
                console.log('🔍 Usage data not found immediately, retrying in 2 seconds...');
                setTimeout(() => {
                  if (!extractUsageData()) {
                    console.log('🔍 Still no real data, retrying in 3 more seconds...');
                    setTimeout(() => {
                      if (!extractUsageData()) {
                        console.log('⚠️ No real usage data available from webapp after multiple retries');
                      }
                    }, 3000);
                  }
                }, 2000);
              }
            }
          } catch (error) {
            console.error('❌ Error getting usage data:', error);
          }
        } else {
          console.log('⚠️ User is not authenticated, skipping data collection');
        }
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
    if (!isAuthenticated) {
      console.log('⚠️ Cannot collect job data: user not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Collecting job data...');
      const result = await chrome.runtime.sendMessage({ type: 'EXTRACT_JOB_DATA' });
      
      if (result.success && result.data) {
        setJobData(result.data);
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
    if (!isAuthenticated) {
      console.log('⚠️ Cannot send job data: user not authenticated');
      return;
    }

    if (!jobData) {
      console.log('⚠️ No job data to send');
      return;
    }

    if (isLoading) {
      console.log('⚠️ Job submission already in progress');
      return;
    }

    setIsLoading(true);
    
    // 1. Optimistic update - immediately increment counter
    setUsageData(prev => {
      if (prev) {
        console.log('📈 Optimistic update: incrementing usage counter');
        return {
          ...prev,
          currentMonth: (prev.currentMonth || 0) + 1,
          remainingUses: prev.remainingUses ? Math.max(0, prev.remainingUses - 1) : prev.remainingUses
        };
      }
      return prev;
    });

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
        
        // Show success message immediately
        setSuccessMessage('🎉 Job submitted successfully! Form cleared and usage updated.');
        // Clear success message after 8 seconds (longer for popup)
        setTimeout(() => setSuccessMessage(null), 8000);
        console.log('🎉 Job submitted successfully! Form cleared and usage updated.');
        
        // Sync with server after delay to ensure database is updated
        setTimeout(async () => {
          try {
            console.log('🔄 Syncing usage data with server...');
            await refreshUsageData();
            console.log('✅ Usage data synced with server');
          } catch (error) {
            console.error('⚠️ Failed to sync usage data, but job was submitted successfully:', error);
            // Don't rollback - job was successfully submitted, just sync failed
          }
        }, 1000);
      } else {
        console.log('❌ Failed to send job data:', result.error);
        
        // Rollback optimistic update on failure
        setUsageData(prev => {
          if (prev) {
            console.log('🔄 Rolling back optimistic update due to failure');
            return {
              ...prev,
              currentMonth: Math.max(0, (prev.currentMonth || 0) - 1),
              remainingUses: prev.remainingUses ? (prev.remainingUses + 1) : prev.remainingUses
            };
          }
          return prev;
        });
        
        setSuccessMessage(`❌ Failed to submit job: ${result.error}`);
        // Clear error message after 8 seconds (longer for popup)
        setTimeout(() => setSuccessMessage(null), 8000);
      }
    } catch (error) {
      console.error('❌ Error sending job data:', error);
      
      // Rollback optimistic update on error
      setUsageData(prev => {
        if (prev) {
          console.log('🔄 Rolling back optimistic update due to error');
          return {
            ...prev,
            currentMonth: Math.max(0, (prev.currentMonth || 0) - 1),
            remainingUses: prev.remainingUses ? (prev.remainingUses + 1) : prev.remainingUses
          };
        }
        return prev;
      });
      
      setSuccessMessage('❌ Error submitting job. Please try again.');
      setTimeout(() => setSuccessMessage(null), 8000);
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
    setSuccessMessage,
    collectJobData,
    exportJobData,
    sendJobData,
    clearJobData,
    updateJobData,
    refreshUsageData,
  };
};