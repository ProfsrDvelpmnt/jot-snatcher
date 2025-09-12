// Job site detection utility
export interface JobSiteInfo {
  source: string;
  job_site: string;
}

export function detectJobSite(url: string): JobSiteInfo {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    
    // Indeed
    if (domain.includes('indeed')) {
      return { source: 'indeed', job_site: 'Indeed' };
    }
    
    // LinkedIn
    if (domain.includes('linkedin')) {
      return { source: 'linkedin', job_site: 'LinkedIn' };
    }
    
    // Glassdoor
    if (domain.includes('glassdoor')) {
      return { source: 'glassdoor', job_site: 'Glassdoor' };
    }
    
    // ZipRecruiter
    if (domain.includes('ziprecruiter')) {
      return { source: 'ziprecruiter', job_site: 'ZipRecruiter' };
    }
    
    // Monster
    if (domain.includes('monster')) {
      return { source: 'monster', job_site: 'Monster' };
    }
    
    // CareerBuilder
    if (domain.includes('careerbuilder')) {
      return { source: 'careerbuilder', job_site: 'CareerBuilder' };
    }
    
    // Dice
    if (domain.includes('dice')) {
      return { source: 'dice', job_site: 'Dice' };
    }
    
    // AngelList
    if (domain.includes('angel.co') || domain.includes('angelist')) {
      return { source: 'angel_list', job_site: 'AngelList' };
    }
    
    // Remote OK
    if (domain.includes('remoteok.io')) {
      return { source: 'remote_ok', job_site: 'Remote OK' };
    }
    
    // We Work Remotely
    if (domain.includes('weworkremotely')) {
      return { source: 'weworkremotely', job_site: 'We Work Remotely' };
    }
    
    // Stack Overflow Jobs
    if (domain.includes('stackoverflow.com') && url.includes('jobs')) {
      return { source: 'stackoverflow', job_site: 'Stack Overflow' };
    }
    
    // GitHub Jobs
    if (domain.includes('github.com') && url.includes('jobs')) {
      return { source: 'github', job_site: 'GitHub' };
    }
    
    // Company website (if it's not a known job board)
    if (domain && !domain.includes('indeed') && !domain.includes('linkedin') && 
        !domain.includes('glassdoor') && !domain.includes('ziprecruiter') &&
        !domain.includes('monster') && !domain.includes('careerbuilder') &&
        !domain.includes('dice') && !domain.includes('angel') &&
        !domain.includes('remoteok') && !domain.includes('weworkremotely') &&
        !domain.includes('stackoverflow') && !domain.includes('github')) {
      return { source: 'company_website', job_site: 'Company Website' };
    }
    
    // Default fallback
    return { source: 'other', job_site: 'Other' };
  } catch (error) {
    console.error('Error detecting job site:', error);
    return { source: 'other', job_site: 'Other' };
  }
}

// Helper function to get job site display name
export function getJobSiteDisplayName(source: string): string {
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
    'other': 'Other'
  };
  
  return siteMap[source] || 'Other';
}

// Helper function to check if URL is a job posting
export function isJobPostingUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();
    const search = urlObj.search.toLowerCase();
    
    // Common job posting URL patterns
    const jobPatterns = [
      '/jobs/',
      '/job/',
      '/careers/',
      '/career/',
      '/employment/',
      '/opportunities/',
      '/positions/',
      '/openings/',
      '/viewjob',
      '/jobsearch',
      '/job-detail',
      '/job-details',
      '/jobposting',
      '/job-posting',
      '/apply',
      '/application'
    ];
    
    // Check if URL contains job-related patterns
    return jobPatterns.some(pattern => 
      path.includes(pattern) || search.includes(pattern)
    );
  } catch (error) {
    console.error('Error checking job posting URL:', error);
    return false;
  }
}
