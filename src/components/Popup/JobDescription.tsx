import React, { useState } from 'react';
import { JobData } from '@/types';
import { supabaseAuth } from '@/services/supabaseAuth';

interface JobDescriptionProps {
  jobData: JobData | null;
  onUpdate: (updatedData: JobData) => void;
}

export const JobDescription: React.FC<JobDescriptionProps> = ({ jobData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(jobData?.description || '');
  };

  const handleSave = () => {
    if (jobData) {
      const updatedData = {
        ...jobData,
        description: editValue
      };
      onUpdate(updatedData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  if ((!jobData?.description || jobData.description.trim() === '') && !isEditing) {
    return (
      <div className="px-4 py-8 text-center text-light-text-secondary dark:text-dark-text-secondary">
        <div className="text-4xl mb-2">📝</div>
        <p>No job description available</p>
        <p className="text-sm mt-1">Collect job data to see the description</p>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="bg-light-card-bg dark:bg-dark-card-bg rounded-lg p-4 border border-light-border dark:border-dark-border">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-light-text dark:text-dark-text">
            Job Description
          </h3>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="p-1 text-rose-gold hover:text-rose-gold/80 dark:text-rose-gold dark:hover:text-rose-gold/80 transition-colors"
                title="Edit Description"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                  title="Save"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  title="Cancel"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full text-sm text-light-text dark:text-dark-text bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded px-3 py-2 min-h-[200px] resize-y"
            placeholder="Enter job description..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleCancel();
              }
            }}
          />
        ) : (
          <div 
            className="text-sm text-light-text dark:text-dark-text leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: jobData?.description || '' }}
          />
        )}
      </div>
    </div>
  );
};
