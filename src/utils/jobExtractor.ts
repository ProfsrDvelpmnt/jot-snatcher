// Job data extraction engine
import { SiteConfig, JobSelectors } from './siteDetector';
import { JobData } from '@/types';
import { parseSalary, formatWorkType, formatEnvironment } from './salaryParser';
import { detectJobSite } from './jobSiteDetector';
import { convertToKanbanFormat, validateKanbanJobData } from './kanbanSchema';
import { cleanJobUrl } from './urlCleaner';

export class JobExtractor {
  private config: SiteConfig;
  private selectors: JobSelectors;

  constructor(config: SiteConfig) {
    this.config = config;
    this.selectors = config.selectors;
  }

  // Extract job data from the current page
  extractJobData(): JobData | null {
    try {
      // Find the main job container
      const jobContainer = this.findJobContainer();
      if (!jobContainer) {
        console.log('No job container found');
        return null;
      }

      // Extract basic fields
      const jobTitle = this.extractText(jobContainer, this.selectors.title);
      const companyName = this.extractText(jobContainer, this.selectors.company);
      const location = this.extractText(jobContainer, this.selectors.location);
      const salaryText = this.extractText(jobContainer, this.selectors.salary || '') || '';
      const workTypeText = this.extractWorkType(jobContainer);
      const environmentText = this.extractEnvironment(jobContainer);
      const postedDateText = this.extractText(jobContainer, this.selectors.postedDate || '') || '';
      
      // Validate required fields
      if (!jobTitle || !companyName) {
        console.log('Missing required fields:', { jobTitle, companyName });
        return null;
      }

      // Parse salary information
      const parsedSalary = parseSalary(salaryText);
      
      // Detect job site information
      const jobSiteInfo = detectJobSite(window.location.href);
      
      // Parse posted date
      const datePosted = this.parsePostedDate(postedDateText);
      
      // Build job data with new schema
      const jobData: JobData = {
        // Core job information
        organization: companyName,
        position: jobTitle,
        link: cleanJobUrl(window.location.href),
        salary: parsedSalary.salary,
        salary_type: parsedSalary.salary_type,
        salary_min: parsedSalary.salary_min,
        salary_max: parsedSalary.salary_max,
        location: location,
        type: formatWorkType(workTypeText),
        environment: formatEnvironment(environmentText),
        stage: 'Saved', // Default stage for new jobs
        source: jobSiteInfo.source,
        job_site: jobSiteInfo.job_site,
        
        // Dates
        date_saved: new Date().toISOString(),
        date_posted: datePosted,
        
        // Optional fields (set to null for now)
        job_posting_url: cleanJobUrl(window.location.href),
        resume_url: null,
        contact_message_url: null,
        interview_status: null,
        date_applying: null,
        date_applied: null,
        date_contacted: null,
        date_interviewing: null,
        date_offer: null,
        date_negotiating: null,
        date_hired: null,
        date_archived: null,
        
        // Legacy fields for backward compatibility
        jobId: this.generateJobId(),
        companyName: companyName,
        jobLink: cleanJobUrl(window.location.href),
        jobTitle: jobTitle,
        workType: workTypeText,
        ageOfPosting: postedDateText,
        numApplicants: this.extractApplicantCount(jobContainer),
        description: this.extractDescription(jobContainer)
      };

      return jobData as JobData;
    } catch (error) {
      console.error('Error extracting job data:', error);
      return null;
    }
  }

  // Find the main job container on the page
  private findJobContainer(): Element | null {
    // Try the job container selector first
    if (this.selectors.jobContainer) {
      const containerSelectors = Array.isArray(this.selectors.jobContainer) 
        ? this.selectors.jobContainer 
        : [this.selectors.jobContainer];
      
      for (const selector of containerSelectors) {
        const container = document.querySelector(selector);
        if (container) return container;
      }
    }

    // Fallback: look for common job container patterns
    const fallbackSelectors = [
      '[data-testid*="job"]',
      '.job',
      '.job-listing',
      '.job-card',
      '.position',
      '.opening'
    ];

    for (const selector of fallbackSelectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    return null;
  }

  // Extract text content from an element
  private extractText(container: Element, selector: string | string[] | undefined): string {
    if (!selector) return '';

    const selectorArray = Array.isArray(selector) ? selector : [selector];
    
    for (const sel of selectorArray) {
      const element = container.querySelector(sel);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    return '';
  }

  // Extract job description (handle multiple possible selectors)
  private extractDescription(container: Element): string {
    const descriptionSelectors = [
      this.selectors.description,
      '.job-description',
      '.description',
      '[data-testid*="description"]',
      '.job-summary',
      '.job-details'
    ];

    for (const selector of descriptionSelectors) {
      if (!selector) continue;
      
      const selectorArray = Array.isArray(selector) ? selector : [selector];
      
      for (const sel of selectorArray) {
        const element = container.querySelector(sel);
        if (element) {
          // Get HTML content for rich descriptions
          return element.innerHTML || element.textContent?.trim() || '';
        }
      }
    }

    return '';
  }

  // Extract work type (full-time, part-time, contract, etc.)
  private extractWorkType(container: Element): string {
    const workTypeSelectors = [
      this.selectors.jobType,
      '[data-testid*="type"]',
      '.job-type',
      '.employment-type',
      '.work-type'
    ];

    for (const selector of workTypeSelectors) {
      if (!selector) continue;
      
      const selectorArray = Array.isArray(selector) ? selector : [selector];
      
      for (const sel of selectorArray) {
        const element = container.querySelector(sel);
        if (element) {
          const text = element.textContent?.trim() || '';
          return text; // Return raw text, will be formatted later
        }
      }
    }

    return 'Full Time'; // Default
  }

  // Extract remote work information
  private extractEnvironment(container: Element): string {
    const text = container.textContent?.toLowerCase() || '';
    
    if (text.includes('remote') && text.includes('hybrid')) {
      return 'Hybrid';
    } else if (text.includes('remote')) {
      return 'Remote';
    } else if (text.includes('on-site') || text.includes('onsite')) {
      return 'In-Person';
    }

    return 'In-Person'; // Default
  }

  // Extract number of applicants
  private extractApplicantCount(container: Element): string {
    const applicantSelectors = [
      '[data-testid*="applicant"]',
      '.applicants',
      '.candidate-count',
      '.job-applicants'
    ];

    for (const selector of applicantSelectors) {
      if (!selector) continue;
      
      const element = container.querySelector(selector);
      if (element) {
        const text = element.textContent?.trim() || '';
        const match = text.match(/(\d+)/);
        if (match) {
          return match[1];
        }
      }
    }

    return 'Unknown';
  }

  // Parse posted date from text
  private parsePostedDate(dateText: string): string | null {
    if (!dateText || dateText.toLowerCase().includes('unknown')) {
      return null;
    }

    try {
      const now = new Date();
      const text = dateText.toLowerCase().trim();
      
      // Handle "X days ago" format
      const daysAgoMatch = text.match(/(\d+)\s*days?\s*ago/);
      if (daysAgoMatch) {
        const days = parseInt(daysAgoMatch[1]);
        const date = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
        return date.toISOString();
      }
      
      // Handle "X hours ago" format
      const hoursAgoMatch = text.match(/(\d+)\s*hours?\s*ago/);
      if (hoursAgoMatch) {
        const hours = parseInt(hoursAgoMatch[1]);
        const date = new Date(now.getTime() - (hours * 60 * 60 * 1000));
        return date.toISOString();
      }
      
      // Handle "X weeks ago" format
      const weeksAgoMatch = text.match(/(\d+)\s*weeks?\s*ago/);
      if (weeksAgoMatch) {
        const weeks = parseInt(weeksAgoMatch[1]);
        const date = new Date(now.getTime() - (weeks * 7 * 24 * 60 * 60 * 1000));
        return date.toISOString();
      }
      
      // Handle "X months ago" format
      const monthsAgoMatch = text.match(/(\d+)\s*months?\s*ago/);
      if (monthsAgoMatch) {
        const months = parseInt(monthsAgoMatch[1]);
        const date = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
        return date.toISOString();
      }
      
      // Try to parse as a regular date
      const parsedDate = new Date(dateText);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing posted date:', error);
      return null;
    }
  }

  // Generate a unique job ID
  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `JOB-${timestamp}-${random}`;
  }

  // Check if the current page has job listings
  hasJobListings(): boolean {
    return this.findJobContainer() !== null;
  }

  // Get all job listings on the page
  extractAllJobs(): JobData[] {
    const jobs: JobData[] = [];
    
    if (this.selectors.jobList) {
      const containerSelectors = Array.isArray(this.selectors.jobContainer) 
        ? this.selectors.jobContainer 
        : [this.selectors.jobContainer];
      
      const jobElements = document.querySelectorAll(containerSelectors[0]);
      
      jobElements.forEach((jobElement, index) => {
        // Create a temporary extractor for each job
        const tempExtractor = new JobExtractor({
          ...this.config,
          selectors: {
            ...this.selectors,
            jobContainer: this.selectors.jobContainer
          }
        });
        
        // Override the findJobContainer method to use the specific element
        const originalMethod = tempExtractor.findJobContainer;
        tempExtractor.findJobContainer = () => jobElement;
        
        const jobData = tempExtractor.extractJobData();
        if (jobData) {
          jobs.push(jobData);
        }
      });
    }
    
    return jobs;
  }

  // Extract job data and convert to kanban format
  extractKanbanJobData(): any | null {
    const jobData = this.extractJobData();
    if (!jobData) return null;

    // Convert to kanban format
    const kanbanData = convertToKanbanFormat(jobData);
    
    // Validate the data
    const validation = validateKanbanJobData(kanbanData);
    if (!validation.isValid) {
      console.warn('Kanban job data validation failed:', validation.errors);
      // Return the data anyway, but log the warnings
    }

    return kanbanData;
  }

  // Extract all jobs and convert to kanban format
  extractAllKanbanJobs(): any[] {
    const jobs = this.extractAllJobs();
    return jobs.map(job => convertToKanbanFormat(job));
  }
}
