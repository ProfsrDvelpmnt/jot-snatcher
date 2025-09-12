import React from 'react';

interface LoginPromptProps {
  onLoginClick?: () => void;
}

export const LoginPrompt: React.FC<LoginPromptProps> = ({ onLoginClick }) => {
  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      // Default behavior: open webapp in new tab
      window.open('https://sp-jot-platform.vercel.app/', '_blank');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="mb-8">
        <img 
          src={chrome.runtime.getURL('icons/spjot-48.png')} 
          alt="JOT Snatcher" 
          className="w-16 h-16 mx-auto mb-4"
        />
        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">
          JOT Snatcher
        </h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          Please log in to use the extension
        </p>
      </div>
      
      <div className="space-y-4 w-full max-w-sm">
        <button
          onClick={handleLoginClick}
          className="w-full bg-terracotta hover:bg-terracotta-dark text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open Webapp
        </button>
        
        <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          <p>Extension will activate after login</p>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-light-card-bg dark:bg-dark-card-bg rounded-lg border border-light-border dark:border-dark-border">
        <h3 className="text-sm font-semibold text-light-text dark:text-dark-text mb-2">
          How to use:
        </h3>
        <ol className="text-xs text-light-text-secondary dark:text-dark-text-secondary space-y-1 text-left">
          <li>1. Click "Open Webapp" to go to the login page</li>
          <li>2. Log in with your account</li>
          <li>3. Return to this page - the extension will activate automatically</li>
          <li>4. Start collecting job data from supported sites</li>
        </ol>
      </div>
    </div>
  );
};
