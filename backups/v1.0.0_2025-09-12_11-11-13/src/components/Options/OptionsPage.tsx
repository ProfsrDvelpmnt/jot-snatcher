import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { ApiConfig } from './ApiConfig';

export const OptionsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'api' | 'about'>('appearance');

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-light-card-bg dark:bg-dark-card-bg rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-terracotta mb-8">JOT Collector Settings</h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 border-b border-light-border dark:border-dark-border">
            {[
              { id: 'appearance', label: 'Appearance' },
              { id: 'api', label: 'API Configuration' },
              { id: 'about', label: 'About' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-terracotta border-b-2 border-terracotta'
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-terracotta'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'appearance' && (
              <div className="border border-light-border dark:border-dark-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Appearance</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                      Theme
                    </label>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                      Choose your preferred color scheme
                    </p>
                  </div>
                  <select
                    value={theme}
                    onChange={(e) => toggleTheme(e.target.value as 'light' | 'dark')}
                    className="bg-light-card-bg dark:bg-dark-card-bg border border-light-border dark:border-dark-border text-light-text dark:text-dark-text px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="light">Light Theme</option>
                    <option value="dark">Dark Theme</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="border border-light-border dark:border-dark-border rounded-lg p-6">
                <ApiConfig />
              </div>
            )}

            {activeTab === 'about' && (
              <div className="border border-light-border dark:border-dark-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <div className="space-y-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  <p>JOT Collector v1.0.0</p>
                  <p>Modern Chrome extension for job collection with Tailwind CSS and TypeScript</p>
                  <p>Built with React, TypeScript, and Tailwind CSS</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
