import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { ApiConfig } from './ApiConfig';

export const OptionsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'api' | 'about' | 'help'>('appearance');

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
              { id: 'about', label: 'About' },
              { id: 'help', label: 'Help' }
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
                  <p>JOT Snatcher v1.2.0</p>
                  <p>Modern Chrome extension for job collection with Supabase integration</p>
                  <p>Built with React, TypeScript, and Tailwind CSS</p>
                </div>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="border border-light-border dark:border-dark-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Help & Documentation</h2>
                <div className="space-y-4">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Get help with using JOT Snatcher, troubleshooting issues, and learning about all available features.
                  </p>
                  <div className="grid gap-4">
                    <a 
                      href={chrome.runtime.getURL('help.html')}
                      target="_blank"
                      className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-xl">
                        📚
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold text-light-text dark:text-dark-text">Complete Help Guide</h3>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          Comprehensive documentation with step-by-step instructions
                        </p>
                      </div>
                      <div className="ml-auto">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </a>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <a 
                        href="mailto:support@sp-jot.com"
                        className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm">
                          📧
                        </div>
                        <div className="ml-3">
                          <h4 className="font-medium text-sm text-light-text dark:text-dark-text">Email Support</h4>
                          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Get personalized help</p>
                        </div>
                      </a>
                      
                      <a 
                        href="https://app.sp-jot.com/docs"
                        target="_blank"
                        className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">
                          📖
                        </div>
                        <div className="ml-3">
                          <h4 className="font-medium text-sm text-light-text dark:text-dark-text">API Documentation</h4>
                          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Technical reference</p>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
