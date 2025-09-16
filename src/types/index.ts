export type Theme = 'light' | 'dark';

export interface JobData {
  // Core job information
  organization: string;
  position: string;
  link: string;
  salary: string;
  salary_type: 'annual' | 'hourly' | 'monthly' | 'contract';
  salaryTypeDisplay?: string; // Capitalized version for display
  salary_min: number | null;
  salary_max: number | null;
  location: string;
  type: string; // 'Full Time', 'Part Time', 'Contract', 'Seasonal'
  environment: string; // 'Remote', 'Hybrid', 'In-Person'
  stage: string; // 'Saved', 'Applying', 'Applied', 'Contacted', 'Interviewing', 'Offer'
  source: string; // 'indeed', 'linkedin', 'glassdoor', etc.
  job_site: string; // 'Indeed', 'LinkedIn', 'Glassdoor', etc.
  
  // Dates
  date_saved: string;
  date_posted: string | null;
  
  // Optional fields
  job_posting_url?: string | null;
  resume_url?: string | null;
  contact_message_url?: string | null;
  interview_status?: string | null;
  date_applying?: string | null;
  date_applied?: string | null;
  date_contacted?: string | null;
  date_interviewing?: string | null;
  date_offer?: string | null;
  date_negotiating?: string | null;
  date_hired?: string | null;
  date_archived?: string | null;
  
  
  // Legacy fields for backward compatibility
  jobId?: string;
  companyName?: string;
  jobLink?: string;
  jobTitle?: string;
  workType?: string;
  ageOfPosting?: string;
  numApplicants?: string;
  description?: string;
}

export interface UsageData {
  currentMonth: number;
  monthlyLimit: number;
  remainingUses: number;
  userId?: string;
  tier?: string;
  lastUpdated?: string;
  
  // Legacy fields for backward compatibility
  totalJobs?: number;
  dailyLimit?: number;
  remainingJobs?: number;
}

export interface TabData {
  id: string;
  label: string;
  icon?: string;
  isAdmin?: boolean;
}

export interface FloatingButtonState {
  isExpanded: boolean;
  isVisible: boolean;
  position: {
    top: number;
    right: number;
  };
}

export interface PopupState {
  activeTab: string;
  jobData: JobData | null;
  usageData: UsageData | null;
  isConnected: boolean;
  theme: Theme;
}

export interface ChromeMessage {
  type: string;
  data?: any;
  error?: string;
}

export interface ExtensionConfig {
  theme: Theme;
  autoCollect: boolean;
  notifications: boolean;
  adminMode: boolean;
}
