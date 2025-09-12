// Site detection and configuration management
export interface SiteConfig {
  name: string;
  domain: string;
  selectors: JobSelectors;
  enabled: boolean;
}

export interface JobSelectors {
  // Container selectors - now support arrays for fallbacks
  jobContainer: string | string[];
  jobList?: string | string[];
  
  // Job data selectors - now support arrays for fallbacks
  title: string | string[];
  company: string | string[];
  location: string | string[];
  salary?: string | string[];
  description: string | string[];
  applyLink?: string | string[];
  postedDate?: string | string[];
  jobType?: string | string[];
  remote?: string | string[];
  
  // Additional fields from enhanced extractors
  postingAge?: string | string[];
  applicants?: string | string[];
  
  // Optional selectors for specific sites
  benefits?: string | string[];
  requirements?: string | string[];
  experience?: string | string[];
  education?: string | string[];
}

// Site-specific configurations
export const SITE_CONFIGS: Record<string, SiteConfig> = {
  'linkedin': {
    name: 'LinkedIn Jobs',
    domain: 'linkedin.com',
    enabled: true,
    selectors: {
      jobContainer: '.jobs-search__results-list li',
      jobList: '.jobs-search__results-list',
      title: '.job-search-card__title a',
      company: '.job-search-card__subtitle-link',
      location: '.job-search-card__location',
      salary: '.job-search-card__salary-info',
      description: '.jobs-description-content__text',
      applyLink: '.job-search-card__title a',
      postedDate: '.job-search-card__listdate',
      jobType: '.job-search-card__metadata-item',
    }
  },
  
  'indeed': {
    name: 'Indeed',
    domain: 'indeed.com',
    enabled: true,
    selectors: {
      // Job containers - works for both listing and detail pages
      jobContainer: [
        '[data-jk]', // Job listing cards
        '.jobsearch-JobInfoHeader-title', // Job detail page
        'body' // Fallback for detail pages
      ],
      jobList: '#mosaic-provider-jobcards',
      
      // Job data selectors - with fallbacks for both page types
      title: [
        '.jobsearch-JobInfoHeader-title', // Detail page
        '[data-testid="job-title"] a', // Listing page (if exists)
        'h1' // Fallback
      ],
      company: [
        '[data-testid="company-name"]', // Listing page
        '[data-testid="inlineHeader-companyName"]', // Detail page
        '.jobsearch-CompanyInfoContainer a' // Alternative
      ],
      location: [
        '[data-testid="job-location"]', // Both pages
        '.jobsearch-JobInfoHeader-subtitle' // Detail page
      ],
      salary: [
        '[data-testid="attribute_snippet_testid"]', // Both pages
        '.jobsearch-JobMetadataHeader-item' // Detail page
      ],
      description: [
        '#jobDescriptionText', // Detail page
        '.jobsearch-JobComponent-description', // Detail page
        '[data-testid="job-description"]' // Listing page (if exists)
      ],
      applyLink: [
        '[data-testid="job-title"] a', // Listing page
        '.jobsearch-ApplyButton' // Detail page
      ],
      postedDate: [
        '[data-testid="myJobsStateDate"]', // Listing page
        '.jobsearch-JobMetadataHeader-item' // Detail page
      ],
      jobType: [
        '[data-testid="attribute_snippet_testid"]', // Both pages
        '.jobsearch-JobMetadataHeader-item' // Detail page
      ],
    }
  },
  
  'glassdoor': {
    name: 'Glassdoor',
    domain: 'glassdoor.com',
    enabled: true,
    selectors: {
      jobContainer: '[data-test="jobListing"]',
      jobList: '[data-test="jobListingContainer"]',
      title: '[data-test="job-title"]',
      company: '[data-test="employer-name"]',
      location: '[data-test="job-location"]',
      salary: '[data-test="job-salary"]',
      description: '[data-test="jobDescriptionText"]',
      applyLink: '[data-test="job-title"] a',
      postedDate: '[data-test="job-age"]',
      jobType: '[data-test="job-type"]',
    }
  },
  
  'ziprecruiter': {
    name: 'ZipRecruiter',
    domain: 'ziprecruiter.com',
    enabled: true,
    selectors: {
      jobContainer: [
        '[data-testid="job-details-scroll-container"]', // Job detail panel
        '.job_content', 
        '.jobDescriptionSection', 
        '[data-test="job-description"]',
        'body' // Fallback for listing page
      ],
      jobList: '#job_list',
      title: [
        'h2[aria-label]', // Job detail panel title
        'h2.font-bold.text-primary', // Job detail panel title
        'h1[data-test="job-title"]',
        '.job_title h1',
        'h1.job-title'
      ],
      company: [
        'a[aria-label]', // Company link in detail panel
        '[data-test="company-name"]',
        '.company_name a',
        '.hiring_company a'
      ],
      location: [
        'p.text-primary.normal-case', // Location in detail panel (includes environment)
        '[data-test="job-location"]',
        '.location',
        '.job_location'
      ],
      salary: [
        'div.flex.flex-col.gap-y-8 p.text-primary.normal-case.text-body-md', // Salary in job details
        '[data-test="compensation-text"]',
        '.salary_snippet_text',
        '.compensation'
      ],
      description: [
        'div.text-primary.whitespace-pre-line', // Job description in detail panel
        '[data-test="job-description"]',
        '.jobDescriptionSection',
        '.job_description'
      ],
      applyLink: [
        '[data-test="job-title"] a',
        '.job_link'
      ],
      postedDate: [
        '[data-test="job-posted"]',
        '.job_age'
      ],
      jobType: [
        '[data-test="job-type"]',
        '.job_type'
      ],
    }
  },
  
  'monster': {
    name: 'Monster',
    domain: 'monster.com',
    enabled: true,
    selectors: {
      jobContainer: '[data-testid="job-card"]',
      jobList: '[data-testid="job-results"]',
      title: '[data-testid="job-title"]',
      company: '[data-testid="company-name"]',
      location: '[data-testid="job-location"]',
      salary: '[data-testid="job-salary"]',
      description: '[data-testid="job-description"]',
      applyLink: '[data-testid="job-title"] a',
      postedDate: '[data-testid="job-posted"]',
      jobType: '[data-testid="job-type"]',
    }
  }
};

export function detectSite(url: string): SiteConfig | null {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    
    for (const [key, config] of Object.entries(SITE_CONFIGS)) {
      if (domain.includes(config.domain) && config.enabled) {
        return config;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error detecting site:', error);
    return null;
  }
}

export function getCurrentSiteConfig(): SiteConfig | null {
  return detectSite(window.location.href);
}
