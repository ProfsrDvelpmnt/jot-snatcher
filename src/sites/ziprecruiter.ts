// ZipRecruiter-specific extraction logic
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
          'p.text-primary.normal-case', // Location in detail panel
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
        ]
      }
    });
  }

  extractJobData(): JobData | null {
    const jobContainer = this.findJobContainer();
    if (!jobContainer) return null;

    // For ZipRecruiter, we need to handle the specific case where we're on a listing page
    // but the job details are in a right panel that may not be visible yet
    let position = this.extractTextWithFallbacks(jobContainer, this.selectors.title);
    let organization = this.extractTextWithFallbacks(jobContainer, this.selectors.company);

    // If we're on a listing page and didn't find the details, try to find them in the right panel
    if ((!position || !organization) && jobContainer === document.body) {
      // Look for the job detail panel specifically
      const detailPanel = document.querySelector('[data-testid="job-details-scroll-container"]');
      if (detailPanel) {
        console.log('Found ZipRecruiter job detail panel, extracting from there...');
        position = this.extractTextWithFallbacks(detailPanel, this.selectors.title);
        organization = this.extractTextWithFallbacks(detailPanel, this.selectors.company);
      }
    }

    if (!position || !organization) {
      console.log('ZipRecruiter: Missing required fields', { position, organization });
      return null;
    }

    const locationText = this.extractTextWithFallbacks(jobContainer, this.selectors.location);
    const salaryText = this.extractTextWithFallbacks(jobContainer, this.selectors.salary);
    const description = this.extractTextWithFallbacks(jobContainer, this.selectors.description);

    // Parse location and environment from location text
    let location = locationText || 'Not specified';
    let environment = 'Not specified';
    
    if (locationText) {
      // Look for environment indicators after city/state (e.g., "Philadelphia, PA • On-site")
      const environmentMatch = locationText.match(/(?:•|,|\s+)(On-site|Remote|Hybrid|In-person|Work from home|WFH)(?:\s|$)/i);
      if (environmentMatch) {
        environment = environmentMatch[1];
        // Remove the environment part from location to keep it clean
        location = locationText.replace(/(?:•|,|\s+)(On-site|Remote|Hybrid|In-person|Work from home|WFH)(?:\s|$)/i, '').trim();
      }
    }

    // Extract additional job details from the flex container
    let jobType = 'Not specified';
    let postedDate = null;
    let extractedSalary = salaryText;

    const detailsContainer = jobContainer.querySelector('div.flex.flex-col.gap-y-8');
    if (detailsContainer) {
      const detailItems = detailsContainer.querySelectorAll('p.text-primary.normal-case.text-body-md');
      
      for (const item of detailItems) {
        const text = item.textContent?.trim() || '';
        
        // Check for salary (contains $ or /hr)
        if (text.includes('$') || text.includes('/hr') || text.includes('salary')) {
          extractedSalary = text;
          console.log('Found salary:', text);
        }
        // Check for job type
        else if (text === 'Full-time' || text === 'Part-time' || text === 'Contract' || text === 'Temporary' || text === 'Other') {
          jobType = text;
          console.log('Found job type:', text);
        }
        // Check for posted date
        else if (text.includes('Posted') || text.includes('ago') || text.includes('day') || text.includes('week') || text.includes('month')) {
          postedDate = text;
          console.log('Found posted date:', text);
        }
      }
    }

    // Fallback: try to extract job type from location text if not found above
    if (jobType === 'Not specified') {
      const locationElement = jobContainer.querySelector('p.text-primary.normal-case');
      if (locationElement && locationElement.textContent?.includes('Full-time')) {
        jobType = 'Full-time';
      } else if (locationElement && locationElement.textContent?.includes('Part-time')) {
        jobType = 'Part-time';
      }
    }

    const parsedSalary = parseSalary(extractedSalary);
    
    // If environment wasn't found in location, try to detect from description as fallback
    if (environment === 'Not specified') {
      environment = this.detectEnvironmentFromDescription(description);
    }

    return {
      organization: organization.trim(),
      position: position.trim(),
      link: window.location.href,
      salary: parsedSalary.salary,
      salary_type: parsedSalary.salary_type,
      salary_min: parsedSalary.salary_min,
      salary_max: parsedSalary.salary_max,
      location: location || 'Not specified',
      type: jobType,
      environment: environment || 'Not specified',
      stage: 'Saved',
      source: 'ziprecruiter',
      job_site: 'ZipRecruiter',
      date_saved: new Date().toISOString(),
      date_posted: postedDate,
      job_posting_url: window.location.href,
      description: description || '',
      // Legacy fields
      jobId: this.generateJobId(),
      companyName: organization.trim(),
      jobLink: window.location.href,
      jobTitle: position.trim(),
      workType: jobType,
      ageOfPosting: postedDate || 'Unknown',
      numApplicants: 'Unknown'
    };
  }

  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `JOB-${timestamp}-${random}`;
  }
}
