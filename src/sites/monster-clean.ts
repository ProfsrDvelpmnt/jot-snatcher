// Clean Monster.com extraction logic - focused on primary functionality
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
        // Primary selectors - most likely to work
        jobContainer: [
          '[data-testid="svx-job-view-header-container-sticky-true"]', // Job view header container
          '.jobview-container-styles__JobViewStickyHeader-sc-59e1f345-1', // Job view sticky header
          '[data-testid="job-view-header"]', // Job view header
          '.header-style__JobViewHeaderContainer-sc-ccb9c1ec-0' // Header container
        ],
        
        title: [
          '[data-testid="jobTitle"]'
        ],
        
        company: [
          '[data-testid="company"]'
        ],
        
        location: [
          '[data-testid="jobDetailLocation"]'
        ],
        
        salary: [
          '.indexmodern__TagLabel-sc-6pvrvp-1', // Primary salary selector
          '.ds-tag-label', // Alternative class
          '.tag-sm' // Another possible class
        ],
        
        jobType: [
          '[data-testid="job-type"]',
          '.job-type',
          '.employment-type'
        ],
        
        description: [
          '.code-styles__CodeContainer-sc-cee0f82f-0', // Primary description container
          '.code-component' // Alternative class
        ],
        
        postedDate: [
          '[data-testid="jobDetailDateRecency"]'
        ],
        
        applyLink: [
          '[data-testid="apply-button"]'
        ],
        
        jobId: [
          '[data-testid="JobCardButton"][data-job-id]',
          'button[data-job-id]',
          '[data-job-id]'
        ],
        
        companyUrl: [
          'a[href*="/jobs/search?cn="]'
        ],
        
        tags: [
          '[data-testid="jobCardTags"] li'
        ]
      }
    });
  }

  extractJobData(): JobData | null {
    // Wait for content to load
    if (!this.waitForContent()) {
      console.log('❌ Monster: Content not loaded within timeout');
      return null;
    }

    const jobContainer = this.findJobContainer();
    if (!jobContainer) {
      console.log('❌ Monster: No job container found');
      return null;
    }

    // Extract basic job information
    const position = this.extractTextWithFallbacks(jobContainer, this.selectors.title);
    const organization = this.extractTextWithFallbacks(jobContainer, this.selectors.company);

    if (!position || !organization) {
      console.log('❌ Monster: Missing required fields (position or organization)');
      return null;
    }

    const location = this.extractTextWithFallbacks(jobContainer, this.selectors.location);
    const salaryText = this.extractTextWithFallbacks(jobContainer, this.selectors.salary);
    
    // Extract description from anywhere on the page
    const baseDescription = this.extractDescriptionFromPage();
    
    // Extract job type with fallback to description
    const jobType = this.extractTextWithFallbacks(jobContainer, this.selectors.jobType);
    const finalJobType = jobType || this.extractJobTypeFromDescription(baseDescription);
    
    // Extract posted date from anywhere on the page
    const postedDate = this.extractPostedDateFromPage();

    // Extract job ID and create proper job URL
    const jobId = this.extractJobId();
    const jobUrl = jobId ? `https://www.monster.com/profile/job-tracker/${jobId}` : window.location.href;

    // Extract enhanced data
    const enhancedData = this.extractEnhancedJobData(jobContainer);
    const descriptionData = this.extractJobDescriptionData(baseDescription);

    // Build enhanced description
    const enhancedDescription = this.buildEnhancedDescription(baseDescription, enhancedData, descriptionData);

    // Parse salary and detect environment
    const parsedSalary = parseSalary(salaryText);
    const environment = this.detectEnvironmentFromWorkSchedule(descriptionData.workSchedule) || 
                      this.detectEnvironmentFromDescription(enhancedDescription);

    return {
      organization: organization.trim(),
      position: position.trim(),
      link: jobUrl,
      salary: parsedSalary.salary,
      salary_type: parsedSalary.salary_type,
      salary_min: parsedSalary.salary_min,
      salary_max: parsedSalary.salary_max,
      location: location || 'Not specified',
      type: this.normalizeJobType(finalJobType || '') || 'Not specified',
      environment: environment || 'Not specified',
      stage: 'Saved',
      source: 'monster',
      job_site: 'Monster',
      date_saved: new Date().toISOString(),
      date_posted: this.parseRelativeTime(postedDate),
      job_posting_url: jobUrl,
      description: enhancedDescription,
      // Legacy fields
      jobId: this.generateJobId(),
      companyName: organization.trim(),
      jobLink: jobUrl,
      jobTitle: position.trim(),
      workType: this.normalizeJobType(finalJobType || '') || 'Not specified',
      ageOfPosting: postedDate || 'Unknown',
      numApplicants: 'Unknown'
    };
  }

  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `JOB-${timestamp}-${random}`;
  }

  /**
   * Extract description from anywhere on the page
   */
  private extractDescriptionFromPage(): string {
    for (const selector of this.selectors.description) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent?.trim() || '';
      }
    }
    return '';
  }

  /**
   * Extract job type from description text as fallback
   */
  private extractJobTypeFromDescription(description: string): string | null {
    if (!description) return null;
    
    const jobTypePatterns = [
      { pattern: /full[-\s]?time/i, type: 'Full Time' },
      { pattern: /part[-\s]?time/i, type: 'Part Time' },
      { pattern: /contract/i, type: 'Contract' },
      { pattern: /temporary/i, type: 'Temporary' },
      { pattern: /internship/i, type: 'Internship' },
      { pattern: /remote/i, type: 'Remote' },
      { pattern: /hybrid/i, type: 'Hybrid' }
    ];
    
    for (const { pattern, type } of jobTypePatterns) {
      if (pattern.test(description)) {
        return type;
      }
    }
    
    return null;
  }

  /**
   * Extract job ID from the job card button
   */
  private extractJobId(): string | null {
    // First try to find the job card button with data-job-id
    const jobIdSelectors = this.selectors.jobId || [];
    for (const selector of jobIdSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const jobId = element.getAttribute('data-job-id');
        if (jobId) {
          console.log('✅ Monster: Found job ID:', jobId);
          return jobId;
        }
      }
    }
    
    console.log('❌ Monster: No job ID found');
    return null;
  }

  /**
   * Extract posted date from anywhere on the page
   */
  private extractPostedDateFromPage(): string {
    // First try to find the jobHeaderDetails container
    const jobHeaderDetails = document.querySelector('[data-testid="jobHeaderDetails"]');
    if (jobHeaderDetails) {
      const dateElement = jobHeaderDetails.querySelector('[data-testid="jobDetailDateRecency"]');
      if (dateElement) {
        return dateElement.textContent?.trim() || '';
      }
    }
    
    // Fallback: try other selectors
    const postedDateSelectors = this.selectors.postedDate || [];
    for (const selector of postedDateSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent?.trim() || '';
      }
    }
    
    return '';
  }

  /**
   * Override parseRelativeTime for Monster.com specific formats
   */
  protected parseRelativeTime(timeText: string): string | null {
    if (!timeText) return null;
    
    const now = new Date();
    const lower = timeText.toLowerCase().trim();
    
    if (lower.includes('days ago')) {
      const days = parseInt(lower.match(/(\d+)\s*days?\s*ago/)?.[1] || '0');
      if (days > 0) {
        now.setDate(now.getDate() - days);
        return now.toISOString();
      }
    }
    
    if (lower.includes('hours ago')) {
      const hours = parseInt(lower.match(/(\d+)\s*hours?\s*ago/)?.[1] || '0');
      if (hours > 0) {
        now.setHours(now.getHours() - hours);
        return now.toISOString();
      }
    }
    
    if (lower.includes('today')) {
      return now.toISOString();
    }
    
    if (lower.includes('yesterday')) {
      now.setDate(now.getDate() - 1);
      return now.toISOString();
    }
    
    if (lower.includes('weeks ago')) {
      const weeks = parseInt(lower.match(/(\d+)\s*weeks?\s*ago/)?.[1] || '0');
      if (weeks > 0) {
        now.setDate(now.getDate() - (weeks * 7));
        return now.toISOString();
      }
    }
    
    return null;
  }

  /**
   * Build enhanced description with structured data
   */
  private buildEnhancedDescription(baseDescription: string, enhancedData: any, descriptionData: any): string {
    let enhanced = '';
    
    // Add tags section first
    if (enhancedData.tags?.length) {
      enhanced += `Tags: ${enhancedData.tags.join(', ')}\n\n`;
    }
    
    // Add button states
    const buttonStates = [];
    if (enhancedData.hasApplyButton) buttonStates.push('Apply Available');
    if (enhancedData.hasSaveButton) buttonStates.push('Save Available');
    if (enhancedData.hasDislikeButton) buttonStates.push('Dislike Available');
    
    if (buttonStates.length > 0) {
      enhanced += `Job Actions: ${buttonStates.join(', ')}\n\n`;
    }
    
    // Add the main description text
    if (baseDescription) {
      enhanced += baseDescription;
    }
    
    // Add structured sections
    if (descriptionData.workSchedule) {
      enhanced += `\n\nWork Schedule: ${descriptionData.workSchedule}`;
    }
    
    if (descriptionData.principalDuties?.length) {
      enhanced += `\n\nPrincipal Duties:\n${descriptionData.principalDuties.map((d: string) => `• ${d}`).join('\n')}`;
    }
    
    if (descriptionData.education?.length) {
      enhanced += `\n\nEducation Requirements:\n${descriptionData.education.map((e: string) => `• ${e}`).join('\n')}`;
    }
    
    if (descriptionData.payRange) {
      enhanced += `\n\nPay Range: ${descriptionData.payRange}`;
    }
    
    if (descriptionData.payRangeDetails) {
      enhanced += `\n${descriptionData.payRangeDetails}`;
    }
    
    if (descriptionData.equalOpportunity) {
      enhanced += `\n\n${descriptionData.equalOpportunity}`;
    }
    
    if (descriptionData.additionalNotes?.length) {
      enhanced += `\n\nAdditional Notes:\n${descriptionData.additionalNotes.join('\n')}`;
    }
    
    return enhanced.trim();
  }

  /**
   * Detect work environment from work schedule
   */
  private detectEnvironmentFromWorkSchedule(workSchedule: string | null): string | null {
    if (!workSchedule) return null;
    
    const lower = workSchedule.toLowerCase();
    
    if (lower.includes('remote') || lower.includes('work from home')) {
      return 'Remote';
    } else if (lower.includes('hybrid')) {
      return 'Hybrid';
    } else if (lower.includes('on-site') || lower.includes('in-office') || lower.includes('in-person')) {
      return 'In-Person';
    }
    
    return null;
  }

  /**
   * Extract enhanced job data (tags, buttons, company info)
   */
  private extractEnhancedJobData(container: Element): {
    tags: string[];
    hasApplyButton: boolean;
    hasSaveButton: boolean;
    hasDislikeButton: boolean;
    companyUrl: string | null;
    companyBadge: string | null;
    companyInitial: string | null;
  } {
    const enhancedData = {
      tags: [] as string[],
      hasApplyButton: false,
      hasSaveButton: false,
      hasDislikeButton: false,
      companyUrl: null as string | null,
      companyBadge: null as string | null,
      companyInitial: null as string | null
    };

    try {
      // Extract tags
      const tagsContainer = container.querySelector('[data-testid="jobCardTags"]');
      if (tagsContainer) {
        const tagElements = tagsContainer.querySelectorAll('li');
        enhancedData.tags = Array.from(tagElements).map(tag => tag.textContent?.trim()).filter(Boolean);
      }

      // Check for action buttons
      enhancedData.hasApplyButton = !!container.querySelector('[data-testid="apply-button"]');
      enhancedData.hasSaveButton = !!container.querySelector('[data-testid="job-save-button"]');
      enhancedData.hasDislikeButton = !!container.querySelector('[data-testid="job-dislike-button"]');

      // Extract company URL
      const companyLinkElement = container.querySelector('a[href*="/jobs/search?cn="]');
      if (companyLinkElement) {
        enhancedData.companyUrl = companyLinkElement.getAttribute('href');
      }

      // Extract company badge info
      const companyBadge = container.querySelector('[data-testid="jobHeaderCompanyBadge"]');
      if (companyBadge) {
        enhancedData.companyBadge = companyBadge.getAttribute('title');
        enhancedData.companyInitial = companyBadge.textContent?.trim();
      }

    } catch (error) {
      console.error('Error extracting enhanced job data:', error);
    }

    return enhancedData;
  }

  /**
   * Extract structured job description data
   */
  private extractJobDescriptionData(description: string): {
    workSchedule: string | null;
    principalDuties: string[];
    education: string[];
    payRange: string | null;
    payRangeDetails: string | null;
    equalOpportunity: string | null;
    additionalNotes: string[];
  } {
    const descriptionData = {
      workSchedule: null as string | null,
      principalDuties: [] as string[],
      education: [] as string[],
      payRange: null as string | null,
      payRangeDetails: null as string | null,
      equalOpportunity: null as string | null,
      additionalNotes: [] as string[]
    };

    if (!description) return descriptionData;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(description, 'text/html');

      // Extract work schedule
      const scheduleMatch = description.match(/Work Schedule[:\s]*([^]*?)(?=PRINCIPAL DUTIES|Education|$)/i);
      if (scheduleMatch) {
        descriptionData.workSchedule = scheduleMatch[1].trim().replace(/\s+/g, ' ');
      }

      // Extract principal duties from lists
      const dutyLists = doc.querySelectorAll('ul li, ol li');
      dutyLists.forEach(li => {
        const duty = li.textContent?.trim();
        if (duty && duty.length > 10) {
          descriptionData.principalDuties.push(duty);
        }
      });

      // Extract education requirements
      const educationSection = description.match(/Education and Experience Required?[:\s]*([^]*?)(?=Apply online|Hourly Pay|#LI-|$)/i);
      if (educationSection) {
        const educationText = educationSection[1];
        const educationItems = educationText.split(/•|\n|(?=A graduate|RN license|Two years|BSN)/).filter(item => {
          const cleaned = item.trim();
          return cleaned && cleaned.length > 10 && !cleaned.includes('Apply online');
        });
        descriptionData.education = educationItems.map(item => item.trim());
      }

      // Extract pay range
      const payRangeMatch = description.match(/Hourly Pay Range[:\s]*\$?([\d.,\s-]+)/i);
      if (payRangeMatch) {
        descriptionData.payRange = payRangeMatch[1].trim();
      }

      // Extract pay range details
      const payDetailsMatch = description.match(/This pay rate\/range represents[^]*?(?=Christiana Care Health|$)/i);
      if (payDetailsMatch) {
        descriptionData.payRangeDetails = payDetailsMatch[0].trim();
      }

      // Extract equal opportunity statement
      const eoMatch = description.match(/Christiana Care Health System is an equal opportunity employer[^]*/i);
      if (eoMatch) {
        descriptionData.equalOpportunity = eoMatch[0].trim();
      }

      // Extract additional notes
      const additionalNotes = [];
      
      const travelMatch = description.match(/\*\*[^]*?travel[^]*?\*\*/i);
      if (travelMatch) {
        additionalNotes.push(travelMatch[0].trim());
      }

      const jobCodeMatch = description.match(/#[A-Z0-9-]+/g);
      if (jobCodeMatch) {
        additionalNotes.push(...jobCodeMatch);
      }

      descriptionData.additionalNotes = additionalNotes;

    } catch (error) {
      console.error('Error extracting job description data:', error);
    }

    return descriptionData;
  }
}
