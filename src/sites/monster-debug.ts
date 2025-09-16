// Monster.com extraction logic with full debugging and fallback selectors
// This version includes all debugging code and fallback selectors for troubleshooting
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
          '.header-style__JobViewHeaderContainer-sc-ccb9c1ec-0', // Header container
          // Fallback selectors for troubleshooting
          '[data-testid="job-card"]', // Primary job card selector
          '.job-card', // Alternative job card class
          '.job-search-card', // Another possible class
          '.job-result', // Generic job result
          '[data-testid="job-result"]', // Alternative testid
          'article[data-testid*="job"]', // Article with job testid
          '.job-item', // Generic job item
          'li[data-testid*="job"]' // List item with job testid
        ],
        
        title: [
          '[data-testid="jobTitle"]',
          // Fallback selectors
          '.job-title a',
          '.job-title',
          'h3 a',
          'h2 a',
          '.job-card-title a',
          '.job-search-card-title a',
          '[data-testid="job-title"] a',
          '[data-testid="job-title"]'
        ],
        
        company: [
          '[data-testid="company"]',
          // Fallback selectors
          '.company-name a',
          '.company-name',
          '.job-company a',
          '.job-company',
          '.job-card-company a',
          '.job-card-company',
          '[data-testid="company-name"] a',
          '[data-testid="company-name"]'
        ],
        
        location: [
          '[data-testid="jobDetailLocation"]',
          // Fallback selectors
          '[data-testid="job-location"]',
          '.job-location',
          '.job-card-location',
          '.location',
          '.job-search-card-location',
          '[data-testid="location"]'
        ],
        
        salary: [
          '.indexmodern__TagLabel-sc-6pvrvp-1', // Primary salary selector
          '.ds-tag-label', // Alternative class
          '.tag-sm', // Another possible class
          // Fallback selectors
          '[data-testid="job-salary"]',
          '.salary',
          '.job-salary',
          '.job-card-salary',
          '.compensation',
          '[data-testid="salary"]'
        ],
        
        jobType: [
          '[data-testid="job-type"]',
          '.job-type',
          '.employment-type',
          // Fallback selectors
          '.job-card-type',
          '[data-testid="employment-type"]'
        ],
        
        description: [
          '.code-styles__CodeContainer-sc-cee0f82f-0', // Primary description container
          '.code-component', // Alternative class
          // Fallback selectors
          '[data-testid="job-description"]',
          '.job-description',
          '.job-card-description',
          '.job-summary',
          '.description',
          '[data-testid="description"]'
        ],
        
        postedDate: [
          '[data-testid="jobDetailDateRecency"]',
          // Fallback selectors
          '[data-testid="job-posted"]',
          '.job-posted',
          '.job-date',
          '.posted-date',
          '.job-card-date',
          '[data-testid="posted-date"]'
        ],
        
        applyLink: [
          '[data-testid="apply-button"]',
          // Fallback selectors
          '.apply-button',
          '.job-apply a',
          '.job-card-apply a',
          'a[href*="apply"]',
          '[data-testid="job-title"] a'
        ],
        
        companyUrl: [
          'a[href*="/jobs/search?cn="]',
          '.company-link',
          '.job-company a'
        ],
        
        tags: [
          '[data-testid="jobCardTags"] li',
          '.job-tags li',
          '.skill-tags li',
          '.job-skills li',
          '.tags li',
          '.job-card-tags li'
        ]
      }
    });
  }

  extractJobData(): JobData | null {
    // Monster loads content dynamically, wait for it
    if (!this.waitForContent()) {
      console.log('❌ Monster: Content not loaded within timeout');
      return null;
    }

    const jobContainer = this.findJobContainer();
    if (!jobContainer) {
      console.log('❌ Monster: No job container found');
      console.log('🔍 Monster: Available containers on page:');
      console.log('  - [data-testid="svx-job-view-header-container-sticky-true"]:', document.querySelectorAll('[data-testid="svx-job-view-header-container-sticky-true"]').length);
      console.log('  - .jobview-container-styles__JobViewStickyHeader-sc-59e1f345-1:', document.querySelectorAll('.jobview-container-styles__JobViewStickyHeader-sc-59e1f345-1').length);
      console.log('  - [data-testid="job-view-header"]:', document.querySelectorAll('[data-testid="job-view-header"]').length);
      console.log('  - .header-style__JobViewHeaderContainer-sc-ccb9c1ec-0:', document.querySelectorAll('.header-style__JobViewHeaderContainer-sc-ccb9c1ec-0').length);
      console.log('  - [data-testid="job-card"]:', document.querySelectorAll('[data-testid="job-card"]').length);
      console.log('  - .job-card:', document.querySelectorAll('.job-card').length);
      console.log('  - .job-search-card:', document.querySelectorAll('.job-search-card').length);
      console.log('  - .job-result:', document.querySelectorAll('.job-result').length);
      console.log('  - [data-testid="job-result"]:', document.querySelectorAll('[data-testid="job-result"]').length);
      console.log('  - article[data-testid*="job"]:', document.querySelectorAll('article[data-testid*="job"]').length);
      console.log('  - .job-item:', document.querySelectorAll('.job-item').length);
      console.log('  - li[data-testid*="job"]:', document.querySelectorAll('li[data-testid*="job"]').length);
      console.log('  - [data-testid="jobTitle"]:', document.querySelectorAll('[data-testid="jobTitle"]').length);
      console.log('  - [data-testid="company"]:', document.querySelectorAll('[data-testid="company"]').length);
      console.log('  - [data-testid="job-location"]:', document.querySelectorAll('[data-testid="job-location"]').length);
      console.log('  - .job-title:', document.querySelectorAll('.job-title').length);
      console.log('  - .company-name:', document.querySelectorAll('.company-name').length);
      console.log('  - .job-location:', document.querySelectorAll('.job-location').length);
      console.log('  - .code-styles__CodeContainer-sc-cee0f82f-0:', document.querySelectorAll('.code-styles__CodeContainer-sc-cee0f82f-0').length);
      console.log('  - .code-component:', document.querySelectorAll('.code-component').length);
      console.log('  - .description-styles__DescriptionTitle-sc-6e39f119-1:', document.querySelectorAll('.description-styles__DescriptionTitle-sc-6e39f119-1').length);
      console.log('🔍 Monster: Page URL:', window.location.href);
      console.log('🔍 Monster: Page title:', document.title);
      return null;
    }

    console.log('✅ Monster: Job container found:', jobContainer);

    // Debug: Check for description elements
    console.log('🔍 Monster: Description elements found:');
    console.log('  - .code-styles__CodeContainer-sc-cee0f82f-0:', document.querySelectorAll('.code-styles__CodeContainer-sc-cee0f82f-0').length);
    console.log('  - .code-component:', document.querySelectorAll('.code-component').length);
    console.log('  - .description-styles__DescriptionTitle-sc-6e39f119-1:', document.querySelectorAll('.description-styles__DescriptionTitle-sc-6e39f119-1').length);
    
    // Debug: Check for posted date elements
    console.log('🔍 Monster: Posted date elements found:');
    console.log('  - [data-testid="jobHeaderDetails"]:', document.querySelectorAll('[data-testid="jobHeaderDetails"]').length);
    console.log('  - [data-testid="jobDetailDateRecency"]:', document.querySelectorAll('[data-testid="jobDetailDateRecency"]').length);
    console.log('  - [data-testid="job-posted"]:', document.querySelectorAll('[data-testid="job-posted"]').length);
    console.log('  - .job-posted:', document.querySelectorAll('.job-posted').length);
    
    // Debug: Check for salary elements
    console.log('🔍 Monster: Salary elements found:');
    console.log('  - .indexmodern__TagLabel-sc-6pvrvp-1:', document.querySelectorAll('.indexmodern__TagLabel-sc-6pvrvp-1').length);
    console.log('  - .ds-tag-label:', document.querySelectorAll('.ds-tag-label').length);
    console.log('  - .tag-sm:', document.querySelectorAll('.tag-sm').length);
    console.log('  - [data-testid="job-salary"]:', document.querySelectorAll('[data-testid="job-salary"]').length);
    console.log('  - .salary:', document.querySelectorAll('.salary').length);

    // Extract basic job information
    const position = this.extractTextWithFallbacks(jobContainer, this.selectors.title);
    const organization = this.extractTextWithFallbacks(jobContainer, this.selectors.company);

    console.log('🔍 Monster: Extracted data:');
    console.log('  - Position:', position);
    console.log('  - Organization:', organization);

    if (!position || !organization) {
      console.log('❌ Monster: Missing required fields (position or organization)');
      return null;
    }

    const location = this.extractTextWithFallbacks(jobContainer, this.selectors.location);
    const salaryText = this.extractTextWithFallbacks(jobContainer, this.selectors.salary);
    
    console.log('🔍 Monster: Salary extracted:', salaryText);
    
    // Extract description from anywhere on the page, not just the job container
    const baseDescription = this.extractDescriptionFromPage();
    
    console.log('🔍 Monster: Base description preview:', baseDescription.substring(0, 200) + '...');
    
    const jobType = this.extractTextWithFallbacks(jobContainer, this.selectors.jobType);
    
    // If no job type found from selectors, try to extract from description
    const finalJobType = jobType || this.extractJobTypeFromDescription(baseDescription);
    
    console.log('🔍 Monster: Job type extracted:', finalJobType);
    
    // Extract posted date from anywhere on the page, not just the job container
    const postedDate = this.extractPostedDateFromPage();
     
    console.log('🔍 Monster: Posted date extracted:', postedDate);
    console.log('🔍 Monster: Parsed date:', this.parseRelativeTime(postedDate));

    // Extract enhanced data using the provided logic
    const enhancedData = this.extractEnhancedJobData(jobContainer);
    const descriptionData = this.extractJobDescriptionData(baseDescription);

    // Build enhanced description with structured data
    const enhancedDescription = this.buildEnhancedDescription(baseDescription, enhancedData, descriptionData);

    // Parse salary and detect environment
    const parsedSalary = parseSalary(salaryText);
    const environment = this.detectEnvironmentFromWorkSchedule(descriptionData.workSchedule) || 
                      this.detectEnvironmentFromDescription(enhancedDescription);

    return {
      organization: organization.trim(),
      position: position.trim(),
      link: window.location.href,
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
      job_posting_url: window.location.href,
      description: enhancedDescription,
      // Legacy fields
      jobId: this.generateJobId(),
      companyName: organization.trim(),
      jobLink: window.location.href,
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
   * This is needed because the description might not be within the job container
   */
  private extractDescriptionFromPage(): string {
    console.log('🔍 Monster: Extracting description from page...');
    
    // Try to find the description element anywhere on the page
    for (const selector of this.selectors.description) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`✅ Monster: Found description with selector: ${selector}`);
        const text = element.textContent?.trim() || '';
        console.log(`📝 Monster: Description length: ${text.length} characters`);
        return text;
      }
    }
    
    console.log('❌ Monster: No description found on page');
    return '';
  }

  /**
   * Extract job type from description text
   * This is a fallback when specific job type selectors don't find anything
   */
  private extractJobTypeFromDescription(description: string): string | null {
    if (!description) return null;
    
    console.log('🔍 Monster: Searching description for job type...');
    
    const lowerDescription = description.toLowerCase();
    
    // Common job type patterns in descriptions
    const jobTypePatterns = [
      // Full-time patterns
      { pattern: /full[-\s]?time/i, type: 'Full Time' },
      { pattern: /fulltime/i, type: 'Full Time' },
      { pattern: /permanent/i, type: 'Full Time' },
      
      // Part-time patterns
      { pattern: /part[-\s]?time/i, type: 'Part Time' },
      { pattern: /parttime/i, type: 'Part Time' },
      { pattern: /pt\b/i, type: 'Part Time' },
      
      // Contract patterns
      { pattern: /contract/i, type: 'Contract' },
      { pattern: /contractor/i, type: 'Contract' },
      { pattern: /freelance/i, type: 'Contract' },
      { pattern: /consultant/i, type: 'Contract' },
      
      // Temporary patterns
      { pattern: /temporary/i, type: 'Temporary' },
      { pattern: /temp\b/i, type: 'Temporary' },
      { pattern: /interim/i, type: 'Temporary' },
      
      // Internship patterns
      { pattern: /internship/i, type: 'Internship' },
      { pattern: /intern\b/i, type: 'Internship' },
      { pattern: /co[-\s]?op/i, type: 'Internship' },
      
      // Seasonal patterns
      { pattern: /seasonal/i, type: 'Seasonal' },
      { pattern: /season\b/i, type: 'Seasonal' },
      
      // Remote patterns
      { pattern: /remote/i, type: 'Remote' },
      { pattern: /work from home/i, type: 'Remote' },
      { pattern: /wfh\b/i, type: 'Remote' },
      
      // Hybrid patterns
      { pattern: /hybrid/i, type: 'Hybrid' },
      { pattern: /flexible/i, type: 'Hybrid' }
    ];
    
    // Search for job type patterns
    for (const { pattern, type } of jobTypePatterns) {
      if (pattern.test(description)) {
        console.log(`✅ Monster: Found job type in description: ${type}`);
        return type;
      }
    }
    
    console.log('❌ Monster: No job type found in description');
    return null;
  }

  /**
   * Extract posted date from anywhere on the page
   * This is needed because the posted date might not be within the job container
   */
  private extractPostedDateFromPage(): string {
    console.log('🔍 Monster: Extracting posted date from page...');
    
    // First try to find the jobHeaderDetails container and look within it
    const jobHeaderDetails = document.querySelector('[data-testid="jobHeaderDetails"]');
    if (jobHeaderDetails) {
      console.log('✅ Monster: Found jobHeaderDetails container');
      const dateElement = jobHeaderDetails.querySelector('[data-testid="jobDetailDateRecency"]');
      if (dateElement) {
        const text = dateElement.textContent?.trim() || '';
        console.log(`📅 Monster: Found posted date in jobHeaderDetails: ${text}`);
        return text;
      }
    }
    
    // Fallback: Try to find the posted date element anywhere on the page
    const postedDateSelectors = this.selectors.postedDate || [];
    for (const selector of postedDateSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`✅ Monster: Found posted date with selector: ${selector}`);
        const text = element.textContent?.trim() || '';
        console.log(`📅 Monster: Posted date: ${text}`);
        return text;
      }
    }
    
    console.log('❌ Monster: No posted date found on page');
    return '';
  }

  /**
   * Override parseRelativeTime to handle Monster.com specific date formats
   */
  protected parseRelativeTime(timeText: string): string | null {
    if (!timeText) return null;
    
    console.log('🔍 Monster: Parsing relative time:', timeText);
    
    const now = new Date();
    const lower = timeText.toLowerCase().trim();
    
    // Handle "X days ago" format
    if (lower.includes('days ago')) {
      const days = parseInt(lower.match(/(\d+)\s*days?\s*ago/)?.[1] || '0');
      if (days > 0) {
        now.setDate(now.getDate() - days);
        console.log(`📅 Monster: Parsed ${days} days ago as:`, now.toISOString());
        return now.toISOString();
      }
    }
    
    // Handle "X hours ago" format
    if (lower.includes('hours ago')) {
      const hours = parseInt(lower.match(/(\d+)\s*hours?\s*ago/)?.[1] || '0');
      if (hours > 0) {
        now.setHours(now.getHours() - hours);
        console.log(`📅 Monster: Parsed ${hours} hours ago as:`, now.toISOString());
        return now.toISOString();
      }
    }
    
    // Handle "today"
    if (lower.includes('today')) {
      console.log('📅 Monster: Parsed today as:', now.toISOString());
      return now.toISOString();
    }
    
    // Handle "yesterday"
    if (lower.includes('yesterday')) {
      now.setDate(now.getDate() - 1);
      console.log('📅 Monster: Parsed yesterday as:', now.toISOString());
      return now.toISOString();
    }
    
    // Handle "X weeks ago" format
    if (lower.includes('weeks ago')) {
      const weeks = parseInt(lower.match(/(\d+)\s*weeks?\s*ago/)?.[1] || '0');
      if (weeks > 0) {
        now.setDate(now.getDate() - (weeks * 7));
        console.log(`📅 Monster: Parsed ${weeks} weeks ago as:`, now.toISOString());
        return now.toISOString();
      }
    }
    
    console.log('❌ Monster: Could not parse date:', timeText);
    return null;
  }

  /**
   * Build enhanced description with structured data and tags
   */
  private buildEnhancedDescription(baseDescription: string, enhancedData: any, descriptionData: any): string {
    let enhanced = '';
    
    // Add tags section FIRST
    if (enhancedData.tags?.length) {
      enhanced += `Tags: ${enhancedData.tags.join(', ')}\n\n`;
    }
    
    // Add button states (for user decision) SECOND
    const buttonStates = [];
    if (enhancedData.hasApplyButton) buttonStates.push('Apply Available');
    if (enhancedData.hasSaveButton) buttonStates.push('Save Available');
    if (enhancedData.hasDislikeButton) buttonStates.push('Dislike Available');
    
    if (buttonStates.length > 0) {
      enhanced += `Job Actions: ${buttonStates.join(', ')}\n\n`;
    }
    
    // Add the main description text THIRD
    if (baseDescription) {
      enhanced += baseDescription;
    }
    
    // Add structured sections AFTER the main description
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
   * Extract enhanced job data from HTML container
   * Based on the provided JavaScript extraction logic
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

      // Extract company URL from company link
      const companyLinkElement = container.querySelector('a[href*="/jobs/search?cn="]');
      if (companyLinkElement) {
        enhancedData.companyUrl = companyLinkElement.getAttribute('href');
      }

      // Extract company badge/logo info
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
   * Based on the provided JavaScript description extraction logic
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
      // Create a temporary DOM element to parse the description
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
        // Split by bullet points or line breaks and clean up
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

      // Extract pay range details/explanation
      const payDetailsMatch = description.match(/This pay rate\/range represents[^]*?(?=Christiana Care Health|$)/i);
      if (payDetailsMatch) {
        descriptionData.payRangeDetails = payDetailsMatch[0].trim();
      }

      // Extract equal opportunity statement
      const eoMatch = description.match(/Christiana Care Health System is an equal opportunity employer[^]*/i);
      if (eoMatch) {
        descriptionData.equalOpportunity = eoMatch[0].trim();
      }

      // Extract additional notes (like travel requirements, job codes, etc.)
      const additionalNotes = [];
      
      // Look for travel requirements
      const travelMatch = description.match(/\*\*[^]*?travel[^]*?\*\*/i);
      if (travelMatch) {
        additionalNotes.push(travelMatch[0].trim());
      }

      // Look for job codes like #LI-CS1
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
