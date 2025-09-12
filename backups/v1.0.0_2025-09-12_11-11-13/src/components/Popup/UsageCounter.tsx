import React, { useState } from 'react';
import { UsageData } from '@/types';

interface UsageCounterProps {
  usageData: UsageData | null;
  onRefresh?: () => void;
}

export const UsageCounter: React.FC<UsageCounterProps> = ({ usageData, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!usageData) {
    return (
      <div className="px-4 py-2 text-base text-light-text-secondary dark:text-dark-text-secondary">
        Loading usage info...
      </div>
    );
  }

  // Handle both new and legacy usage data schemas - NO HARDCODED VALUES
  const currentMonth = usageData.currentMonth ?? usageData.totalJobs ?? 0;
  const monthlyLimit = usageData.monthlyLimit ?? usageData.dailyLimit ?? 0;
  const remainingUses = usageData.remainingUses ?? usageData.remainingJobs ?? 0;
  const tier = usageData.tier ?? 'unknown';
  
  // Calculate usage statistics
  const usedJobs = monthlyLimit - remainingUses;
  const percentage = monthlyLimit > 0 ? (remainingUses / monthlyLimit) * 100 : 0;
  const usagePercentage = monthlyLimit > 0 ? (usedJobs / monthlyLimit) * 100 : 0;

  // Determine subscription status
  const isActive = tier !== 'unknown' && monthlyLimit > 0;
  const isNearLimit = percentage <= 25 && percentage > 0;
  const isAtLimit = remainingUses === 0 && monthlyLimit > 0;
  const isOverLimit = remainingUses < 0;

  // Get tier display info - use actual data from Supabase instead of hardcoded values
  const getTierInfo = (tier: string) => {
    // Use the actual monthly limit from the usage data instead of hardcoded values
    const actualLimit = monthlyLimit;
    
    // Only hardcode display names and colors, not limits
    switch (tier.toLowerCase()) {
      case 'free':
        return { name: 'Free', limit: actualLimit, color: 'text-gray-600', bgColor: 'bg-gray-100' };
      case 'basic':
        return { name: 'Basic', limit: actualLimit, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'professional':
        return { name: 'Professional', limit: actualLimit, color: 'text-purple-600', bgColor: 'bg-purple-100' };
      case 'executive':
        return { name: 'Executive', limit: actualLimit, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'premium':
        return { name: 'Premium', limit: actualLimit, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      case 'enterprise':
        return { name: 'Enterprise', limit: actualLimit, color: 'text-red-600', bgColor: 'bg-red-100' };
      default:
        return { name: 'Unknown', limit: actualLimit, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  const tierInfo = getTierInfo(tier);

  // Handle refresh
  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 1000);
      }
    }
  };

  // If we don't have real data, show a message
  if (monthlyLimit === 0) {
    return (
      <div className="px-4 py-3 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Loading real usage data from database...
          </div>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? '⏳' : '🔄'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-blue-200 dark:border-gray-600">
      {/* Header with subscription status and refresh */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-light-text dark:text-dark-text">
            Subscription Status
          </h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${tierInfo.bgColor} ${tierInfo.color}`}>
            {isActive ? '🟢 Active' : '🔴 Inactive'}
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Refresh usage data"
          >
            {isRefreshing ? '⏳' : '🔄'}
          </button>
        )}
      </div>

      {/* Plan Information */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-lg font-bold ${tierInfo.color}`}>
            {tierInfo.name} Plan
          </span>
          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            {monthlyLimit} jobs/month
          </span>
        </div>
      </div>

      {/* Usage Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-light-text dark:text-dark-text">
            Monthly Usage
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {usedJobs} / {monthlyLimit} used
            </span>
            <span className={`text-xs px-2 py-1 rounded ${
              isOverLimit ? 'bg-red-100 text-red-800' :
              isAtLimit ? 'bg-orange-100 text-orange-800' :
              isNearLimit ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {usagePercentage.toFixed(1)}%
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              isOverLimit ? 'bg-red-500' :
              isAtLimit ? 'bg-orange-500' :
              isNearLimit ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        
        {/* Usage Status */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
            {isOverLimit ? (
              <span className="text-red-600 font-medium">⚠️ Over limit by {Math.abs(remainingUses)} jobs</span>
            ) : isAtLimit ? (
              <span className="text-orange-600 font-medium">⚠️ At monthly limit</span>
            ) : isNearLimit ? (
              <span className="text-yellow-600 font-medium">⚠️ Near limit ({remainingUses} remaining)</span>
            ) : (
              <span className="text-green-600">✅ {remainingUses} jobs remaining</span>
            )}
          </div>
          <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
            Last updated: {usageData.lastUpdated ? new Date(usageData.lastUpdated).toLocaleTimeString() : 'Unknown'}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-600">
        <div className="text-center">
          <div className="text-lg font-bold text-light-text dark:text-dark-text">
            {currentMonth}
          </div>
          <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
            Jobs This Month
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-light-text dark:text-dark-text">
            {remainingUses}
          </div>
          <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
            Remaining
          </div>
        </div>
      </div>

      {/* Upgrade prompt for near/at limit */}
      {(isNearLimit || isAtLimit || isOverLimit) && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <div className="text-xs text-yellow-800 dark:text-yellow-200">
            💡 <strong>Need more jobs?</strong> Consider upgrading your plan for additional monthly capacity.
          </div>
        </div>
      )}
    </div>
  );
};
