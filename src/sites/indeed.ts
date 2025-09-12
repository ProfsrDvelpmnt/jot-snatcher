// Indeed-specific extraction logic
import { JobExtractor } from '@/utils/enhancedJobExtractor';
import { SiteConfig } from '@/utils/siteDetector';
import { JobData } from '@/types';
import { parseSalary } from '@/utils/salaryParser';

export class IndeedExtractor extends JobExtractor {
  constructor() {
    super({
      name: 'Indeed',
      domain: 'indeed.com',
      enabled: true,
      selectors: {
        // Job containers - works for both listing and detail pages
        jobContainer: [
          '[data-jk]', // Job listing cards
          '.jobsearch-JobInfoHeader-title', // Job detail page
          'body' // Fallback for detail pages
        ],
        jobList: '#mosaic-provider-jobcards',
        
        // Job data selectors - with fallbacks for both page types
        title: [
          '.jobsearch-JobInfoHeader-title', // Detail page
          '[data-testid="job-title"] a', // Listing page (if exists)
          'h1' // Fallback
        ],
        company: [
          '[data-testid="company-name"]', // Listing page
          '[data-testid="inlineHeader-companyName"]', // Detail page
          '.jobsearch-CompanyInfoContainer a' // Alternative
        ],
        location: [
          '[data-testid="job-location"]', // Both pages
          '.jobsearch-JobInfoHeader-subtitle' // Detail page
        ],
        salary: [
          '[data-testid="attribute_snippet_testid"]', // Both pages
          '.jobsearch-JobMetadataHeader-item' // Detail page
        ],
        description: [
          '#jobDescriptionText', // Detail page
          '.jobsearch-JobComponent-description', // Detail page
          '[data-testid="job-description"]' // Listing page (if exists)
        ],
        applyLink: [
          '[data-testid="job-title"] a', // Listing page
          '.jobsearch-ApplyButton' // Detail page
        ],
        postedDate: [
          '[data-testid="myJobsStateDate"]', // Listing page
          '.jobsearch-JobMetadataHeader-item' // Detail page
        ],
        jobType: [
          '[data-testid="attribute_snippet_testid"]', // Both pages
          '.jobsearch-JobMetadataHeader-item' // Detail page
        ],
      }
    });
  }

  extractJobData(): JobData | null {
    // Check if we're on a job listing page or detail page
    const isJobListingPage = window.location.pathname.includes('/jobs');
    const isJobDetailPage = window.location.pathname.includes('/viewjob');
    
    if (isJobListingPage) {
      return this.extractFromJobListing();
    } else if (isJobDetailPage) {
      return this.extractFromJobDetail();
    } else {
      // Try both approaches
      return this.extractFromJobDetail() || this.extractFromJobListing();
    }
  }

  private extractFromJobListing(): JobData | null {
    // On job listing pages, check if there's a selected job detail panel first
    const selectedJobPanel = document.querySelector('#jobsearch-ViewjobPaneWrapper');
    
    if (selectedJobPanel) {
      // Extract from the selected job detail panel
      return this.extractFromSelectedJobPanel(selectedJobPanel);
    }
    
    // Fallback: extract from the first job card if no detail panel is visible
    const jobCards = document.querySelectorAll('[data-jk]');
    if (jobCards.length === 0) return null;

    const firstJobCard = jobCards[0] as HTMLElement;
    
    // Extract title from the job card link
    const title = firstJobCard.textContent?.trim() || '';
    if (!title) return null;

    // Try to find company name - look for it in the same row/container
    const jobCardContainer = firstJobCard.closest('.jobsearch-SerpJobCard') || 
                           firstJobCard.closest('[data-testid*="job"]') ||
                           firstJobCard.parentElement;
    
    let organization = '';
    if (jobCardContainer) {
      // Look for company name in various places
      const companyElement = jobCardContainer.querySelector('[data-testid="company-name"]') ||
                           jobCardContainer.querySelector('.companyName') ||
                           jobCardContainer.querySelector('[data-testid="inlineHeader-companyName"]');
      organization = companyElement?.textContent?.trim() || '';
    }

    // If we still don't have company, try to extract from the job card's data attributes
    if (!organization) {
      const companyName = firstJobCard.getAttribute('data-company-name') ||
                         firstJobCard.getAttribute('aria-label')?.split(' at ')[1]?.split(' - ')[0];
      organization = companyName || 'Unknown Company';
    }

    // Extract location - look in the job card container
    let location = '';
    if (jobCardContainer) {
      const locationElement = jobCardContainer.querySelector('[data-testid="job-location"]') ||
                            jobCardContainer.querySelector('.jobsearch-JobInfoHeader-subtitle');
      location = locationElement?.textContent?.trim() || '';
    }

    // Extract salary and job type from metadata
    let salaryText = '';
    let jobType = '';
    if (jobCardContainer) {
      const metadataElements = jobCardContainer.querySelectorAll('[data-testid="attribute_snippet_testid"]');
      metadataElements.forEach(el => {
        const text = el.textContent?.trim() || '';
        if (text.includes('$') || text.includes('salary') || text.includes('hour')) {
          salaryText = text;
        } else if (text.includes('Full-time') || text.includes('Part-time') || text.includes('Contract')) {
          jobType = text;
        }
      });
    }

    const parsedSalary = parseSalary(salaryText);
    const environment = this.detectEnvironmentFromDescription('');

    return {
      organization: organization.trim(),
      position: title.trim(),
      link: window.location.href,
      salary: parsedSalary.salary,
      salary_type: parsedSalary.salary_type,
      salary_min: parsedSalary.salary_min,
      salary_max: parsedSalary.salary_max,
      location: location || 'Not specified',
      type: this.normalizeJobType(jobType) || 'Not specified',
      environment: environment || 'Not specified',
      stage: 'Saved',
      source: 'indeed',
      job_site: 'Indeed',
      date_saved: new Date().toISOString(),
      date_posted: null,
      job_posting_url: window.location.href,
      description: '',
      // Legacy fields
      jobId: this.generateJobId(),
      companyName: organization.trim(),
      jobLink: window.location.href,
      jobTitle: title.trim(),
      workType: this.normalizeJobType(jobType) || 'Not specified',
      ageOfPosting: 'Unknown',
      numApplicants: 'Unknown'
    };
  }

  private extractFromSelectedJobPanel(panel: Element): JobData | null {
    // Extract title from the selected job panel
    const titleElement = panel.querySelector('.jobsearch-JobInfoHeader-title') ||
                        panel.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]') ||
                        panel.querySelector('h2');
    const title = titleElement?.textContent?.trim() || '';
    if (!title) return null;

    // Extract company name
    const companyElement = panel.querySelector('[data-testid="inlineHeader-companyName"]') ||
                          panel.querySelector('[data-testid="company-name"]') ||
                          panel.querySelector('.jobsearch-CompanyInfoContainer a');
    const organization = companyElement?.textContent?.trim() || 'Unknown Company';

    // Extract location - try multiple selectors
    let location = '';
    const locationElement = panel.querySelector('[data-testid="job-location"]') ||
                           panel.querySelector('[data-testid="inlineHeader-companyLocation"] [data-testid="job-location"]') ||
                           panel.querySelector('.jobsearch-JobInfoHeader-subtitle') ||
                           panel.querySelector('.css-1wbl7v6');
    location = locationElement?.textContent?.trim() || 'Not specified';

    // Extract salary and job type from the salary info section
    let salaryText = '';
    let jobType = '';
    
    // Try the salary info section first
    const salaryInfoElement = panel.querySelector('#salaryInfoAndJobType');
    if (salaryInfoElement) {
      const salaryElement = salaryInfoElement.querySelector('.css-1oc7tea');
      const jobTypeElement = salaryInfoElement.querySelector('.css-1u1g3ig');
      
      salaryText = salaryElement?.textContent?.trim() || '';
      jobType = jobTypeElement?.textContent?.trim() || '';
    }
    
    // If no salary found in salary info section, try other locations
    if (!salaryText) {
      // Look for salary in job details section
      const jobDetailsSection = panel.querySelector('#jobDetailsSection');
      if (jobDetailsSection) {
        const paySection = jobDetailsSection.querySelector('[aria-label="Pay"]');
        if (paySection) {
          const salaryElement = paySection.querySelector('[data-testid="list-item"] .css-1f1q1js');
          salaryText = salaryElement?.textContent?.trim() || '';
        }
      }
    }
    
    // If no job type found in salary info section, try other locations
    if (!jobType) {
      // Look for job type in job details section
      const jobDetailsSection = panel.querySelector('#jobDetailsSection');
      if (jobDetailsSection) {
        const jobTypeSection = jobDetailsSection.querySelector('[aria-label="Job type"]');
        if (jobTypeSection) {
          const jobTypeElement = jobTypeSection.querySelector('[data-testid="list-item"] .css-1f1q1js');
          jobType = jobTypeElement?.textContent?.trim() || '';
        }
      }
    }

    // Extract description
    const descriptionElement = panel.querySelector('#jobDescriptionText') ||
                             panel.querySelector('.jobsearch-JobComponent-description');
    const description = descriptionElement?.textContent?.trim() || '';

    const parsedSalary = parseSalary(salaryText);
    const environment = this.detectEnvironmentFromDescription(description);

    return {
      organization: organization.trim(),
      position: title.trim(),
      link: window.location.href,
      salary: parsedSalary.salary,
      salary_type: parsedSalary.salary_type,
      salary_min: parsedSalary.salary_min,
      salary_max: parsedSalary.salary_max,
      location: location || 'Not specified',
      type: this.normalizeJobType(jobType) || 'Not specified',
      environment: environment || 'Not specified',
      stage: 'Saved',
      source: 'indeed',
      job_site: 'Indeed',
      date_saved: new Date().toISOString(),
      date_posted: null,
      job_posting_url: window.location.href,
      description: description || '',
      // Legacy fields
      jobId: this.generateJobId(),
      companyName: organization.trim(),
      jobLink: window.location.href,
      jobTitle: title.trim(),
      workType: this.normalizeJobType(jobType) || 'Not specified',
      ageOfPosting: 'Unknown',
      numApplicants: 'Unknown'
    };
  }

  private extractFromJobDetail(): JobData | null {
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
      source: 'indeed',
      job_site: 'Indeed',
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
