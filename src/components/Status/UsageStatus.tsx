import React from 'react';

interface UsageStatusProps {
  usageData?: {
    currentUsage?: number;
    monthlyLimit?: number;
    remainingUses?: number;
    tier?: string;
  } | null;
  onRefresh?: () => void;
}

export const UsageStatus: React.FC<UsageStatusProps> = ({ usageData, onRefresh }) => {
  // Handle loading/undefined states
  if (!usageData) {
    return (
      <div className="flex items-center px-3 py-2 rounded-lg border bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium">
        <span className="mr-2 text-xs">📊</span>
        <span>Loading...</span>
      </div>
    );
  }

  const { currentUsage = 0, monthlyLimit = 0, remainingUses = 0, tier } = usageData;
  const usagePercentage = monthlyLimit > 0 ? (currentUsage / monthlyLimit) * 100 : 0;

  // Determine color based on usage
  const getUsageColor = () => {
    if (usagePercentage >= 90) return {
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      textColor: 'text-red-800 dark:text-red-200',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: '🔴'
    };
    if (usagePercentage >= 75) return {
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      icon: '🟡'
    };
    return {
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      textColor: 'text-green-800 dark:text-green-200',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: '🟢'
    };
  };

  const colorInfo = getUsageColor();
  const warningIcon = remainingUses <= 10 ? ' ⚠️' : '';

  return (
    <div 
      className={`flex items-center justify-center px-3 py-2 rounded-lg border text-sm font-medium text-center flex-1 min-w-0 relative ${colorInfo.bgColor} ${colorInfo.textColor} ${colorInfo.borderColor}`}
      title={`Usage: ${currentUsage}/${monthlyLimit} (${remainingUses} remaining)${tier ? ` | Plan: ${tier}` : ''}`}
    >
      <span className="flex items-center justify-center gap-0.75">
        <span className="text-xs flex-shrink-0">{colorInfo.icon}</span>
        <span className="text-center">USAGE: {currentUsage}/{monthlyLimit}{warningIcon}</span>
        <span className="w-3 flex-shrink-0"></span>
      </span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="absolute right-1 top-1 w-5 h-5 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center transition-colors duration-200"
          title="Refresh Usage"
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
    </div>
  );
};
