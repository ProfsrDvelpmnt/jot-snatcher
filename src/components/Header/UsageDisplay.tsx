import React from 'react';

interface UsageDisplayProps {
  usageData?: {
    currentUsage?: number;
    monthlyLimit?: number;
    remainingUses?: number;
    tier?: string;
  };
  isCompact?: boolean;
  showDetails?: boolean;
}

export const UsageDisplay: React.FC<UsageDisplayProps> = ({
  usageData,
  isCompact = false,
  showDetails = false
}) => {
  // Handle loading/undefined states
  if (!usageData) {
    return (
      <div className="flex items-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
        <span className="text-xs">📊</span>
        {!isCompact && <span className="ml-1">Loading...</span>}
      </div>
    );
  }

  const { currentUsage = 0, monthlyLimit = 0, remainingUses = 0, tier } = usageData;
  const usagePercentage = monthlyLimit > 0 ? (currentUsage / monthlyLimit) * 100 : 0;

  // Determine color based on usage - adjusted for header backgrounds
  const getUsageColor = () => {
    if (usagePercentage >= 90) return 'text-red-200 dark:text-red-400';
    if (usagePercentage >= 75) return 'text-yellow-200 dark:text-yellow-400';
    return 'text-green-200 dark:text-green-400';
  };

  const getUsageIcon = () => {
    if (usagePercentage >= 90) return '🔴';
    if (usagePercentage >= 75) return '🟡';
    return '🟢';
  };

  if (isCompact) {
    return (
      <div 
        className={`flex items-center text-xs text-white bg-black/20 px-2 py-1 rounded transition-all duration-200 cursor-help border border-white/30`} 
        title={`Usage: ${currentUsage}/${monthlyLimit} (${remainingUses} remaining)${tier ? ` | Plan: ${tier}` : ''}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}
      >
        <span className="mr-1 text-xs">{getUsageIcon()}</span>
        <span className="font-medium">{currentUsage}/{monthlyLimit}</span>
        {remainingUses <= 10 && (
          <span className="ml-1 text-xs text-red-200" title="Low usage remaining">
            ⚠️
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center text-sm">
        <span className="mr-1">{getUsageIcon()}</span>
        <span className={`font-medium ${getUsageColor()}`}>
          {currentUsage}/{monthlyLimit}
        </span>
        {showDetails && (
          <span className="ml-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
            ({remainingUses} remaining)
          </span>
        )}
      </div>
      {tier && showDetails && (
        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
          {tier}
        </div>
      )}
    </div>
  );
};
