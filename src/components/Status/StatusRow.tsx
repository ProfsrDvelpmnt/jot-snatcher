import React from 'react';

interface StatusRowProps {
  children: React.ReactNode;
}

export const StatusRow: React.FC<StatusRowProps> = ({ children }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-light-bg dark:bg-dark-bg border-b border-light-border dark:border-dark-border">
      {children}
    </div>
  );
};
