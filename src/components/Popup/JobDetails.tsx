import React, { useState } from 'react';
import { JobData } from '@/types';
import { JOB_FIELDS } from '@/utils/constants';

interface JobDetailsProps {
  jobData: JobData | null;
  onCollect: () => void;
  onExport: () => void;
  onSend: () => void;
  onClear: () => void;
  onUpdate: (updatedData: JobData) => void;
  isLoading: boolean;
  successMessage?: string | null;
  setSuccessMessage?: (message: string | null) => void;
}

export const JobDetails: React.FC<JobDetailsProps> = ({
  jobData,
  onCollect,
  onExport,
  onSend,
  onClear,
  onUpdate,
  isLoading,
  successMessage,
  setSuccessMessage,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleEdit = (fieldKey: string, currentValue: string) => {
    setEditingField(fieldKey);
    setEditValue(currentValue || '');
  };

  const handleSave = (fieldKey: string) => {
    if (jobData) {
      const updatedData = {
        ...jobData,
        [fieldKey]: editValue
      };
      onUpdate(updatedData);
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };
  return (
    <div className="px-4">
      {/* Success/Error Message Popup Overlay */}
      {successMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-8 mx-4 max-w-md w-full text-center shadow-2xl ${
            successMessage.includes('✅') || successMessage.includes('🎉')
              ? 'border-2 border-green-500'
              : 'border-2 border-red-500'
          }`}>
            <div className={`text-6xl mb-4 ${
              successMessage.includes('✅') || successMessage.includes('🎉')
                ? 'text-green-500'
                : 'text-red-500'
            }`}>
              {successMessage.includes('✅') || successMessage.includes('🎉') ? '🎉' : '❌'}
            </div>
            <h3 className={`text-xl font-bold mb-2 ${
              successMessage.includes('✅') || successMessage.includes('🎉')
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              {successMessage.includes('✅') || successMessage.includes('🎉') ? 'Success!' : 'Error!'}
            </h3>
            <p className={`text-sm ${
              successMessage.includes('✅') || successMessage.includes('🎉')
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {successMessage}
            </p>
            <button
              onClick={() => setSuccessMessage?.(null)}
              className={`mt-6 px-6 py-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg ${
                successMessage.includes('✅') || successMessage.includes('🎉')
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      )}
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={onCollect}
          disabled={isLoading}
          className="flex-1 bg-muted-purple dark:bg-rose-gold hover:bg-rose-gold dark:hover:bg-rose-gold/90 disabled:bg-muted-purple/50 dark:disabled:bg-rose-gold/50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2" />
              <span className="text-base">Collecting...</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-base">Collect</span>
            </>
          )}
        </button>
        <button
          onClick={onClear}
          disabled={!jobData || isLoading}
          className="flex-1 bg-muted-purple dark:bg-rose-gold hover:bg-rose-gold dark:hover:bg-rose-gold/90 disabled:bg-muted-purple/50 dark:disabled:bg-rose-gold/50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center"
        >
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-base">Clear</span>
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={onExport}
          disabled={!jobData}
          className="flex-1 bg-muted-purple dark:bg-rose-gold hover:bg-rose-gold dark:hover:bg-rose-gold/90 disabled:bg-muted-purple/50 dark:disabled:bg-rose-gold/50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center"
        >
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-base">Print</span>
        </button>
        <button
          onClick={onSend}
          disabled={!jobData}
          className="flex-1 bg-muted-purple dark:bg-rose-gold hover:bg-rose-gold dark:hover:bg-rose-gold/90 disabled:bg-muted-purple/50 dark:disabled:bg-rose-gold/50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center"
        >
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
          <span className="text-base">Send</span>
        </button>
      </div>

      {jobData && (
        <div className="space-y-3">
          {JOB_FIELDS.map((field: any) => {
            const value = jobData[field.key as keyof JobData] || 'N/A';
            const isEditing = editingField === field.key;
            
            return (
              <div key={field.key} className="flex justify-between items-start py-2 border-b border-light-border dark:border-dark-border last:border-b-0">
                <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary flex-shrink-0 mr-4">
                  {field.label}:
                </span>
                
                <div className="flex items-center gap-2 flex-1 justify-end">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-sm text-light-text dark:text-dark-text bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded px-2 py-1 flex-1 min-w-0"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSave(field.key);
                          } else if (e.key === 'Escape') {
                            handleCancel();
                          }
                        }}
                      />
                      <button
                        onClick={() => handleSave(field.key)}
                        className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                        title="Save"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Cancel"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-light-text dark:text-dark-text text-right break-all flex-1">
                        {value}
                      </span>
                      <button
                        onClick={() => handleEdit(field.key, String(value))}
                        className="p-1 text-rose-gold hover:text-rose-gold/80 dark:text-rose-gold dark:hover:text-rose-gold/80 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!jobData && !isLoading && (
        <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
          <div className="text-4xl mb-2">📄</div>
          <p>No job data collected yet</p>
          <p className="text-sm mt-1">Click "Collect Job Information" to get started</p>
        </div>
      )}
    </div>
  );
};
