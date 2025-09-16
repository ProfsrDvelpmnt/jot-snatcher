import { TabData } from '@/types';

export const TABS: TabData[] = [
  {
    id: 'details',
    label: 'Job Details',
  },
  {
    id: 'description',
    label: 'Description',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: 'M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C14.8,14.1 12.4,16.5 9.8,16.5V18C12.4,18 14.8,20.4 14.8,23H9.2C9.2,20.4 6.8,18 4.2,18V16.5C1.6,16.5 -0.8,14.1 -0.8,11.5V10C-0.8,8.6 0.6,7 2,7H12M12,9C11.2,9 10.5,9.7 10.5,10.5S11.2,12 12,12C12.8,12 13.5,11.3 13.5,10.5S12.8,9 12,9Z',
    isAdmin: true,
  },
];

export const JOB_FIELDS = [
  // Core job information
  { key: 'organization', label: 'Organization' },
  { key: 'position', label: 'Position' },
  { key: 'link', label: 'Job Link' },
  { key: 'salary', label: 'Salary' },
  { key: 'salaryTypeDisplay', label: 'Salary Type' },
  { key: 'location', label: 'Location' },
  { key: 'type', label: 'Job Type' },
  { key: 'environment', label: 'Environment' },
  { key: 'stage', label: 'Stage' },
  { key: 'job_site', label: 'Job Site' },
  { key: 'date_saved', label: 'Date Saved' },
  
  // Legacy fields for backward compatibility
  { key: 'jobId', label: 'Job ID' },
  { key: 'ageOfPosting', label: 'Age of Posting' },
  { key: 'numApplicants', label: '# of Applicants' },
] as const;

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light Theme' },
  { value: 'dark', label: 'Dark Theme' },
] as const;

export const FLOATING_BUTTON_POSITION = {
  top: 20,
  right: 20,
} as const;

export const POPUP_DIMENSIONS = {
  width: 500,
  height: 600,
} as const;
