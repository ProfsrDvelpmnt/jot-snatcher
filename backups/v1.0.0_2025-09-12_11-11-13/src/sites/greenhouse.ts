// Greenhouse-specific extraction logic
import { JobExtractor } from '@/utils/enhancedJobExtractor';
import { SiteConfig } from '@/utils/siteDetector';
import { JobData } from '@/types';

export class GreenhouseExtractor extends JobExtractor {
  constructor() {
    super({
      domain: 'greenhouse.io',
      name: 'Greenhouse',
      enabled: true,
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
      description: description || '',
      // Legacy fields
      jobId: this.generateJobId(),
      companyName: organization.trim(),
      jobLink: window.location.href,
      jobTitle: position.trim(),
      workType: 'Not specified',
      ageOfPosting: 'Unknown',
      numApplicants: 'Unknown'
    };
  }

  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `JOB-${timestamp}-${random}`;
  }
}
