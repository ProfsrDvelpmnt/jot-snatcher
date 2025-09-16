import React from 'react';
import { TABS } from '@/utils/constants';

interface TabContainerProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isAdmin: boolean;
}

export const TabContainer: React.FC<TabContainerProps> = ({ 
  activeTab, 
  onTabChange,
  isAdmin
}) => {
  // Filter visible tabs
  const visibleTabs = TABS.filter(tab => !(tab.isAdmin && !isAdmin));
  
  return (
    <div className="flex border-b border-light-border dark:border-dark-border mb-5">
      {visibleTabs.map((tab: any) => {
        // Calculate flex class based on number of visible tabs
        // For regular users (4 tabs): flex-1 (equal width)
        // For admin users (5 tabs): flex-1 (equal width but smaller)
        const flexClass = 'flex-1';
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`${flexClass} flex items-center justify-center px-4 py-3 text-base font-medium transition-all duration-200 border-b-2 ${
              activeTab === tab.id
                ? 'border-terracotta text-terracotta dark:text-terracotta'
                : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:text-terracotta hover:border-terracotta/50'
            }`}
          >
            {tab.icon && (
              <svg 
                className="w-4 h-4 mr-2" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d={tab.icon} />
              </svg>
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
