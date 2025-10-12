// LinkedIn-specific extraction logic - OPTIMIZED VERSION
// This version keeps all essential functionality but optimizes code structure and reduces redundancy
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
          '.job-card-job-posting-card-wrapper' // Any job card
        ],
        
        // Job title selectors
        title: [
          '.job-details-jobs-unified-top-card__job-title h1 a',
          '.job-details-jobs-unified-top-card__job-title a',
          '.job-card-job-posting-card-wrapper__title strong',
          '.artdeco-entity-lockup__title strong'
        ],
        
        // Company name selectors
        company: [
          '.job-details-jobs-unified-top-card__company-name a',
          '.job-details-jobs-unified-top-card__company-name',
          '.artdeco-entity-lockup__subtitle',
          '.job-card-job-posting-card-wrapper__subtitle'
        ],
        
        // Location selectors - target the specific text elements
        location: [
          '.job-details-jobs-unified-top-card__tertiary-description-container .tvm__text--low-emphasis:first-of-type',
          '.job-details-jobs-unified-top-card__tertiary-description-container span:first-of-type',
          '.artdeco-entity-lockup__caption',
          '.job-card-job-posting-card-wrapper__caption'
        ],
        
        // Posted date selectors - target the specific text elements
        postingAge: [
          '.job-details-jobs-unified-top-card__tertiary-description-container .tvm__text--low-emphasis:nth-of-type(3)',
          '.job-details-jobs-unified-top-card__tertiary-description-container span:nth-of-type(3)',
          '.job-card-job-posting-card-wrapper__footer-item time',
          'time[datetime]'
        ],
        
        // Applicant count selectors - target the specific text elements
        applicants: [
          '.job-details-jobs-unified-top-card__tertiary-description-container .tvm__text--positive',
          '.job-details-jobs-unified-top-card__tertiary-description-container .tvm__text--low-emphasis:nth-of-type(5)',
          '.job-card-job-posting-card-wrapper__footer-item .tvm__text--positive'
        ],
        
        // Job type and work environment selectors - target the preference buttons
        jobType: [
          '.job-details-fit-level-preferences button',
          '.artdeco-entity-lockup__caption',
          '.job-card-job-posting-card-wrapper__caption'
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
          'div[class*="jobs-description-content__text--stretch"]'
        ],
        
        // Salary selectors - target the salary button
        salary: [
          '.job-details-fit-level-preferences button .tvm__text--low-emphasis strong',
          '.job-details-fit-level-preferences button',
          '.artdeco-entity-lockup__metadata .tvm__text--low-emphasis',
          '.job-card-job-posting-card-wrapper__metadata .tvm__text--low-emphasis'
        ],
        
        // Job ID selectors - for creating consistent job URLs
        jobId: [
          'a[href*="/jobs/view/"]',
          '.job-card-job-posting-card-wrapper a[href*="/jobs/view/"]',
          '.job-details-jobs-unified-top-card__job-title a[href*="/jobs/view/"]',
          'a[data-job-id]'
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
    const salaryText = this.extractSalarySafely(jobContainer);
    const description = this.extractDescriptionWithFormatting(jobContainer);
    
    // Parse job type and environment from preferences
    const { jobType, environment } = this.parseLinkedInJobPreferences(jobContainer);
    
    // Parse salary
    const parsedSalary = parseSalary(salaryText);
    
    // Extract posting date and applicants
    const postingAge = this.extractPostingAge(jobContainer);
    const applicantCount = this.extractApplicantCount(jobContainer);
    
    // Extract job ID and create consistent job URL
    const jobId = this.extractJobId();
    const jobUrl = jobId ? `https://www.linkedin.com/jobs/view/${jobId}/` : window.location.href;

    const jobData: JobData = {
      organization: organization.trim(),
      position: position.trim(),
      link: jobUrl,
      salary: parsedSalary.salary,
      salary_type: parsedSalary.salary_type,
      salaryTypeDisplay: this.capitalizeSalaryType(parsedSalary.salary_type),
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
      job_posting_url: jobUrl,
      description: description || '',
      // Legacy fields
      jobId: this.generateJobId(),
      companyName: organization.trim(),
      jobLink: jobUrl,
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
    
    // Look for job preference buttons that contain type/environment info
    const preferenceButtons = container.querySelectorAll('.job-details-fit-level-preferences button');
    
    preferenceButtons.forEach(button => {
      const text = button.textContent?.toLowerCase() || '';
      
      // Clean up the text by removing LinkedIn's extra text
      const cleanText = text.replace(/matches your job preferences.*$/i, '').trim();
      
      // Job type detection
      if (cleanText.includes('full-time') || cleanText.includes('full time')) jobType = 'Full Time';
      else if (cleanText.includes('part-time') || cleanText.includes('part time')) jobType = 'Part Time';
      else if (cleanText.includes('contract')) jobType = 'Contract';
      else if (cleanText.includes('temporary') || cleanText.includes('temp')) jobType = 'Temporary';
      else if (cleanText.includes('internship')) jobType = 'Internship';
      
      // Work environment detection
      if (cleanText.includes('on-site') || cleanText.includes('onsite')) environment = 'In-Person';
      else if (cleanText.includes('remote')) environment = 'Remote';
      else if (cleanText.includes('hybrid')) environment = 'Hybrid';
    });
    
    return { jobType, environment };
  }

  private extractPostingAge(container: Element): string | null {
    // Look for the posting age in the tertiary description container
    const timeText = this.extractTextWithFallbacks(container, this.selectors.postingAge);
    if (timeText) {
      // Clean up the text and return it
      return timeText.trim();
    }
    
    return null;
  }

  private extractApplicantCount(container: Element): string | null {
    // Look for applicant count in the tertiary description container
    const applicantText = this.extractTextWithFallbacks(container, this.selectors.applicants);
    if (applicantText) {
      // Clean up the text and return it
      return applicantText.trim();
    }
    
    return null;
  }

  private extractDescriptionWithFormatting(container: Element): string {
    // Try to find the description element with multiple selectors
    const descriptionSelectors = Array.isArray(this.selectors.description) 
      ? this.selectors.description 
      : [this.selectors.description];
    
    // First try within the job container
    for (const selector of descriptionSelectors) {
      const element = container.querySelector(selector);
      if (element) {
        console.log(`✅ Found description with selector: ${selector}`);
        // Return HTML content to preserve formatting in the UI
        return element.innerHTML || element.textContent?.trim() || '';
      }
    }
    
    // If not found in container, try searching the entire document
    console.log('🔍 Description not found in job container, searching entire document...');
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`✅ Found description in document with selector: ${selector}`);
        // Return HTML content to preserve formatting in the UI
        return element.innerHTML || element.textContent?.trim() || '';
      }
    }
    
    console.log('❌ No description element found with any selector');
    return '';
  }

  private htmlToPlainText(element: Element): string {
    // Clone the element to avoid modifying the original DOM
    const clone = element.cloneNode(true) as Element;
    
    // Remove script and style elements
    const scriptsAndStyles = clone.querySelectorAll('script, style');
    scriptsAndStyles.forEach(el => el.remove());
    
    // Get the text content
    let text = clone.textContent || '';
    
    // Clean up the text:
    // 1. Replace multiple spaces with a single space
    text = text.replace(/\s+/g, ' ');
    
    // 2. Replace multiple newlines with double newlines for paragraph separation
    text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');
    
    // 3. Trim whitespace from start and end
    text = text.trim();
    
    return text;
  }

  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `JOB-${timestamp}-${random}`;
  }

  // OPTIMIZED: Combined time formatting logic to reduce code duplication
  private formatRelativeTime(timeText: string): string {
    const text = timeText.toLowerCase().trim();
    
    // Handle "Reposted X time ago" format
    if (text.includes('reposted')) {
      const match = text.match(/reposted\s+(.+)/);
      if (match) {
        return this.parseTimeAgo(match[1]);
      }
    }
    
    // Handle direct time ago formats
    if (text.includes('ago')) {
      return this.parseTimeAgo(text);
    }
    
    // Use the unified time parsing for all formats
    return this.parseTimeAgo(text);
  }
  
  // OPTIMIZED: Unified time parsing with better regex and reduced duplication
  private parseTimeAgo(timeStr: string): string {
    const text = timeStr.toLowerCase().trim();
    
    // Single regex pattern for all time formats
    const timePatterns = [
      { pattern: /(\d+)\s*hour/, unit: 'hour', plural: 'hours' },
      { pattern: /(\d+)\s*day/, unit: 'day', plural: 'days' },
      { pattern: /(\d+)\s*week/, unit: 'week', plural: 'weeks' },
      { pattern: /(\d+)\s*month/, unit: 'month', plural: 'months' }
    ];
    
    for (const { pattern, unit, plural } of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        const count = parseInt(match[1]);
        return count === 1 ? `1 ${unit} ago` : `${count} ${plural} ago`;
      }
    }
    
    return timeStr;
  }

  // Extract job ID from LinkedIn job URLs for consistent job linking
  private extractJobId(): string | null {
    const jobIdSelectors = this.selectors.jobId || [];
    
    // First try to find job ID in href attributes
    for (const selector of jobIdSelectors) {
      const element = document.querySelector(selector) as HTMLAnchorElement;
      if (element && element.href) {
        // Extract job ID from LinkedIn job URL pattern: /jobs/view/4297522295/
        const match = element.href.match(/\/jobs\/view\/(\d+)\/?/);
        if (match) {
          console.log(`✅ LinkedIn: Found job ID ${match[1]} from href: ${element.href}`);
          return match[1];
        }
      }
    }
    
    // Fallback: try to extract from current URL if it's a job view page
    const currentUrlMatch = window.location.href.match(/\/jobs\/view\/(\d+)\/?/);
    if (currentUrlMatch) {
      console.log(`✅ LinkedIn: Found job ID ${currentUrlMatch[1]} from current URL`);
      return currentUrlMatch[1];
    }
    
    // Fallback: try to extract from data-job-id attribute
    for (const selector of jobIdSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const dataJobId = element.getAttribute('data-job-id');
        if (dataJobId) {
          console.log(`✅ LinkedIn: Found job ID ${dataJobId} from data-job-id attribute`);
          return dataJobId;
        }
      }
    }
    
    console.log('❌ LinkedIn: No job ID found');
    return null;
  }

  // Capitalize salary type to match other job fields
  private capitalizeSalaryType(salaryType: string): string {
    switch (salaryType.toLowerCase()) {
      case 'annual':
        return 'Annual';
      case 'hourly':
        return 'Hourly';
      case 'monthly':
        return 'Monthly';
      case 'contract':
        return 'Contract';
      default:
        return 'Annual'; // Default fallback
    }
  }

  // Safe salary extraction with validation
  private extractSalarySafely(container: Element): string | null {
    const salaryText = this.extractTextWithFallbacks(container, this.selectors.salary);
    
    if (!salaryText) {
      return null;
    }
    
    // Validate that the text actually contains salary information
    if (this.isValidSalaryText(salaryText)) {
      return salaryText;
    }
    
    return null;
  }

  // Validate salary text to ensure it's actually salary information
  private isValidSalaryText(text: string): boolean {
    const cleanText = text.toLowerCase().trim();
    
    // Must contain a dollar sign
    if (!cleanText.includes('$')) {
      return false;
    }
    
    // Must contain salary indicators
    const salaryIndicators = [
      'per year', 'annually', 'yearly', '/yr', 'per hour', 'hourly', '/hr',
      'per month', 'monthly', '/mo', 'salary', 'compensation', 'pay'
    ];
    
    const hasSalaryIndicator = salaryIndicators.some(indicator => 
      cleanText.includes(indicator)
    );
    
    if (!hasSalaryIndicator) {
      return false;
    }
    
    // Must contain numbers
    if (!/\d/.test(cleanText)) {
      return false;
    }
    
    // Reject job type indicators (like "Remote", "Onsite", "Hybrid")
    const jobTypeIndicators = [
      'remote', 'onsite', 'on-site', 'hybrid', 'full-time', 'part-time',
      'contract', 'temporary', 'permanent', 'internship', 'freelance'
    ];
    
    const hasJobTypeIndicator = jobTypeIndicators.some(indicator => 
      cleanText.includes(indicator)
    );
    
    if (hasJobTypeIndicator) {
      return false;
    }
    
    return true;
  }
}


