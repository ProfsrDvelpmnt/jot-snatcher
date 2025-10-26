import React, { useState } from 'react';
import { supabaseAuth } from '../services/supabaseAuth';
import { isAdminUser } from '../utils/adminUtils';

interface AdminLoginFormProps {
  onLoginSuccess?: () => void;
  onBackToRegular?: () => void;
  onResetSignOutFlag?: () => void;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ 
  onLoginSuccess, 
  onBackToRegular,
  onResetSignOutFlag 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First check if this is an admin user
      if (!isAdminUser(email, password)) {
        setError('Invalid admin credentials');
        setLoading(false);
        return;
      }

      // If admin credentials are valid, proceed with Supabase login
      // Send sign in request to background script
      const result = await chrome.runtime.sendMessage({
        type: 'SIGN_IN',
        email,
        password
      });
      
      if (result && result.success) {
        console.log('✅ Admin login successful');
        onResetSignOutFlag?.();
        onLoginSuccess?.();
      } else {
        setError(result?.error || 'Admin login failed');
      }
    } catch (err) {
      console.error('❌ Admin login error:', err);
      setError('Admin login failed');
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'SIGN_OUT'
      });
      if (result && result.success) {
        console.log('✅ Admin sign out successful');
      }
    } catch (error) {
      console.error('❌ Error during sign out:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-gradient-to-br from-purple-50 to-red-50 dark:from-purple-900/20 dark:to-red-900/20 rounded-lg shadow-lg border border-purple-200 dark:border-purple-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">
          🔐 Admin Login
        </h2>
        <button
          onClick={onBackToRegular}
          className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 underline"
        >
          ← Back to Regular Login
        </button>
      </div>
      
      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>⚠️ Admin Access:</strong> This login is restricted to authorized administrators only.
        </div>
      </div>
      
      <form onSubmit={handleAdminLogin} className="space-y-4">
        <div>
          <label htmlFor="admin-email" className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
            Admin Email
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter admin email"
            required
            className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-purple-700/50 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="admin-password" className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
            Admin Password
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            required
            className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-purple-700/50 dark:text-white"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 disabled:from-purple-400 disabled:to-red-400 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 shadow-lg"
        >
          {loading ? 'Signing in as Admin...' : '🔐 Admin Sign In'}
        </button>
        
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
      </form>
      
      <div className="mt-4 text-center">
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
        >
          Admin Sign Out
        </button>
      </div>
    </div>
  );
};
