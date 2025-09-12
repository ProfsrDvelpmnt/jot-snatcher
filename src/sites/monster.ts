// Monster-specific extraction logic
import { JobExtractor } from '@/utils/enhancedJobExtractor';
import { SiteConfig } from '@/utils/siteDetector';
import { JobData } from '@/types';
import { parseSalary } from '@/utils/salaryParser';

export class MonsterExtractor extends JobExtractor {
  constructor() {
    super({
      domain: 'monster.com',
      name: 'Monster',
      enabled: true,
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
      description: description || '',
      // Legacy fields
      jobId: this.generateJobId(),
      companyName: organization.trim(),
      jobLink: window.location.href,
      jobTitle: position.trim(),
      workType: this.normalizeJobType(jobType) || 'Not specified',
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
