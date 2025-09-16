// Clean LinkedIn extraction logic - focused on primary functionality
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
        // Primary job container selectors
        jobContainer: [
          '.job-details-jobs-unified-top-card__container--two-pane', // Individual job page
          '.job-details-jobs-unified-top-card', // Individual job page
          '.jobs-search__job-details--container' // Right panel on search results
        ],
        
        title: [
          '.job-details-jobs-unified-top-card__job-title h1 a',
          '.job-details-jobs-unified-top-card__job-title a'
        ],
        
        company: [
          '.job-details-jobs-unified-top-card__company-name a',
          '.job-details-jobs-unified-top-card__company-name'
        ],
        
        location: [
          '.job-details-jobs-unified-top-card__tertiary-description-container .tvm__text--low-emphasis:first-of-type',
          '.job-details-jobs-unified-top-card__tertiary-description-container span:first-of-type'
        ],
        
        salary: [
          '.job-details-fit-level-preferences button .tvm__text--low-emphasis strong',
          '.job-details-fit-level-preferences button'
        ],
        
        jobType: [
          '.job-details-fit-level-preferences button'
        ],
        
        description: [
          'div.jobs-box__html-content.jobs-description-content__text--stretch#job-details',
          '.jobs-box__html-content.jobs-description-content__text--stretch',
          '.jobs-description-content__text--stretch'
        ],
        
        postedDate: [
          '.job-details-jobs-unified-top-card__tertiary-description-container .tvm__text--low-emphasis:nth-of-type(3)',
          '.job-details-jobs-unified-top-card__tertiary-description-container span:nth-of-type(3)'
        ],
        
        applicants: [
          '.job-details-jobs-unified-top-card__tertiary-description-container .tvm__text--positive',
          '.job-details-jobs-unified-top-card__tertiary-description-container .tvm__text--low-emphasis:nth-of-type(5)'
        ]
      }
    });
  }

  extractJobData(): JobData | null {
    // Wait for job details to load
    if (!this.waitForJobContainer()) {
      console.log('❌ LinkedIn: Content not loaded within timeout');
      return null;
    }

    const jobContainer = this.findJobContainer();
    if (!jobContainer) {
      console.log('❌ LinkedIn: No job container found');
      return null;
    }

    // Extract basic information
    const position = this.extractTextWithFallbacks(jobContainer, this.selectors.title);
    const organization = this.extractTextWithFallbacks(jobContainer, this.selectors.company);
    
    if (!position || !organization) {
      console.log('❌ LinkedIn: Missing required fields (position or organization)');
      return null;
    }

    const location = this.extractTextWithFallbacks(jobContainer, this.selectors.location);
    const salaryText = this.extractTextWithFallbacks(jobContainer, this.selectors.salary);
    const description = this.extractDescriptionWithFormatting(jobContainer);
    
    // Parse job type and environment from preferences
    const { jobType, environment } = this.parseLinkedInJobPreferences(jobContainer);
    
    // Parse salary
    const parsedSalary = parseSalary(salaryText);
    
    // Extract posting date and applicants
    const postingAge = this.extractPostingAge(jobContainer);
    const applicantCount = this.extractApplicantCount(jobContainer);

    return {
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
      // Legacy fields
      jobId: this.generateJobId(),
      companyName: organization.trim(),
      jobLink: window.location.href,
      jobTitle: position.trim(),
      workType: jobType || 'Not specified',
      ageOfPosting: postingAge ? this.formatRelativeTime(postingAge) : 'Unknown',
      numApplicants: applicantCount || 'Unknown'
    };
  }

  private waitForJobContainer(timeout: number = 5000): boolean {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const containerSelectors = Array.isArray(this.selectors.jobContainer) 
        ? this.selectors.jobContainer 
        : [this.selectors.jobContainer];
      
      for (const containerSelector of containerSelectors) {
        const container = document.querySelector(containerSelector);
        if (container) {
          const titleSelectors = Array.isArray(this.selectors.title) 
            ? this.selectors.title 
            : [this.selectors.title];
          
          for (const titleSelector of titleSelectors) {
            const title = container.querySelector(titleSelector);
            if (title && title.textContent?.trim()) {
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
    
    return false;
  }

  private parseLinkedInJobPreferences(container: Element): { jobType: string; environment: string } {
    let jobType = 'Not specified';
    let environment = 'Not specified';
    
    const preferenceButtons = container.querySelectorAll('.job-details-fit-level-preferences button');
    
    preferenceButtons.forEach(button => {
      const text = button.textContent?.toLowerCase() || '';
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
    const timeText = this.extractTextWithFallbacks(container, this.selectors.postedDate);
    return timeText ? timeText.trim() : null;
  }

  private extractApplicantCount(container: Element): string | null {
    const applicantText = this.extractTextWithFallbacks(container, this.selectors.applicants);
    return applicantText ? applicantText.trim() : null;
  }

  private extractDescriptionWithFormatting(container: Element): string {
    const descriptionSelectors = Array.isArray(this.selectors.description) 
      ? this.selectors.description 
      : [this.selectors.description];
    
    // First try within the job container
    for (const selector of descriptionSelectors) {
      const element = container.querySelector(selector);
      if (element) {
        return element.innerHTML || element.textContent || '';
      }
    }
    
    // If not found in container, try searching the entire document
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.innerHTML || element.textContent || '';
      }
    }
    
    return '';
  }

  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `JOB-${timestamp}-${random}`;
  }

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
    
    // Handle specific time formats
    if (text.includes('hour')) {
      const match = text.match(/(\d+)\s*hour/);
      if (match) {
        const hours = parseInt(match[1]);
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
      }
    }
    
    if (text.includes('day')) {
      const match = text.match(/(\d+)\s*day/);
      if (match) {
        const days = parseInt(match[1]);
        return days === 1 ? '1 day ago' : `${days} days ago`;
      }
    }
    
    if (text.includes('week')) {
      const match = text.match(/(\d+)\s*week/);
      if (match) {
        const weeks = parseInt(match[1]);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
      }
    }
    
    if (text.includes('month')) {
      const match = text.match(/(\d+)\s*month/);
      if (match) {
        const months = parseInt(match[1]);
        return months === 1 ? '1 month ago' : `${months} months ago`;
      }
    }
    
    return timeText;
  }
  
  private parseTimeAgo(timeStr: string): string {
    const text = timeStr.toLowerCase().trim();
    
    if (text.includes('hour')) {
      const match = text.match(/(\d+)\s*hour/);
      if (match) {
        const hours = parseInt(match[1]);
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
      }
    }
    
    if (text.includes('day')) {
      const match = text.match(/(\d+)\s*day/);
      if (match) {
        const days = parseInt(match[1]);
        return days === 1 ? '1 day ago' : `${days} days ago`;
      }
    }
    
    if (text.includes('week')) {
      const match = text.match(/(\d+)\s*week/);
      if (match) {
        const weeks = parseInt(match[1]);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
      }
    }
    
    if (text.includes('month')) {
      const match = text.match(/(\d+)\s*month/);
      if (match) {
        const months = parseInt(match[1]);
        return months === 1 ? '1 month ago' : `${months} months ago`;
      }
    }
    
    return timeStr;
  }
}
