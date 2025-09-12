// src/sites/linkedin.ts
export class LinkedInExtractor extends JobExtractor {
  constructor() {
    super({
      domain: 'linkedin.com',
      name: 'LinkedIn',
      selectors: {
        // Main job container in right panel
        jobContainer: '.jobs-search__job-details--container, .job-details-jobs-unified-top-card, [data-job-id]',
        
        // Job title selectors (multiple fallbacks)
        title: [
          '[data-job-details="job-details-module"] h1',
          '.job-details-jobs-unified-top-card__job-title a',
          '.jobs-unified-top-card__job-title a',
          '.job-details-module h1',
          'h1[data-test-id="job-title"]'
        ],
        
        // Company name selectors
        company: [
          '[data-job-details="job-details-module"] .job-details-jobs-unified-top-card__company-name a',
          '.job-details-jobs-unified-top-card__company-name',
          '.jobs-unified-top-card__company-name a',
          '.job-details-module .job-details-jobs-unified-top-card__primary-description a',
          '[data-test-id="job-details-company-name"]'
        ],
        
        // Location selectors
        location: [
          '.job-details-jobs-unified-top-card__bullet',
          '.jobs-unified-top-card__bullet',
          '.job-details-jobs-unified-top-card__primary-description .tvm__text--low-emphasis',
          '[data-test-id="job-details-location"]'
        ],
        
        // Salary selectors
        salary: [
          '.job-details-preferences-and-skills .job-details-preferences-and-skills__pill',
          '.job-details-jobs-unified-top-card__job-insight .job-details-jobs-unified-top-card__job-insight-text',
          '.jobs-unified-top-card__job-insight-text',
          '[data-test-id="job-salary"]'
        ],
        
        // Job type and work environment
        jobType: [
          '.job-details-preferences-and-skills .job-details-preferences-and-skills__pill',
          '.job-details-jobs-unified-top-card__job-insight',
          '[data-test-id="job-type"]'
        ],
        
        // Description
        description: [
          '.job-details-module__content .jobs-description-content__text',
          '.jobs-description__container .jobs-description-content__text',
          '[data-test-id="job-description"]'
        ],
        
        // Posting age
        postingAge: [
          '.job-details-jobs-unified-top-card__primary-description time',
          '.jobs-unified-top-card__subtitle-secondary-grouping time',
          'time[datetime]'
        ],
        
        // Number of applicants
        applicants: [
          '.job-details-jobs-unified-top-card__job-insight[data-test-id*="applicant"]',
          '.jobs-unified-top-card__job-insight .jobs-unified-top-card__job-insight-text'
        ]
      }
    });
  }

  extractJobData(): JobData | null {
    // Wait for job details to load (LinkedIn uses dynamic loading)
    if (!this.waitForJobContainer()) {
      return null;
    }

    const jobContainer = this.findJobContainer();
    if (!jobContainer) return null;

    // Extract basic information
    const position = this.extractTextWithFallbacks(jobContainer, this.selectors.title);
    const organization = this.extractTextWithFallbacks(jobContainer, this.selectors.company);
    
    // These are the only required fields
    if (!position || !organization) {
      console.warn('LinkedIn: Missing required fields (position or organization)');
      return null;
    }

    const location = this.extractTextWithFallbacks(jobContainer, this.selectors.location);
    const salaryText = this.extractTextWithFallbacks(jobContainer, this.selectors.salary);
    const description = this.extractTextWithFallbacks(jobContainer, this.selectors.description);
    
    // Parse job type and environment from insights
    const { jobType, environment } = this.parseLinkedInJobInsights(jobContainer);
    
    // Parse salary
    const parsedSalary = parseSalary(salaryText);
    
    // Extract posting date and applicants
    const postingAge = this.extractPostingAge(jobContainer);
    const applicantCount = this.extractApplicantCount(jobContainer);

    const jobData: JobData = {
      organization: organization.trim(),
      position: position.trim(),
      link: window.location.href,
      salary: parsedSalary.salary,
      salary_type: parsedSalary.salary_type,
      salary_min: parsedSalary.salary_min,
      salary_max: parsedSalary.salary_max,
      location: location || 'Not specified',
      type: jobType || 'Not specified',
      environment: environment || 'Not specified',
      stage: 'Saved',
      source: 'linkedin',
      job_site: 'LinkedIn',
      date_saved: new Date().toISOString(),
      date_posted: postingAge,
      job_posting_url: window.location.href,
      description: description || '',
      applicant_count: applicantCount
    };

    return jobData;
  }

  private waitForJobContainer(timeout: number = 5000): boolean {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const container = document.querySelector(this.selectors.jobContainer);
      const title = container?.querySelector(this.selectors.title[0]);
      
      if (container && title && title.textContent?.trim()) {
        return true;
      }
      
      // Wait 100ms before checking again
      const waitTime = 100;
      const endTime = Date.now() + waitTime;
      while (Date.now() < endTime) {
        // Busy wait
      }
    }
    
    return false;
  }

  private parseLinkedInJobInsights(container: Element): { jobType: string; environment: string } {
    let jobType = 'Not specified';
    let environment = 'Not specified';
    
    // Look for job insights that contain type/environment info
    const insights = container.querySelectorAll('.job-details-jobs-unified-top-card__job-insight');
    
    insights.forEach(insight => {
      const text = insight.textContent?.toLowerCase() || '';
      
      // Job type detection
      if (text.includes('full-time') || text.includes('full time')) jobType = 'Full Time';
      else if (text.includes('part-time') || text.includes('part time')) jobType = 'Part Time';
      else if (text.includes('contract')) jobType = 'Contract';
      else if (text.includes('temporary') || text.includes('temp')) jobType = 'Temporary';
      else if (text.includes('internship')) jobType = 'Internship';
      
      // Work environment detection
      if (text.includes('remote')) environment = 'Remote';
      else if (text.includes('hybrid')) environment = 'Hybrid';
      else if (text.includes('on-site') || text.includes('onsite') || text.includes('in-person')) environment = 'In-Person';
    });
    
    return { jobType, environment };
  }

  private extractPostingAge(container: Element): string | null {
    const timeElement = container.querySelector('time[datetime]');
    if (timeElement) {
      return timeElement.getAttribute('datetime') || null;
    }
    
    // Fallback: parse relative time text
    const timeText = this.extractTextWithFallbacks(container, this.selectors.postingAge);
    if (timeText) {
      return this.parseRelativeTime(timeText);
    }
    
    return null;
  }

  private extractApplicantCount(container: Element): string | null {
    const applicantElements = container.querySelectorAll('[data-test-id*="applicant"], .job-details-jobs-unified-top-card__job-insight');
    
    for (const element of applicantElements) {
      const text = element.textContent || '';
      if (text.toLowerCase().includes('applicant')) {
        return text.trim();
      }
    }
    
    return null;
  }
}

// src/sites/monster.ts
export class MonsterExtractor extends JobExtractor {
  constructor() {
    super({
      domain: 'monster.com',
      name: 'Monster',
      selectors: {
        // Monster uses a card-based layout with right panel details
        jobContainer: '.JobView, .job-view-container, [data-test-id="job-view"]',
        
        title: [
          '.JobViewTitle h1',
          '[data-test-id="svx-jobdetails-job-title"]',
          '.job-view-title h1',
          'h1[data-test-id*="title"]'
        ],
        
        company: [
          '.JobViewTitle .company',
          '[data-test-id="svx-jobdetails-company"]',
          '.job-view-company a',
          '.company-name'
        ],
        
        location: [
          '.JobViewTitle .location',
          '[data-test-id="svx-jobdetails-location"]',
          '.job-view-location',
          '.location-info'
        ],
        
        salary: [
          '.salary-info',
          '[data-test-id="svx-jobdetails-salary"]',
          '.job-view-salary',
          '.compensation'
        ],
        
        jobType: [
          '.employment-type',
          '[data-test-id*="employment-type"]',
          '.job-type-info'
        ],
        
        description: [
          '.job-description',
          '[data-test-id="svx-jobdetails-description"]',
          '.JobViewDescription'
        ]
      }
    });
  }

  extractJobData(): JobData | null {
    // Monster loads content dynamically, wait for it
    if (!this.waitForContent()) return null;

    const jobContainer = this.findJobContainer();
    if (!jobContainer) return null;

    const position = this.extractTextWithFallbacks(jobContainer, this.selectors.title);
    const organization = this.extractTextWithFallbacks(jobContainer, this.selectors.company);

    if (!position || !organization) return null;

    const location = this.extractTextWithFallbacks(jobContainer, this.selectors.location);
    const salaryText = this.extractTextWithFallbacks(jobContainer, this.selectors.salary);
    const description = this.extractTextWithFallbacks(jobContainer, this.selectors.description);
    const jobType = this.extractTextWithFallbacks(jobContainer, this.selectors.jobType);

    const parsedSalary = parseSalary(salaryText);
    const environment = this.detectEnvironmentFromDescription(description);

    return {
      organization: organization.trim(),
      position: position.trim(),
      link: window.location.href,
      salary: parsedSalary.salary,
      salary_type: parsedSalary.salary_type,
      salary_min: parsedSalary.salary_min,
      salary_max: parsedSalary.salary_max,
      location: location || 'Not specified',
      type: this.normalizeJobType(jobType) || 'Not specified',
      environment: environment || 'Not specified',
      stage: 'Saved',
      source: 'monster',
      job_site: 'Monster',
      date_saved: new Date().toISOString(),
      date_posted: null,
      job_posting_url: window.location.href,
      description: description || ''
    };
  }
}

// src/sites/ziprecruiter.ts
export class ZipRecruiterExtractor extends JobExtractor {
  constructor() {
    super({
      domain: 'ziprecruiter.com',
      name: 'ZipRecruiter',
      selectors: {
        jobContainer: '.job_content, .jobDescriptionSection, [data-test="job-description"]',
        
        title: [
          'h1[data-test="job-title"]',
          '.job_title h1',
          'h1.job-title'
        ],
        
        company: [
          '[data-test="company-name"]',
          '.company_name a',
          '.hiring_company a'
        ],
        
        location: [
          '[data-test="job-location"]',
          '.location',
          '.job_location'
        ],
        
        salary: [
          '[data-test="compensation-text"]',
          '.salary_snippet_text',
          '.compensation'
        ],
        
        description: [
          '[data-test="job-description"]',
          '.jobDescriptionSection',
          '.job_description'
        ]
      }
    });
  }

  extractJobData(): JobData | null {
    const jobContainer = this.findJobContainer();
    if (!jobContainer) return null;

    const position = this.extractTextWithFallbacks(jobContainer, this.selectors.title);
    const organization = this.extractTextWithFallbacks(jobContainer, this.selectors.company);

    if (!position || !organization) return null;

    const location = this.extractTextWithFallbacks(jobContainer, this.selectors.location);
    const salaryText = this.extractTextWithFallbacks(jobContainer, this.selectors.salary);
    const description = this.extractTextWithFallbacks(jobContainer, this.selectors.description);

    const parsedSalary = parseSalary(salaryText);
    const environment = this.detectEnvironmentFromDescription(description);

    return {
      organization: organization.trim(),
      position: position.trim(),
      link: window.location.href,
      salary: parsedSalary.salary,
      salary_type: parsedSalary.salary_type,
      salary_min: parsedSalary.salary_min,
      salary_max: parsedSalary.salary_max,
      location: location || 'Not specified',
      type: 'Not specified', // ZipRecruiter doesn't always show job type
      environment: environment || 'Not specified',
      stage: 'Saved',
      source: 'ziprecruiter',
      job_site: 'ZipRecruiter',
      date_saved: new Date().toISOString(),
      date_posted: null,
      job_posting_url: window.location.href,
      description: description || ''
    };
  }
}

// src/sites/greenhouse.ts
export class GreenhouseExtractor extends JobExtractor {
  constructor() {
    super({
      domain: 'greenhouse.io',
      name: 'Greenhouse',
      selectors: {
        jobContainer: '.job-post, .application, [data-mapped="true"]',
        
        title: [
          'h1[data-mapped="job_name"]',
          '.job-post h1',
          'h1.app-title'
        ],
        
        company: [
          '[data-mapped="customer_name"]',
          '.company-name',
          '.header .company'
        ],
        
        location: [
          '[data-mapped="location_name"]',
          '.location',
          '.job-post .location'
        ],
        
        description: [
          '[data-mapped="job_description"]',
          '.job-post .description',
          '.application .content'
        ]
      }
    });
  }

  extractJobData(): JobData | null {
    const jobContainer = this.findJobContainer();
    if (!jobContainer) return null;

    const position = this.extractTextWithFallbacks(jobContainer, this.selectors.title);
    const organization = this.extractTextWithFallbacks(jobContainer, this.selectors.company);

    if (!position || !organization) return null;

    const location = this.extractTextWithFallbacks(jobContainer, this.selectors.location);
    const description = this.extractTextWithFallbacks(jobContainer, this.selectors.description);
    const environment = this.detectEnvironmentFromDescription(description);

    return {
      organization: organization.trim(),
      position: position.trim(),
      link: window.location.href,
      salary: 'Not specified',
      salary_type: 'annual',
      salary_min: null,
      salary_max: null,
      location: location || 'Not specified',
      type: 'Not specified',
      environment: environment || 'Not specified',
      stage: 'Saved',
      source: 'greenhouse',
      job_site: 'Greenhouse',
      date_saved: new Date().toISOString(),
      date_posted: null,
      job_posting_url: window.location.href,
      description: description || ''
    };
  }
}

// src/sites/hiring-cafe.ts
export class HiringCafeExtractor extends JobExtractor {
  constructor() {
    super({
      domain: 'hiring.cafe',
      name: 'Hiring.Cafe',
      selectors: {
        jobContainer: '.job-details, .job-container, .content',
        
        title: [
          'h1.job-title',
          '.job-header h1',
          'h1'
        ],
        
        company: [
          '.company-name',
          '.job-company',
          '[data-company]'
        ],
        
        location: [
          '.job-location',
          '.location',
          '[data-location]'
        ],
        
        salary: [
          '.salary',
          '.compensation',
          '[data-salary]'
        ],
        
        description: [
          '.job-description',
          '.description',
          '.content .text'
        ]
      }
    });
  }

  extractJobData(): JobData | null {
    const jobContainer = this.findJobContainer();
    if (!jobContainer) return null;

    const position = this.extractTextWithFallbacks(jobContainer, this.selectors.title);
    const organization = this.extractTextWithFallbacks(jobContainer, this.selectors.company);

    if (!position || !organization) return null;

    const location = this.extractTextWithFallbacks(jobContainer, this.selectors.location);
    const salaryText = this.extractTextWithFallbacks(jobContainer, this.selectors.salary);
    const description = this.extractTextWithFallbacks(jobContainer, this.selectors.description);

    const parsedSalary = parseSalary(salaryText);
    const environment = this.detectEnvironmentFromDescription(description);

    return {
      organization: organization.trim(),
      position: position.trim(),
      link: window.location.href,
      salary: parsedSalary.salary,
      salary_type: parsedSalary.salary_type,
      salary_min: parsedSalary.salary_min,
      salary_max: parsedSalary.salary_max,
      location: location || 'Not specified',
      type: 'Not specified',
      environment: environment || 'Not specified',
      stage: 'Saved',
      source: 'hiring-cafe',
      job_site: 'Hiring.Cafe',
      date_saved: new Date().toISOString(),
      date_posted: null,
      job_posting_url: window.location.href,
      description: description || ''
    };
  }
}

// Enhanced base extractor with helper methods
export abstract class JobExtractor {
  protected selectors: any;
  protected config: SiteConfig;

  constructor(config: SiteConfig) {
    this.config = config;
    this.selectors = config.selectors;
  }

  // Helper method to extract text with multiple selector fallbacks
  protected extractTextWithFallbacks(container: Element, selectors: string | string[]): string {
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
    
    for (const selector of selectorArray) {
      const element = container.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    
    return '';
  }

  // Wait for content to load with timeout
  protected waitForContent(timeout: number = 3000): boolean {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.findJobContainer()) {
        return true;
      }
      
      // Brief wait
      const waitTime = 100;
      const endTime = Date.now() + waitTime;
      while (Date.now() < endTime) {}
    }
    
    return false;
  }

  // Detect work environment from job description
  protected detectEnvironmentFromDescription(description: string): string {
    if (!description) return 'Not specified';
    
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('remote') || lowerDesc.includes('work from home')) {
      return 'Remote';
    } else if (lowerDesc.includes('hybrid')) {
      return 'Hybrid';
    } else if (lowerDesc.includes('on-site') || lowerDesc.includes('in-office') || lowerDesc.includes('in-person')) {
      return 'In-Person';
    }
    
    return 'Not specified';
  }

  // Normalize job type text
  protected normalizeJobType(jobType: string): string {
    if (!jobType) return 'Not specified';
    
    const lower = jobType.toLowerCase();
    
    if (lower.includes('full')) return 'Full Time';
    if (lower.includes('part')) return 'Part Time';
    if (lower.includes('contract')) return 'Contract';
    if (lower.includes('temporary') || lower.includes('temp')) return 'Temporary';
    if (lower.includes('intern')) return 'Internship';
    
    return jobType;
  }

  // Parse relative time to ISO date
  protected parseRelativeTime(timeText: string): string | null {
    const now = new Date();
    const lower = timeText.toLowerCase();
    
    if (lower.includes('today')) {
      return now.toISOString();
    } else if (lower.includes('yesterday')) {
      now.setDate(now.getDate() - 1);
      return now.toISOString();
    } else if (lower.includes('day')) {
      const days = parseInt(lower.match(/\d+/)?.[0] || '0');
      now.setDate(now.getDate() - days);
      return now.toISOString();
    } else if (lower.includes('week')) {
      const weeks = parseInt(lower.match(/\d+/)?.[0] || '0');
      now.setDate(now.getDate() - (weeks * 7));
      return now.toISOString();
    }
    
    return null;
  }

  protected findJobContainer(): Element | null {
    return document.querySelector(this.selectors.jobContainer);
  }

  abstract extractJobData(): JobData | null;
}