// ZipRecruiter-specific extraction logic - OPTIMIZED VERSION
import { JobExtractor } from '@/utils/enhancedJobExtractor';
import { SiteConfig } from '@/utils/siteDetector';
import { JobData } from '@/types';
import { parseSalary } from '@/utils/salaryParser';

export class ZipRecruiterExtractor extends JobExtractor {
  constructor() {
    super({
      domain: 'ziprecruiter.com',
      name: 'ZipRecruiter',
      enabled: true,
      selectors: {
        // Job container - handle both listing page and detail panel
        jobContainer: [
          '[data-testid="job-details-scroll-container"]', // Job detail panel
          '.job_content', 
          '.jobDescriptionSection', 
          '[data-test="job-description"]',
          'body' // Fallback for listing page
        ],
        
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

        // Job ID selectors for consistent job URLs
        jobId: [
          'a[href*="/jobs/view/"]',
          '.job_link[href*="/jobs/view/"]',
          '[data-job-id]',
          'a[data-test="job-title"][href*="/jobs/view/"]'
        ],

        // Posted date selectors
        postedDate: [
          '[data-test="job-posted"]',
          '.job_posted',
          '.posted_date'
        ]
      }
    });
  }

  extractJobData(): JobData | null {
    const jobContainer = this.findJobContainer();
    if (!jobContainer) return null;

    // Extract basic job information
    const position = this.extractPosition(jobContainer);
    const organization = this.extractOrganization(jobContainer);
    
    if (!position || !organization) {
      console.log('ZipRecruiter: Missing required fields', { position, organization });
      return null;
    }

    // Extract additional job details
    const location = this.extractLocation(jobContainer);
    const salaryText = this.extractSalary(jobContainer);
    const description = this.extractDescription(jobContainer);
    const jobType = this.extractJobType(jobContainer);
    const postedDate = this.extractPostedDate(jobContainer);
    const jobId = this.extractJobId();

    // Parse salary and environment
    const parsedSalary = parseSalary(salaryText);
    const environment = this.extractEnvironment(location, description);

    // Create consistent job URL
    const jobUrl = jobId ? `https://www.ziprecruiter.com/jobs/view/${jobId}/` : window.location.href;

    return {
      organization: organization.trim(),
      position: position.trim(),
      link: jobUrl,
      salary: parsedSalary.salary,
      salary_type: parsedSalary.salary_type,
      salaryTypeDisplay: this.capitalizeSalaryType(parsedSalary.salary_type),
      salary_min: parsedSalary.salary_min,
      salary_max: parsedSalary.salary_max,
      location: this.cleanLocation(location),
      type: jobType || 'Not specified',
      environment: environment || 'Not specified',
      stage: 'Saved',
      source: 'ziprecruiter',
      job_site: 'ZipRecruiter',
      date_saved: new Date().toISOString(),
      date_posted: postedDate,
      job_posting_url: jobUrl,
      description: description || '',
      // Legacy fields
      jobId: this.generateJobId(),
      companyName: organization.trim(),
      jobLink: jobUrl,
      jobTitle: position.trim(),
      workType: jobType || 'Not specified',
      ageOfPosting: postedDate || 'Unknown',
      numApplicants: 'Unknown'
    };
  }

  // OPTIMIZED: Extract position with fallback logic
  private extractPosition(jobContainer: Element): string | null {
    let position = this.extractTextWithFallbacks(jobContainer, this.selectors.title);

    // If we're on a listing page and didn't find the details, try the detail panel
    if (!position && jobContainer === document.body) {
      const detailPanel = document.querySelector('[data-testid="job-details-scroll-container"]');
      if (detailPanel) {
        console.log('Found ZipRecruiter job detail panel, extracting position...');
        position = this.extractTextWithFallbacks(detailPanel, this.selectors.title);
      }
    }

    return position;
  }

  // OPTIMIZED: Extract organization with fallback logic
  private extractOrganization(jobContainer: Element): string | null {
    let organization = this.extractTextWithFallbacks(jobContainer, this.selectors.company);

    // If we're on a listing page and didn't find the details, try the detail panel
    if (!organization && jobContainer === document.body) {
      const detailPanel = document.querySelector('[data-testid="job-details-scroll-container"]');
      if (detailPanel) {
        console.log('Found ZipRecruiter job detail panel, extracting organization...');
        organization = this.extractTextWithFallbacks(detailPanel, this.selectors.company);
      }
    }

    return organization;
  }

  // OPTIMIZED: Extract location and parse environment
  private extractLocation(jobContainer: Element): string | null {
    return this.extractTextWithFallbacks(jobContainer, this.selectors.location);
  }

  // OPTIMIZED: Extract salary with enhanced logic
  private extractSalary(jobContainer: Element): string | null {
    let salaryText = this.extractTextWithFallbacks(jobContainer, this.selectors.salary);

    // Enhanced salary extraction from details container
    const detailsContainer = jobContainer.querySelector('div.flex.flex-col.gap-y-8');
    if (detailsContainer) {
      const detailItems = detailsContainer.querySelectorAll('p.text-primary.normal-case.text-body-md');
      
      for (const item of detailItems) {
        const text = item.textContent?.trim() || '';
        if (text.includes('$') || text.includes('/hr') || text.includes('salary')) {
          salaryText = text;
          console.log('Found salary in details:', text);
          break;
        }
      }
    }

    return salaryText;
  }

  // OPTIMIZED: Extract description
  private extractDescription(jobContainer: Element): string | null {
    return this.extractTextWithFallbacks(jobContainer, this.selectors.description);
  }

  // OPTIMIZED: Extract job type with enhanced logic
  private extractJobType(jobContainer: Element): string | null {
    const detailsContainer = jobContainer.querySelector('div.flex.flex-col.gap-y-8');
    if (detailsContainer) {
      const detailItems = detailsContainer.querySelectorAll('p.text-primary.normal-case.text-body-md');
      
      for (const item of detailItems) {
        const text = item.textContent?.trim() || '';
        // Map ZipRecruiter job types to standard types
        if (text === 'Full-time') {
          console.log('Found job type:', text);
          return 'Full-time';
        } else if (text === 'Part-time') {
          console.log('Found job type:', text);
          return 'Part-time';
        } else if (text === 'Contractor') {
          console.log('Found job type: Contractor -> Contract');
          return 'Contract';
        } else if (text === 'Contract') {
          console.log('Found job type:', text);
          return 'Contract';
        } else if (text === 'Temporary') {
          console.log('Found job type:', text);
          return 'Temporary';
        } else if (text === 'Other') {
          console.log('Found job type:', text);
          return 'Other';
        }
      }
    }

    // Fallback: check location text
    const locationElement = jobContainer.querySelector('p.text-primary.normal-case');
    if (locationElement) {
      const locationText = locationElement.textContent || '';
      if (locationText.includes('Full-time')) return 'Full-time';
      if (locationText.includes('Part-time')) return 'Part-time';
      if (locationText.includes('Contractor')) return 'Contract';
    }

    return null;
  }

  // OPTIMIZED: Extract posted date
  private extractPostedDate(jobContainer: Element): string | null {
    // Try specific posted date selectors first
    let postedDate = this.extractTextWithFallbacks(jobContainer, this.selectors.postedDate);
    
    if (postedDate) return postedDate;

    // Fallback: check details container
    const detailsContainer = jobContainer.querySelector('div.flex.flex-col.gap-y-8');
    if (detailsContainer) {
      const detailItems = detailsContainer.querySelectorAll('p.text-primary.normal-case.text-body-md');
      
      for (const item of detailItems) {
        const text = item.textContent?.trim() || '';
        if (text.includes('Posted') || text.includes('ago') || text.includes('day') || text.includes('week') || text.includes('month')) {
          console.log('Found posted date:', text);
          return text;
        }
      }
    }

    return null;
  }

  // NEW: Extract job ID for consistent job URLs
  private extractJobId(): string | null {
    const jobIdSelectors = this.selectors.jobId || [];
    
    // First try to find job ID in href attributes
    for (const selector of jobIdSelectors) {
      const element = document.querySelector(selector) as HTMLAnchorElement;
      if (element && element.href) {
        // Extract job ID from ZipRecruiter job URL pattern: /jobs/view/12345/
        const match = element.href.match(/\/jobs\/view\/(\d+)\/?/);
        if (match) {
          console.log(`✅ ZipRecruiter: Found job ID ${match[1]} from href: ${element.href}`);
          return match[1];
        }
      }
    }
    
    // Fallback: try to extract from current URL if it's a job view page
    const currentUrlMatch = window.location.href.match(/\/jobs\/view\/(\d+)\/?/);
    if (currentUrlMatch) {
      console.log(`✅ ZipRecruiter: Found job ID ${currentUrlMatch[1]} from current URL`);
      return currentUrlMatch[1];
    }
    
    // Fallback: try to extract from data-job-id attribute
    for (const selector of jobIdSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const dataJobId = element.getAttribute('data-job-id');
        if (dataJobId) {
          console.log(`✅ ZipRecruiter: Found job ID ${dataJobId} from data-job-id attribute`);
          return dataJobId;
        }
      }
    }
    
    console.log('❌ ZipRecruiter: No job ID found');
    return null;
  }

  // OPTIMIZED: Extract environment from location and description
  private extractEnvironment(location: string | null, description: string | null): string | null {
    if (location) {
      // Look for environment indicators after city/state (e.g., "Philadelphia, PA • On-site")
      const environmentMatch = location.match(/(?:•|,|\s+)(On-site|Remote|Hybrid|In-person|Work from home|WFH)(?:\s|$)/i);
      if (environmentMatch) {
        return environmentMatch[1];
      }
    }

    // Fallback: detect from description
    if (description) {
      return this.detectEnvironmentFromDescription(description);
    }

    return null;
  }

  // OPTIMIZED: Clean location text by removing environment indicators
  private cleanLocation(location: string | null): string {
    if (!location) return 'Not specified';
    
    // Remove environment indicators to keep location clean
    return location.replace(/(?:•|,|\s+)(On-site|Remote|Hybrid|In-person|Work from home|WFH)(?:\s|$)/i, '').trim() || 'Not specified';
  }

  // NEW: Capitalize salary type to match other job fields
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

  // Legacy method for backward compatibility
  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `JOB-${timestamp}-${random}`;
  }
}
