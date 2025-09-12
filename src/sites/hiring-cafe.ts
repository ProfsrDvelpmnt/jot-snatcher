// Hiring.Cafe-specific extraction logic
import { JobExtractor } from '@/utils/enhancedJobExtractor';
import { SiteConfig } from '@/utils/siteDetector';
import { JobData } from '@/types';
import { parseSalary } from '@/utils/salaryParser';

export class HiringCafeExtractor extends JobExtractor {
  constructor() {
    super({
      domain: 'hiring.cafe',
      name: 'Hiring.Cafe',
      enabled: true,
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
