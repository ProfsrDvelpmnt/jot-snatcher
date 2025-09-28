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
    <div className="bg-terracotta text-white p-5 rounded-b-2xl shadow-lg mb-5">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center flex-shrink-0 min-w-0 flex-1">
          <img 
            src={chrome.runtime.getURL('icons/spjot-48.png')} 
            alt="SavvyPro JOT Icon" 
            className="w-8 h-8 mr-3 flex-shrink-0"
          />
          <div className="flex flex-col items-start min-w-0">
            <span className="text-2xl font-bold text-white leading-tight">
              JOT Snatcher
            </span>
            <span className="text-sm text-white/80 leading-tight">
              Collects Jobs
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0 ml-4 max-w-[60px]">
          <button
            onClick={() => window.close()}
            className="w-[16px] h-[18px] rounded bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xs font-bold transition-all duration-200 hover:scale-110"
            title="Close"
          >
            ×
          </button>
          <select 
            value={theme} 
            onChange={(e) => toggleTheme(e.target.value as 'light' | 'dark')}
            className="bg-muted-purple border border-accent text-white px-1 py-0.5 rounded text-[9px] font-semibold cursor-pointer transition-all hover:bg-accent hover:border-rose-gold min-w-[16px] h-[18px]"
          >
            {THEME_OPTIONS.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-center">
            <UsageDisplay 
              usageData={usageData || undefined} 
              isCompact={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
