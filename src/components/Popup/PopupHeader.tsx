import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { THEME_OPTIONS } from '@/utils/constants';
import { UsageDisplay } from '../Header/UsageDisplay';

interface PopupHeaderProps {
  hideInIframe?: boolean;
  usageData?: {
    currentUsage?: number;
    monthlyLimit?: number;
    remainingUses?: number;
    tier?: string;
  } | null;
}

export const PopupHeader: React.FC<PopupHeaderProps> = ({ hideInIframe = false, usageData }) => {
  // Check if we're in an iframe context
  const isInIframe = window.parent !== window;
  
  // Hide header if we're in iframe and hideInIframe is true
  if (isInIframe && hideInIframe) {
    return null;
  }
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-terracotta text-white p-5 rounded-b-2xl shadow-lg mb-5 flex items-start justify-between">
      <div className="flex items-start flex-shrink-0">
        <img 
          src={chrome.runtime.getURL('icons/spjot-48.png')} 
          alt="SavvyPro JOT Icon" 
          className="w-8 h-8 mr-3 mt-0.5"
        />
        <div className="flex flex-col items-start">
            <span className="text-2xl font-bold text-white leading-tight">
              JOT Snatcher
            </span>
          <span className="text-sm text-white/80 leading-tight">
            Collects Jobs
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => window.close()}
          className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold transition-all duration-200 hover:scale-110"
          title="Close"
        >
          ×
        </button>
        <select 
          value={theme} 
          onChange={(e) => toggleTheme(e.target.value as 'light' | 'dark')}
          className="bg-muted-purple border-2 border-accent text-white px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:bg-accent hover:border-rose-gold hover:-translate-y-0.5 hover:shadow-lg min-w-[100px] shadow-md"
        >
          {THEME_OPTIONS.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Usage Display in Header */}
        <div className="flex items-center justify-center">
          <UsageDisplay 
            usageData={usageData || undefined} 
            isCompact={true}
          />
        </div>
      </div>
    </div>
  );
};
