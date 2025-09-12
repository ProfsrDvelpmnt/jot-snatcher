import React, { useState } from 'react';
import { FloatingButtonState } from '@/types';
import { FLOATING_BUTTON_POSITION } from '@/utils/constants';

interface FloatingButtonProps {
  children: React.ReactNode;
  onToggle: (expanded: boolean) => void;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({ children, onToggle }) => {
  const [state, setState] = useState<FloatingButtonState>({
    isExpanded: false,
    isVisible: true,
    position: FLOATING_BUTTON_POSITION,
  });

  const toggleExpanded = () => {
    const newExpanded = !state.isExpanded;
    setState((prev: FloatingButtonState) => ({ ...prev, isExpanded: newExpanded }));
    onToggle(newExpanded);
  };

  const handleMouseEnter = () => {
    if (!state.isExpanded) {
      setState((prev: FloatingButtonState) => ({ ...prev, isVisible: true }));
    }
  };

  const handleMouseLeave = () => {
    if (!state.isExpanded) {
      setState((prev: FloatingButtonState) => ({ ...prev, isVisible: false }));
    }
  };

  return (
    <div
      className={`fixed z-[10000] transition-all duration-300 ease-out ${
        state.isExpanded 
          ? 'w-[400px] h-[600px] max-h-[80vh]' 
          : 'w-[60px] h-[60px]'
      }`}
      style={{
        top: state.position.top,
        right: state.position.right,
      }}
    >
      {/* Floating Button (Collapsed State) */}
      <button
        onClick={toggleExpanded}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`w-[60px] h-[60px] rounded-full bg-terracotta/90 backdrop-blur-fab border-[3px] border-light-peach/80 cursor-pointer flex items-center justify-center shadow-fab transition-all duration-300 ease-out hover:scale-110 hover:bg-terracotta/95 hover:backdrop-blur-fab-hover hover:shadow-fab-hover hover:border-rose-gold/90 active:scale-95 relative overflow-hidden ${
          state.isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <img 
          src={chrome.runtime.getURL('icons/spjot-48.png')} 
          alt="Job Collector" 
          className="w-8 h-8 transition-transform duration-300 hover:rotate-[5deg]"
        />
        
        {/* Expand/Collapse Indicator */}
        <div className={`absolute -bottom-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white transition-all duration-300 ${
          state.isExpanded 
            ? 'bg-light-peach rotate-180' 
            : 'bg-muted-purple'
        }`}>
          +
        </div>
      </button>

      {/* Expanded Content */}
      <div className={`transition-all duration-300 ease-out ${
        state.isExpanded 
          ? 'opacity-100 pointer-events-auto' 
          : 'opacity-0 pointer-events-none'
      }`}>
        {children}
      </div>
    </div>
  );
};
