import React from 'react';

interface SubscriptionCardProps {
  usageData: any;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  usageData
}) => {
  // Extract usage data with fallbacks - using correct property names from useJobData
  const currentUsage = usageData?.currentMonth || usageData?.currentUsage || usageData?.totalJobs || 0;
  const monthlyLimit = usageData?.monthlyLimit || usageData?.dailyLimit || 400;
  const remaining = usageData?.remainingUses || usageData?.remainingJobs || Math.max(0, monthlyLimit - currentUsage);
  const usagePercentage = monthlyLimit > 0 ? (currentUsage / monthlyLimit) * 100 : 0;
  const tier = usageData?.tier ? usageData.tier.charAt(0).toUpperCase() + usageData.tier.slice(1) + ' Plan' : 'Executive Plan';
  const lastUpdated = usageData?.lastUpdated ? new Date(usageData.lastUpdated).toLocaleTimeString() : 'Unknown';
  const activeStatus = usageData?.activeStatus || 'Active';

  // Debug logging to see what data we're getting
  console.log('🔍 SubscriptionCard - usageData:', usageData);
  console.log('🔍 SubscriptionCard - currentUsage:', currentUsage, 'monthlyLimit:', monthlyLimit, 'percentage:', usagePercentage);
  console.log('🔍 SubscriptionCard - tier from usageData:', usageData?.tier, 'final tier:', tier);
  console.log('🔍 SubscriptionCard - usageData keys:', usageData ? Object.keys(usageData) : 'no usageData');
  console.log('🔍 SubscriptionCard - currentMonth:', usageData?.currentMonth, 'currentUsage:', usageData?.currentUsage);

  return (
    <div className="bg-light-bg/50 dark:bg-dark-bg/50 rounded-lg p-6">
      {/* Header with Subscription Plan and Active Pill */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold text-light-text dark:text-dark-text">Subscription Plan</span>
        <div className="flex items-center bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          <span>{activeStatus}</span>
        </div>
      </div>

      {/* Plan Name and Limit */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-green-600">{tier}</span>
          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{monthlyLimit} jobs/month</span>
        </div>
      </div>

      {/* Monthly Usage Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-light-text dark:text-dark-text">Monthly Usage</h3>
          <span className="text-sm text-green-600 font-medium">
            {currentUsage} / {monthlyLimit} used {usagePercentage.toFixed(1)}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-2 mb-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Jobs Remaining and Last Updated */}
      <div className="flex items-center justify-between text-sm mb-6">
        <span className="text-light-text dark:text-dark-text">{remaining} jobs remaining</span>
        <span className="text-light-text-secondary dark:text-dark-text-secondary">Last updated: {lastUpdated}</span>
      </div>

    </div>
  );
};
