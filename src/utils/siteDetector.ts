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
  jobLink?: string | string[];
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
  
  // Enhanced Monster.com selectors
  companyUrl?: string | string[];
  tags?: string | string[];
  jobId?: string | string[];
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
      remote: [
        '[data-testid="job-location"]', // Location might indicate remote
        '.jobsearch-JobInfoHeader-subtitle' // Detail page location
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
      jobContainer: '[data-testid="job-card"], .JobView, .job-view-container',
      jobList: '[data-testid="job-results"]',
      title: '[data-testid="jobTitle"], .JobViewTitle h1, [data-test-id="svx-jobdetails-job-title"]',
      company: '[data-testid="company"], .JobViewTitle .company, [data-test-id="svx-jobdetails-company"]',
      location: '[data-testid="jobDetailLocation"], .JobViewTitle .location, [data-test-id="svx-jobdetails-location"]',
      salary: '[data-testid="job-salary"], .salary-info, [data-test-id="svx-jobdetails-salary"]',
      description: '[data-testid="job-description"], .description-styles__DescriptionContainerInner-sc-6e39f119-2, .job-description',
      applyLink: '[data-testid="apply-button"], [data-testid="job-title"] a, .apply-button',
      postedDate: '[data-testid="jobDetailDateRecency"], [data-testid="job-posted"], .job-posted-date',
      jobType: '[data-testid="job-type"], .employment-type, [data-test-id*="employment-type"]',
      companyUrl: 'a[href*="/jobs/search?cn="], .company-link',
      tags: '[data-testid="jobCardTags"] li, .job-tags li, .skill-tags li'
    }
  },

  'hiring-cafe': {
    name: 'Hiring.Cafe',
    domain: 'hiring.cafe',
    enabled: true,
    selectors: {
      jobContainer: [
        '.job-details',
        '.job-container', 
        '.content',
        'main',
        'body'
      ],
      jobList: '.job-list, .jobs-container',
      title: [
        'h1.job-title',
        '.job-header h1',
        'h1',
        '.job-title'
      ],
      company: [
        '.company-name',
        '.job-company',
        '[data-company]',
        '.company'
      ],
      location: [
        '.job-location',
        '.location',
        '[data-location]',
        '.job-loc'
      ],
      salary: [
        '.salary',
        '.compensation',
        '[data-salary]',
        '.salary-info'
      ],
      description: [
        '.job-description',
        '.description',
        '.content .text',
        '.job-content'
      ],
      applyLink: [
        '.apply-button',
        '.apply-link',
        'a[href*="apply"]'
      ],
      postedDate: [
        '.job-posted',
        '.posted-date',
        '.date-posted'
      ],
      jobType: [
        '.job-type',
        '.employment-type',
        '.work-type'
      ]
    }
  },

  'greenhouse': {
    name: 'Greenhouse',
    domain: 'greenhouse.io',
    enabled: true,
    selectors: {
      jobContainer: 'body, .job__header, .job__description',
      jobList: '.job-list, .jobs-container',
      title: [
        'h1.section-header.section-header--large.font-primary',
        '.job__title h1',
        'h1[class*="section-header"]',
        '.job__header h1'
      ],
      company: [
        '.logo img[alt*="Logo"]',
        '.image-container .logo img[alt]',
        '[class*="logo"] img[alt]',
        '.job__header .logo img[alt]'
      ],
      location: [
        '.job__location div',
        '.job__location',
        '[class*="location"] div',
        '.job__header [class*="location"]'
      ],
      salary: '', // No specific salary selector - will extract from description
      description: [
        '.job__description.body',
        '.job__description',
        '[class*="description"] .body',
        '.body'
      ],
      applyLink: [
        '.btn.btn--pill[aria-label="Apply"]',
        '.apply-button',
        'button[type="button"]'
      ],
      postedDate: [
        'script[type="application/json"]',
        'script[type="application/ld+json"]',
        'script'
      ],
      jobType: [
        '.job__tags',
        '.job-type',
        '.employment-type'
      ]
    }
  },

  'workday': {
    name: 'Workday',
    domain: 'myworkdayjobs.com',
    enabled: true,
    selectors: {
      jobContainer: [
        'body',
        '[data-automation-id="jobPosting"]',
        '.job-posting',
        '.job-details',
        '[data-testid="job-posting"]'
      ],
      jobList: '[data-automation-id="jobList"]',
      title: [
        'h1[data-automation-id="jobPostingHeadline"]',
        'h1.job-title',
        '[data-automation-id="jobPostingHeadline"]',
        'h1',
        '.job-title'
      ],
      company: [
        '[data-automation-id="companyName"]',
        '.company-name',
        '[data-testid="company-name"]',
        '.job-company',
        'h2[data-automation-id="companyName"]'
      ],
      location: [
        '[data-automation-id="jobLocation"]',
        '.job-location',
        '[data-testid="job-location"]',
        '.location',
        '[data-automation-id="jobLocation"] span'
      ],
      salary: [
        '[data-automation-id="compensationText"]',
        '.salary',
        '[data-testid="salary"]',
        '.compensation',
        '[data-automation-id="compensationText"] span'
      ],
      description: [
        '[data-automation-id="jobPostingDescription"]',
        '.job-description',
        '[data-testid="job-description"]',
        '.description',
        '[data-automation-id="jobPostingDescription"] div'
      ],
      applyLink: [
        '[data-automation-id="applyButton"]',
        '.apply-button',
        '[data-testid="apply-button"]'
      ],
      postedDate: [
        '[data-automation-id="postedOn"]',
        '.posted-date',
        '[data-testid="posted-date"]',
        '.job-posted',
        '[data-automation-id="postedOn"] span'
      ],
      jobType: [
        '[data-automation-id="jobType"]',
        '.job-type',
        '[data-testid="job-type"]',
        '.employment-type',
        '[data-automation-id="jobType"] span'
      ]
    }
  },

  'theladders': {
    name: 'TheLadders',
    domain: 'theladders.com',
    enabled: true,
    selectors: {
      jobContainer: [
        '.job-detail-view-container',
        '.sticky-job-details-container',
        'body',
        '.job-details',
        '.job-posting',
        '.job-container',
        'main'
      ],
      jobList: [
        '.job-list',
        '.jobs-container',
        '.search-results'
      ],
      title: [
        '.sticky-job-title',
        'h1.job-title',
        '.job-header h1',
        'h1',
        '.job-title',
        '[data-testid="job-title"]'
      ],
      company: [
        '.member-company-name',
        '.company-name',
        '.job-company',
        '.employer-name',
        '[data-testid="company-name"]'
      ],
      location: [
        '.member-job-view-header-details-light-font',
        '.job-location',
        '.location',
        '.job-loc',
        '[data-testid="job-location"]'
      ],
      salary: [
        '.salary',
        '.compensation',
        '.salary-info',
        '[data-testid="salary"]'
      ],
      description: [
        '#job-description-box',
        '.job-description-text',
        '.job-description',
        '.description',
        '.job-content',
        '.content',
        '[data-testid="job-description"]'
      ],
      applyLink: [
        '.apply-for-me-button',
        '.regular-apply-button',
        '.apply-button',
        '.apply-link',
        'a[href*="apply"]',
        '[data-testid="apply-button"]'
      ],
      jobLink: [
        '.job-card-title[href*="/job/"]',
        '.member-job-card-container a[href*="/job/"]',
        '.clickable-member-job-card a[href*="/job/"]'
      ],
      postedDate: [
        '.posted-date',
        '.job-posted',
        '.date-posted',
        '[data-testid="posted-date"]'
      ],
      jobType: [
        '.remote-flag-badge-basic',
        '.remote-flag-badge-in-person',
        '.job-type',
        '.employment-type',
        '.work-type',
        '[data-testid="job-type"]'
      ]
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
