import React from 'react';

interface AdminPanelProps {
  isAdmin: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isAdmin }) => {
  if (!isAdmin) {
    return (
      <div className="px-4 py-8 text-center text-light-text-secondary dark:text-dark-text-secondary">
        <div className="text-4xl mb-2">🔒</div>
        <p>Admin access required</p>
        <p className="text-sm mt-1">Contact administrator for access</p>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="bg-light-card-bg dark:bg-dark-card-bg rounded-lg p-4 border border-light-border dark:border-dark-border">
        <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
          Admin Panel
        </h3>
        <div className="space-y-4">
          <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta mx-auto mb-4" />
            <p>Loading admin panel...</p>
          </div>
        </div>
      </div>
    </div>
  );
};
