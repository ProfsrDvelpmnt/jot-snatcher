// Kanban Board Schema Implementation for JOT Snatcher Extension
// This file implements the exact schema the webapp expects for job data submission

export interface KanbanJobData {
  // Required fields (Minimum for Basic Functionality)
  organization: string;           // Required
  position: string;               // Required
  
  // Optional basic fields
  salary?: string | null;         // Optional (free-form text)
  location?: string | null;       // Optional
  type?: string | null;           // Optional (Full Time, Part Time, Contract, etc.)
  environment?: string | null;    // Optional (Remote, Hybrid, On-site)
  
  // Enhanced fields (New Features)
  salary_type?: 'annual' | 'hourly' | 'monthly' | 'contract' | null;  // Optional
  salary_min?: number | null;     // Optional: minimum salary as integer
  salary_max?: number | null;     // Optional: maximum salary as integer
  source?: string | null;         // Optional: "indeed", "linkedin", "glassdoor", etc.
  job_site?: string | null;       // Optional: "Indeed", "LinkedIn", "Glassdoor", etc.
}

export interface KanbanApiResponse {
  success: boolean;
  job?: {
    id: string;
    user_id: string;
    organization: string;
    position: string;
    salary: string | null;
    salary_type: string | null;
    salary_min: number | null;
    salary_max: number | null;
    source: string | null;
    job_site: string | null;
    location: string | null;
    type: string | null;
    environment: string | null;
    stage: string;
    date_saved: string;
    created_at: string;
    updated_at: string;
  };
  message?: string;
  usageInfo?: {
    currentMonth: number;
    monthlyLimit: number;
    remainingUses: number;
  };
  authMethod?: string;
  error?: string;
}

/**
 * Parse salary type from salary text
 * @param salaryText - The salary text to parse
 * @returns The detected salary type
 */
export function parseSalaryType(salaryText: string | null | undefined): 'annual' | 'hourly' | 'monthly' | 'contract' | null {
  if (!salaryText) return null;
  
  const text = salaryText.toLowerCase();
  
  if (text.includes('hour') || text.includes('/hr')) return 'hourly';
  if (text.includes('month') || text.includes('/mo')) return 'monthly';
  if (text.includes('contract') || text.includes('project')) return 'contract';
  
  return 'annual'; // Default
}

/**
 * Parse minimum salary from salary text
 * @param salaryText - The salary text to parse
 * @returns The minimum salary as integer or null
 */
export function parseSalaryMin(salaryText: string | null | undefined): number | null {
  if (!salaryText) return null;
  
  const match = salaryText.match(/\$?([0-9,]+)/);
  return match ? parseInt(match[1].replace(/,/g, '')) : null;
}

/**
 * Parse maximum salary from salary text
 * @param salaryText - The salary text to parse
 * @returns The maximum salary as integer or null
 */
export function parseSalaryMax(salaryText: string | null | undefined): number | null {
  if (!salaryText) return null;
  
  const matches = salaryText.match(/\$?([0-9,]+)/g);
  return matches && matches.length > 1 ? parseInt(matches[1].replace(/,/g, '')) : null;
}

/**
 * Detect job source from URL
 * @param url - The job posting URL
 * @returns The detected job source
 */
export function detectJobSource(url: string | null | undefined): string {
  if (!url) return 'extension';
  
  try {
    const domain = new URL(url).hostname.toLowerCase();
    
    if (domain.includes('indeed')) return 'indeed';
    if (domain.includes('linkedin')) return 'linkedin';
    if (domain.includes('glassdoor')) return 'glassdoor';
    if (domain.includes('ziprecruiter')) return 'ziprecruiter';
    if (domain.includes('monster')) return 'monster';
    if (domain.includes('careerbuilder')) return 'careerbuilder';
    if (domain.includes('dice')) return 'dice';
    if (domain.includes('angel.co') || domain.includes('angelist')) return 'angel_list';
    if (domain.includes('remoteok.io')) return 'remote_ok';
    if (domain.includes('weworkremotely')) return 'weworkremotely';
    if (domain.includes('stackoverflow.com') && url.includes('jobs')) return 'stackoverflow';
    if (domain.includes('github.com') && url.includes('jobs')) return 'github';
    
    return 'company_website';
  } catch (error) {
    console.error('Error detecting job source:', error);
    return 'extension';
  }
}

/**
 * Get job site display name from source
 * @param source - The job source
 * @returns The display name for the job site
 */
export function getJobSiteName(source: string): string {
  const siteMap: Record<string, string> = {
    'indeed': 'Indeed',
    'linkedin': 'LinkedIn',
    'glassdoor': 'Glassdoor',
    'ziprecruiter': 'ZipRecruiter',
    'monster': 'Monster',
    'careerbuilder': 'CareerBuilder',
    'dice': 'Dice',
    'angel_list': 'AngelList',
    'remote_ok': 'Remote OK',
    'weworkremotely': 'We Work Remotely',
    'stackoverflow': 'Stack Overflow',
    'github': 'GitHub',
    'company_website': 'Company Website',
    'extension': 'Extension',
    'other': 'Other'
  };
  
  return siteMap[source] || 'Other';
}

/**
 * Convert extension JobData to KanbanJobData format
 * @param jobData - The job data from the extension
 * @returns The job data formatted for the kanban board API
 */
export function convertToKanbanFormat(jobData: any): KanbanJobData {
  return {
    // Required fields
    organization: jobData.organization || jobData.companyName || 'Unknown Company',
    position: jobData.position || jobData.jobTitle || 'Unknown Position',
    
    // Optional basic fields
    salary: jobData.salary || null,
    location: jobData.location || null,
    type: jobData.type || 'Full Time',
    environment: jobData.environment || 'Remote',
    
    // Enhanced fields
    salary_type: parseSalaryType(jobData.salary),
    salary_min: parseSalaryMin(jobData.salary),
    salary_max: parseSalaryMax(jobData.salary),
    source: detectJobSource(jobData.link || jobData.jobLink),
    job_site: getJobSiteName(detectJobSource(jobData.link || jobData.jobLink))
  };
}

/**
 * Submit job data to the kanban board API
 * @param jobData - The job data to submit
 * @param apiBaseUrl - The base URL for the API (default: http://localhost:8080/api)
 * @param userId - The user ID for authentication
 * @returns Promise with the API response
 */
export async function submitJobToKanban(
  jobData: KanbanJobData, 
  apiBaseUrl: string = 'http://localhost:8080/api',
  userId: string
): Promise<KanbanApiResponse> {
  try {
    const response = await fetch(`${apiBaseUrl}/ext-jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(jobData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Job submitted successfully:', result.job);
      if (result.usageInfo) {
        console.log('📊 Usage:', `${result.usageInfo.currentMonth}/${result.usageInfo.monthlyLimit}`);
      }
    } else {
      console.error('❌ Job submission failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Network error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Complete job submission workflow
 * This function handles the entire process from extension job data to kanban submission
 * @param extensionJobData - The job data extracted by the extension
 * @param apiBaseUrl - The base URL for the API
 * @param userId - The user ID for authentication
 * @returns Promise with the API response
 */
export async function submitExtensionJobToKanban(
  extensionJobData: any,
  apiBaseUrl: string = 'http://localhost:8080/api',
  userId: string
): Promise<KanbanApiResponse> {
  try {
    // Convert extension format to kanban format
    const kanbanJobData = convertToKanbanFormat(extensionJobData);
    
    // Submit to kanban board
    const result = await submitJobToKanban(kanbanJobData, apiBaseUrl, userId);
    
    return result;
  } catch (error) {
    console.error('❌ Job submission workflow failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate kanban job data before submission
 * @param jobData - The job data to validate
 * @returns Object with validation result and errors
 */
export function validateKanbanJobData(jobData: KanbanJobData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!jobData.organization || jobData.organization.trim() === '') {
    errors.push('Organization is required');
  }
  
  if (!jobData.position || jobData.position.trim() === '') {
    errors.push('Position is required');
  }
  
  // Validate salary fields if provided
  if (jobData.salary_min !== null && jobData.salary_max !== null && 
      jobData.salary_min !== undefined && jobData.salary_max !== undefined) {
    if (jobData.salary_min > jobData.salary_max) {
      errors.push('Minimum salary cannot be greater than maximum salary');
    }
  }
  
  // Validate salary type if provided
  if (jobData.salary_type && !['annual', 'hourly', 'monthly', 'contract'].includes(jobData.salary_type)) {
    errors.push('Invalid salary type');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get default kanban job data template
 * @returns A template with default values
 */
export function getDefaultKanbanJobData(): KanbanJobData {
  return {
    organization: '',
    position: '',
    salary: null,
    location: null,
    type: 'Full Time',
    environment: 'Remote',
    salary_type: null,
    salary_min: null,
    salary_max: null,
    source: null,
    job_site: null
  };
}
