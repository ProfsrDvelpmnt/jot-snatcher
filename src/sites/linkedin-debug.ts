// LinkedIn extraction logic with full debugging and fallback selectors
// This version includes all debugging code and fallback selectors for troubleshooting
import { JobExtractor } from '@/utils/enhancedJobExtractor';
import { SiteConfig } from '@/utils/siteDetector';
import { JobData } from '@/types';
import { parseSalary } from '@/utils/salaryParser';

export class LinkedInExtractor extends JobExtractor {
  constructor() {
    super({
      domain: 'linkedin.com',
      name: 'LinkedIn',
      enabled: true,
      selectors: {
        // Main job container - handle both search results and individual job pages
        jobContainer: [
          '.job-details-jobs-unified-top-card__container--two-pane', // Individual job page
          '.job-details-jobs-unified-top-card', // Individual job page
          '.jobs-search__job-details--container', // Right panel on search results
          '.job-card-job-posting-card-wrapper--active', // Active/selected job card
          '.job-card-job-posting-card-wrapper', // Any job card
          // Additional fallback selectors
          '.jobs-search__results-list li',
          '.job-search-card',
          '.jobs-unified-top-card',
          '[data-job-id]'
        ],
        
        // Job title selectors
        title: [
          '.job-details-jobs-unified-top-card__job-title h1 a',
          '.job-details-jobs-unified-top-card__job-title a',
          '.job-card-job-posting-card-wrapper__title strong',
          '.artdeco-entity-lockup__title strong',
          // Additional fallback selectors
          'h1[data-test-id="job-title"]',
          '.job-details-module h1',
          '.jobs-unified-top-card__job-title a',
          '.job-details-jobs-unified-top-card__job-title'
        ],
        
        // Company name selectors
        company: [
          '.job-details-jobs-unified-top-card__company-name a',
          '.job-details-jobs-unified-top-card__company-name',
          '.artdeco-entity-lockup__subtitle',
          '.job-card-job-posting-card-wrapper__subtitle',
          // Additional fallback selectors
          '[data-test-id="job-details-company-name"]',
          '.job-details-module .job-details-jobs-unified-top-card__primary-description a',
          '.jobs-unified-top-card__company-name a',
          '.job-details-jobs-unified-top-card__primary-description a'
        ],
        
        // Location selectors - target the specific text elements
        location: [
          '.job-details-jobs-unified-top-card__tertiary-description-container .tvm__text--low-emphasis:first-of-type',
          '.job-details-jobs-unified-top-card__tertiary-description-container span:first-of-type',
          '.artdeco-entity-lockup__caption',
          '.job-card-job-posting-card-wrapper__caption',
          // Additional fallback selectors
          '.job-details-jobs-unified-top-card__bullet',
          '.jobs-unified-top-card__bullet',
          '.job-details-jobs-unified-top-card__primary-description .tvm__text--low-emphasis',
          '[data-test-id="job-details-location"]'
        ],
        
        // Posted date selectors - target the specific text elements
        postedDate: [
          '.job-details-jobs-unified-top-card__tertiary-description-container .tvm__text--low-emphasis:nth-of-type(3)',
          '.job-details-jobs-unified-top-card__tertiary-description-container span:nth-of-type(3)',
          '.job-card-job-posting-card-wrapper__footer-item time',
          'time[datetime]',
          // Additional fallback selectors
          '.job-details-jobs-unified-top-card__primary-description time',
          '.jobs-unified-top-card__subtitle-secondary-grouping time'
        ],
        
        // Applicant count selectors - target the specific text elements
        applicants: [
          '.job-details-jobs-unified-top-card__tertiary-description-container .tvm__text--positive',
          '.job-details-jobs-unified-top-card__tertiary-description-container .tvm__text--low-emphasis:nth-of-type(5)',
          '.job-card-job-posting-card-wrapper__footer-item .tvm__text--positive',
          // Additional fallback selectors
          '.job-details-jobs-unified-top-card__job-insight[data-test-id*="applicant"]',
          '.jobs-unified-top-card__job-insight .jobs-unified-top-card__job-insight-text'
        ],
        
        // Job type and work environment selectors - target the preference buttons
        jobType: [
          '.job-details-fit-level-preferences button',
          '.artdeco-entity-lockup__caption',
          '.job-card-job-posting-card-wrapper__caption',
          // Additional fallback selectors
          '.job-details-preferences-and-skills .job-details-preferences-and-skills__pill',
          '.job-details-jobs-unified-top-card__job-insight',
          '[data-test-id="job-type"]'
        ],
        
        // Job description selectors - target the main content area
        description: [
          'div.jobs-box__html-content.jobs-description-content__text--stretch#job-details',
          '.jobs-box__html-content.jobs-description-content__text--stretch',
          'div[class*="jobs-box__html-content"][class*="jobs-description-content__text--stretch"]',
          '.jobs-description-content__text--stretch',
          '.jobs-description__container .jobs-description-content__text',
          '#job-details',
          'div[class*="jobs-box__html-content"]',
          'div[class*="jobs-description-content__text--stretch"]',
          // Additional fallback selectors
          '.job-details-module__content .jobs-description-content__text',
          '[data-test-id="job-description"]'
        ],
        
        // Salary selectors - target the salary button
        salary: [
          '.job-details-fit-level-preferences button .tvm__text--low-emphasis strong',
          '.job-details-fit-level-preferences button',
          '.artdeco-entity-lockup__metadata .tvm__text--low-emphasis',
          '.job-card-job-posting-card-wrapper__metadata .tvm__text--low-emphasis',
          // Additional fallback selectors
          '.job-details-preferences-and-skills .job-details-preferences-and-skills__pill',
          '.job-details-jobs-unified-top-card__job-insight .job-details-jobs-unified-top-card__job-insight-text',
          '.jobs-unified-top-card__job-insight-text',
          '[data-test-id="job-salary"]'
        ]
      }
    });
  }

  extractJobData(): JobData | null {
    // Wait for job details to load (LinkedIn uses dynamic loading)
    if (!this.waitForJobContainer()) {
      console.log('❌ LinkedIn: Content not loaded within timeout');
      console.log('🔍 LinkedIn: Available containers on page:');
      console.log('  - .job-details-jobs-unified-top-card__container--two-pane:', document.querySelectorAll('.job-details-jobs-unified-top-card__container--two-pane').length);
      console.log('  - .job-details-jobs-unified-top-card:', document.querySelectorAll('.job-details-jobs-unified-top-card').length);
      console.log('  - .jobs-search__job-details--container:', document.querySelectorAll('.jobs-search__job-details--container').length);
      console.log('  - .job-card-job-posting-card-wrapper--active:', document.querySelectorAll('.job-card-job-posting-card-wrapper--active').length);
      console.log('  - .job-card-job-posting-card-wrapper:', document.querySelectorAll('.job-card-job-posting-card-wrapper').length);
      console.log('  - .jobs-search__results-list li:', document.querySelectorAll('.jobs-search__results-list li').length);
      console.log('  - .job-search-card:', document.querySelectorAll('.job-search-card').length);
      console.log('  - .jobs-unified-top-card:', document.querySelectorAll('.jobs-unified-top-card').length);
      console.log('  - [data-job-id]:', document.querySelectorAll('[data-job-id]').length);
      console.log('🔍 LinkedIn: Page URL:', window.location.href);
      console.log('🔍 LinkedIn: Page title:', document.title);
      return null;
    }

    const jobContainer = this.findJobContainer();
    if (!jobContainer) {
      console.log('❌ LinkedIn: No job container found');
      return null;
    }

    console.log('✅ LinkedIn: Job container found:', jobContainer);

    // Extract basic information
    const position = this.extractTextWithFallbacks(jobContainer, this.selectors.title);
    const organization = this.extractTextWithFallbacks(jobContainer, this.selectors.company);
    
    console.log('🔍 LinkedIn: Extracted data:');
    console.log('  - Position:', position);
    console.log('  - Organization:', organization);
    
    // These are the only required fields
    if (!position || !organization) {
      console.log('❌ LinkedIn: Missing required fields (position or organization)');
      return null;
    }

    const location = this.extractTextWithFallbacks(jobContainer, this.selectors.location);
    const salaryText = this.extractTextWithFallbacks(jobContainer, this.selectors.salary);
    const description = this.extractDescriptionWithFormatting(jobContainer);
    
    console.log('🔍 LinkedIn: Additional data:');
    console.log('  - Location:', location);
    console.log('  - Salary:', salaryText);
    console.log('  - Description length:', description.length);
    
    // Parse job type and environment from preferences
    const { jobType, environment } = this.parseLinkedInJobPreferences(jobContainer);
    
    console.log('🔍 LinkedIn: Parsed preferences:');
    console.log('  - Job Type:', jobType);
    console.log('  - Environment:', environment);
    
    // Parse salary
    const parsedSalary = parseSalary(salaryText);
    
    // Extract posting date and applicants
    const postingAge = this.extractPostingAge(jobContainer);
    const applicantCount = this.extractApplicantCount(jobContainer);

    console.log('🔍 LinkedIn: Final data:');
    console.log('  - Posting Age:', postingAge);
    console.log('  - Applicant Count:', applicantCount);
    console.log('  - Parsed Salary:', parsedSalary);

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
      date_posted: postingAge, // Keep for API compatibility
      job_posting_url: window.location.href,
      description: description || '',
      // Legacy fields
      jobId: this.generateJobId(),
      companyName: organization.trim(),
      jobLink: window.location.href,
      jobTitle: position.trim(),
      workType: jobType || 'Not specified',
      ageOfPosting: postingAge ? this.formatRelativeTime(postingAge) : 'Unknown',
      numApplicants: applicantCount || 'Unknown'
    };

    return jobData;
  }

  private waitForJobContainer(timeout: number = 5000): boolean {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      // Try all container selectors
      const containerSelectors = Array.isArray(this.selectors.jobContainer) 
        ? this.selectors.jobContainer 
        : [this.selectors.jobContainer];
      
      for (const containerSelector of containerSelectors) {
        const container = document.querySelector(containerSelector);
        if (container) {
          // Try all title selectors
          const titleSelectors = Array.isArray(this.selectors.title) 
            ? this.selectors.title 
            : [this.selectors.title];
          
          for (const titleSelector of titleSelectors) {
            const title = container.querySelector(titleSelector);
            if (title && title.textContent?.trim()) {
              console.log(`✅ Found job container with selector: ${containerSelector}`);
              console.log(`✅ Found title with selector: ${titleSelector}`);
              return true;
            }
          }
        }
      }
      
      // Wait 100ms before checking again
      const waitTime = 100;
      const endTime = Date.now() + waitTime;
      while (Date.now() < endTime) {
        // Busy wait
      }
    }
    
    console.log('❌ No job container found with any selector');
    return false;
  }

  private parseLinkedInJobPreferences(container: Element): { jobType: string; environment: string } {
    let jobType = 'Not specified';
    let environment = 'Not specified';
    
    console.log('🔍 LinkedIn: Parsing job preferences...');
    
    // Look for job preference buttons that contain type/environment info
    const preferenceButtons = container.querySelectorAll('.job-details-fit-level-preferences button');
    
    console.log(`🔍 LinkedIn: Found ${preferenceButtons.length} preference buttons`);
    
    preferenceButtons.forEach((button, index) => {
      const text = button.textContent?.toLowerCase() || '';
      console.log(`🔍 LinkedIn: Button ${index + 1} text: "${text}"`);
      
      // Clean up the text by removing LinkedIn's extra text
      const cleanText = text.replace(/matches your job preferences.*$/i, '').trim();
      console.log(`🔍 LinkedIn: Cleaned text: "${cleanText}"`);
      
      // Job type detection
      if (cleanText.includes('full-time') || cleanText.includes('full time')) {
        jobType = 'Full Time';
        console.log('✅ LinkedIn: Detected job type: Full Time');
      }
      else if (cleanText.includes('part-time') || cleanText.includes('part time')) {
        jobType = 'Part Time';
        console.log('✅ LinkedIn: Detected job type: Part Time');
      }
      else if (cleanText.includes('contract')) {
        jobType = 'Contract';
        console.log('✅ LinkedIn: Detected job type: Contract');
      }
      else if (cleanText.includes('temporary') || cleanText.includes('temp')) {
        jobType = 'Temporary';
        console.log('✅ LinkedIn: Detected job type: Temporary');
      }
      else if (cleanText.includes('internship')) {
        jobType = 'Internship';
        console.log('✅ LinkedIn: Detected job type: Internship');
      }
      
      // Work environment detection
      if (cleanText.includes('on-site') || cleanText.includes('onsite')) {
        environment = 'In-Person';
        console.log('✅ LinkedIn: Detected environment: In-Person');
      }
      else if (cleanText.includes('remote')) {
        environment = 'Remote';
        console.log('✅ LinkedIn: Detected environment: Remote');
      }
      else if (cleanText.includes('hybrid')) {
        environment = 'Hybrid';
        console.log('✅ LinkedIn: Detected environment: Hybrid');
      }
    });
    
    console.log(`🔍 LinkedIn: Final job type: ${jobType}, environment: ${environment}`);
    return { jobType, environment };
  }

  private extractPostingAge(container: Element): string | null {
    console.log('🔍 LinkedIn: Extracting posting age...');
    
    // Look for the posting age in the tertiary description container
    const timeText = this.extractTextWithFallbacks(container, this.selectors.postedDate);
    if (timeText) {
      console.log(`✅ LinkedIn: Found posting age: "${timeText}"`);
      // Clean up the text and return it
      return timeText.trim();
    }
    
    console.log('❌ LinkedIn: No posting age found');
    return null;
  }

  private extractApplicantCount(container: Element): string | null {
    console.log('🔍 LinkedIn: Extracting applicant count...');
    
    // Look for applicant count in the tertiary description container
    const applicantText = this.extractTextWithFallbacks(container, this.selectors.applicants);
    if (applicantText) {
      console.log(`✅ LinkedIn: Found applicant count: "${applicantText}"`);
      // Clean up the text and return it
      return applicantText.trim();
    }
    
    console.log('❌ LinkedIn: No applicant count found');
    return null;
  }

  private extractDescriptionWithFormatting(container: Element): string {
    console.log('🔍 LinkedIn: Extracting description...');
    
    // Try to find the description element with multiple selectors
    const descriptionSelectors = Array.isArray(this.selectors.description) 
      ? this.selectors.description 
      : [this.selectors.description];
    
    // First try within the job container
    for (const selector of descriptionSelectors) {
      const element = container.querySelector(selector);
      if (element) {
        console.log(`✅ LinkedIn: Found description with selector: ${selector}`);
        // Preserve HTML formatting for better readability
        return element.innerHTML || element.textContent || '';
      }
    }
    
    // If not found in container, try searching the entire document
    console.log('🔍 LinkedIn: Description not found in job container, searching entire document...');
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`✅ LinkedIn: Found description in document with selector: ${selector}`);
        // Preserve HTML formatting for better readability
        return element.innerHTML || element.textContent || '';
      }
    }
    
    console.log('❌ LinkedIn: No description element found with any selector');
    return '';
  }

  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `JOB-${timestamp}-${random}`;
  }

  private formatRelativeTime(timeText: string): string {
    console.log(`🔍 LinkedIn: Formatting relative time: "${timeText}"`);
    
    const text = timeText.toLowerCase().trim();
    
    // Handle "Reposted X time ago" format
    if (text.includes('reposted')) {
      const match = text.match(/reposted\s+(.+)/);
      if (match) {
        console.log(`🔍 LinkedIn: Found reposted format: "${match[1]}"`);
        return this.parseTimeAgo(match[1]);
      }
    }
    
    // Handle direct time ago formats
    if (text.includes('ago')) {
      console.log('🔍 LinkedIn: Found direct time ago format');
      return this.parseTimeAgo(text);
    }
    
    // Handle specific time formats
    if (text.includes('hour')) {
      const match = text.match(/(\d+)\s*hour/);
      if (match) {
        const hours = parseInt(match[1]);
        const result = hours === 1 ? '1 hour ago' : `${hours} hours ago`;
        console.log(`🔍 LinkedIn: Formatted hours: "${result}"`);
        return result;
      }
    }
    
    if (text.includes('day')) {
      const match = text.match(/(\d+)\s*day/);
      if (match) {
        const days = parseInt(match[1]);
        const result = days === 1 ? '1 day ago' : `${days} days ago`;
        console.log(`🔍 LinkedIn: Formatted days: "${result}"`);
        return result;
      }
    }
    
    if (text.includes('week')) {
      const match = text.match(/(\d+)\s*week/);
      if (match) {
        const weeks = parseInt(match[1]);
        const result = weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
        console.log(`🔍 LinkedIn: Formatted weeks: "${result}"`);
        return result;
      }
    }
    
    if (text.includes('month')) {
      const match = text.match(/(\d+)\s*month/);
      if (match) {
        const months = parseInt(match[1]);
        const result = months === 1 ? '1 month ago' : `${months} months ago`;
        console.log(`🔍 LinkedIn: Formatted months: "${result}"`);
        return result;
      }
    }
    
    console.log(`🔍 LinkedIn: No time format matched, returning original: "${timeText}"`);
    return timeText;
  }
  
  private parseTimeAgo(timeStr: string): string {
    console.log(`🔍 LinkedIn: Parsing time ago: "${timeStr}"`);
    
    const text = timeStr.toLowerCase().trim();
    
    if (text.includes('hour')) {
      const match = text.match(/(\d+)\s*hour/);
      if (match) {
        const hours = parseInt(match[1]);
        const result = hours === 1 ? '1 hour ago' : `${hours} hours ago`;
        console.log(`🔍 LinkedIn: Parsed hours: "${result}"`);
        return result;
      }
    }
    
    if (text.includes('day')) {
      const match = text.match(/(\d+)\s*day/);
      if (match) {
        const days = parseInt(match[1]);
        const result = days === 1 ? '1 day ago' : `${days} days ago`;
        console.log(`🔍 LinkedIn: Parsed days: "${result}"`);
        return result;
      }
    }
    
    if (text.includes('week')) {
      const match = text.match(/(\d+)\s*week/);
      if (match) {
        const weeks = parseInt(match[1]);
        const result = weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
        console.log(`🔍 LinkedIn: Parsed weeks: "${result}"`);
        return result;
      }
    }
    
    if (text.includes('month')) {
      const match = text.match(/(\d+)\s*month/);
      if (match) {
        const months = parseInt(match[1]);
        const result = months === 1 ? '1 month ago' : `${months} months ago`;
        console.log(`🔍 LinkedIn: Parsed months: "${result}"`);
        return result;
      }
    }
    
    console.log(`🔍 LinkedIn: No time pattern matched, returning original: "${timeStr}"`);
    return timeStr;
  }
}
