import React from 'react';

interface StatusBarProps {
  isConnected: boolean;
  statusText: string;
  isSupabaseConnected?: boolean;
  supabaseStatusText?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  isConnected, 
  statusText, 
  isSupabaseConnected = false, 
  supabaseStatusText = "Supabase Disconnected" 
}) => {
  return (
    <div className="space-y-2 mb-4">
      {/* SP-JOT Connection Status */}
      <div className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
        isConnected 
          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
          : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      }`}>
        <div className={`w-2 h-2 rounded-full mr-3 ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="text-base font-medium">{statusText}</span>
      </div>
      
      {/* Supabase Connection Status */}
      <div className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
        isSupabaseConnected 
          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
          : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      }`}>
        <div className={`w-2 h-2 rounded-full mr-3 ${
          isSupabaseConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="text-base font-medium">{supabaseStatusText}</span>
      </div>
    </div>
  );
};
