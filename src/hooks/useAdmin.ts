import { useState, useEffect } from 'react';
import { isAdminEmail, debugAdminDetection } from '@/utils/adminUtils';
import { supabaseAuth } from '@/services/supabaseAuth';

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Get current user from Supabase auth
        const authState = supabaseAuth.getAuthState();
        console.log('🔍 Admin check - Auth state:', authState);

        if (authState.isAuthenticated && authState.userEmail) {
          // Run detailed debug analysis
          debugAdminDetection(authState.userEmail);
          
          const adminStatus = isAdminEmail(authState.userEmail);
          console.log('🔍 Admin check - Email:', authState.userEmail, 'Is Admin:', adminStatus);
          console.log('🔍 Admin check - Full auth state:', authState);
          setIsAdmin(adminStatus);
        } else {
          console.log('🔍 Admin check - Not authenticated or no email');
          console.log('🔍 Admin check - Auth state details:', authState);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('❌ Admin check failed:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();

    // Listen for auth state changes
    const handleAuthChange = () => {
      console.log('🔄 Admin check - Auth state changed, rechecking admin status...');
      checkAdminStatus();
    };

    // Add listener for auth state changes
    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  return {
    isAdmin,
    isLoading,
    refreshAdminStatus: () => {
      setIsLoading(true);
      const authState = supabaseAuth.getAuthState();
      if (authState.isAuthenticated && authState.userEmail) {
        setIsAdmin(isAdminEmail(authState.userEmail));
      } else {
        setIsAdmin(false);
      }
      setIsLoading(false);
    }
  };
};
