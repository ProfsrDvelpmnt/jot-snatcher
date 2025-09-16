import React from 'react';

interface ConnectionStatusProps {
  type: 'sp-jot' | 'supabase';
  connected: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ type, connected }) => {
  const getStatusInfo = () => {
    if (type === 'sp-jot') {
      return {
        label: 'JOT-HUB',
        connectedText: 'Connected',
        disconnectedText: 'Not Connected',
        icon: connected ? '🟢' : '🔴',
        bgColor: connected ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20',
        textColor: connected ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200',
        borderColor: connected ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
      };
    } else {
      return {
        label: 'LICENSE',
        connectedText: 'Verified',
        disconnectedText: 'Not Verified',
        icon: connected ? '🟢' : '🔴',
        bgColor: connected ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20',
        textColor: connected ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200',
        borderColor: connected ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const statusText = connected ? statusInfo.connectedText : statusInfo.disconnectedText;

  return (
    <div 
      className={`flex items-center justify-center px-2 py-1.5 rounded-lg border text-xs font-medium text-center flex-1 min-w-0 ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}
      title={`${statusInfo.label}: ${statusText}`}
    >
      <div className="flex flex-col items-center justify-center gap-0.5">
        <div className="flex items-center justify-center gap-1">
          <span className="text-xs flex-shrink-0">{statusInfo.icon}</span>
          <span className="text-center">{statusInfo.label}:</span>
        </div>
        <span className="text-center text-xs">{statusText}</span>
      </div>
    </div>
  );
};
