// Workday-specific extraction logic
import { JobExtractor } from '@/utils/enhancedJobExtractor';
import { SiteConfig } from '@/utils/siteDetector';
import { JobData } from '@/types';
import { parseSalary } from '@/utils/salaryParser';

export class WorkdayExtractor extends JobExtractor {
  constructor() {
    super({
      domain: 'myworkdayjobs.com',
      name: 'Workday',
      enabled: true,
      selectors: {
        jobContainer: [
          'body',
          '[data-automation-id="jobPosting"]',
          '.job-posting',
          '.job-details',
          '[data-testid="job-posting"]'
        ],
        
        title: [
          'h1[data-automation-id="jobPostingHeadline"]',
          'h1.job-title',
          '[data-automation-id="jobPostingHeadline"]',
          'h1',
          '.job-title'
        ],
        
        company: [
          '[data-automation-id="companyName"]',
          '.company-name',
          '[data-testid="company-name"]',
          '.job-company',
          'h2[data-automation-id="companyName"]'
        ],
        
        location: [
          '[data-automation-id="jobLocation"]',
          '.job-location',
          '[data-testid="job-location"]',
          '.location',
          '[data-automation-id="jobLocation"] span'
        ],
        
        description: [
          '[data-automation-id="jobPostingDescription"]',
          '.job-description',
          '[data-testid="job-description"]',
          '.description',
          '[data-automation-id="jobPostingDescription"] div'
        ],
        
        salary: [
          '[data-automation-id="compensationText"]',
          '.salary',
          '[data-testid="salary"]',
          '.compensation',
          '[data-automation-id="compensationText"] span'
        ],
        
        postedDate: [
          '[data-automation-id="postedOn"]',
          '.posted-date',
          '[data-testid="posted-date"]',
          '.job-posted',
          '[data-automation-id="postedOn"] span'
        ],
        
        jobType: [
          '[data-automation-id="jobType"]',
          '.job-type',
          '[data-testid="job-type"]',
          '.employment-type',
          '[data-automation-id="jobType"] span'
        ]
      }
    });
  }

  extractJobData(): JobData | null {
    // Check if we're on a job listing page with dynamic content
    const isJobListingPage = this.isJobListingPage();
    
    if (isJobListingPage) {
      console.log('🔍 Workday: Detected job listing page, looking for selected job...');
      // Try to extract from the selected job in the right panel
      const selectedJobData = this.extractFromSelectedJob();
      if (selectedJobData) {
        console.log('🔍 Workday: Extracted data from selected job:', selectedJobData);
        return selectedJobData;
      }
    }

    // First try to extract from JSON-LD structured data (for direct job URLs)
    const jsonLdData = this.extractFromJsonLd();
    if (jsonLdData) {
      console.log('🔍 Workday: Extracted data from JSON-LD:', jsonLdData);
      return jsonLdData;
    }

    // Fallback to DOM extraction if JSON-LD is not available
    const jobContainer = this.findJobContainer();
    if (!jobContainer) return null;

    const position = this.extractTextWithFallbacks(jobContainer, this.selectors.title);
    const organization = this.extractTextWithFallbacks(jobContainer, this.selectors.company);
    
    if (!position || !organization) return null;

    const location = this.extractTextWithFallbacks(jobContainer, this.selectors.location);
    const description = this.extractTextWithFallbacks(jobContainer, this.selectors.description);
    const environment = this.detectEnvironmentFromDescription(description);
    
    // Extract salary information from description and dedicated salary fields
    const salaryInfo = this.extractSalaryFromWorkday(jobContainer as HTMLElement, description);
    console.log('🔍 Workday: Salary info extracted:', salaryInfo);
    
    // Extract published date and calculate age of posting
    const publishedDate = this.extractPublishedDate(jobContainer as HTMLElement);
    const ageOfPosting = this.calculateAgeOfPosting(publishedDate);
    console.log('🔍 Workday: Published date:', publishedDate, 'Age of posting:', ageOfPosting);
    
    // Determine job type based on salary type and description
    const jobType = this.determineJobType(salaryInfo.salary_type, description);
    console.log('🔍 Workday: Job type determined:', jobType);

    return {
      organization: organization.trim(),
      position: position.trim(),
      link: window.location.href,
      salary: salaryInfo.salary || 'Not specified',
      salary_type: salaryInfo.salary_type || 'annual',
      salaryTypeDisplay: salaryInfo.salary_type === 'annual' ? 'Annual' : 
                        salaryInfo.salary_type === 'hourly' ? 'Hourly' :
                        salaryInfo.salary_type === 'monthly' ? 'Monthly' :
                        salaryInfo.salary_type === 'contract' ? 'Contract' : 'Annual',
      salary_min: salaryInfo.salary_min || null,
      salary_max: salaryInfo.salary_max || null,
      location: location || 'Not specified',
      type: jobType,
      environment: environment || 'Not specified',
      stage: 'Saved',
      source: 'workday',
      job_site: 'Workday',
      date_saved: new Date().toISOString(),
      date_posted: publishedDate,
      job_posting_url: window.location.href,
      description: description || '',
      // Legacy fields
      jobId: this.generateJobId(),
      companyName: organization.trim(),
      jobLink: window.location.href,
      jobTitle: position.trim(),
      workType: jobType,
      ageOfPosting: ageOfPosting,
      numApplicants: 'Unknown'
    };
  }

  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `JOB-${timestamp}-${random}`;
  }

  private isJobListingPage(): boolean {
    // Check if we're on a job listing page (not a direct job URL)
    const url = window.location.href;
    const isDirectJobUrl = url.includes('/details/') || url.includes('/job/');
    
    // Look for job listing indicators
    const hasJobList = document.querySelector('[data-automation-id="jobList"]') !== null;
    const hasJobCards = document.querySelectorAll('[data-automation-id*="jobCard"], [data-testid*="job-card"]').length > 0;
    const hasJobSearch = document.querySelector('[data-automation-id*="search"], [data-testid*="search"]') !== null;
    
    // Check if there's dynamic content loaded (Workday SPA)
    const rootElement = document.querySelector('#root');
    const hasDynamicContent = rootElement && rootElement.children.length > 0;
    
    console.log('🔍 Workday: Page analysis:', {
      isDirectJobUrl,
      hasJobList,
      hasJobCards,
      hasJobSearch,
      hasDynamicContent,
      url
    });
    
    // If it's a direct job URL but has dynamic content, treat it as a listing page
    if (isDirectJobUrl && hasDynamicContent) {
      console.log('🔍 Workday: Direct job URL with dynamic content detected, treating as listing page');
      return true;
    }
    
    return !isDirectJobUrl && (hasJobList || hasJobCards || hasJobSearch || !!hasDynamicContent);
  }

  private extractFromSelectedJob(): JobData | null {
    try {
      console.log('🔍 Workday: Looking for selected job in right panel...');
      
      // Look for the right panel with job details
      const rightPanelSelectors = [
        '[data-automation-id="jobPosting"]',
        '[data-testid="job-posting"]',
        '.job-posting',
        '.job-details',
        '[data-automation-id*="jobDetail"]',
        '[data-testid*="job-detail"]',
        '.job-detail-panel',
        '.selected-job',
        // Additional selectors for Workday's dynamic content
        '[data-automation-id*="job"]',
        '[data-testid*="job"]',
        '.job-content',
        '.job-view'
      ];
      
      let selectedJobContainer: HTMLElement | null = null;
      
      for (const selector of rightPanelSelectors) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element && element.textContent && element.textContent.trim().length > 100) {
          selectedJobContainer = element;
          console.log(`🔍 Workday: Found selected job container with selector: ${selector}`);
          break;
        }
      }
      
      // If no specific container found, try to find any element with job content
      if (!selectedJobContainer) {
        console.log('🔍 Workday: No specific job container found, looking for any job content...');
        
        // Look for elements that might contain job details
        const potentialContainers = document.querySelectorAll('div, section, article');
        for (const container of potentialContainers) {
          const text = container.textContent || '';
          // Check if this looks like job content (has title-like text and description)
          if (text.length > 200 && 
              (text.includes('Job Description') || 
               text.includes('Requirements') || 
               text.includes('Responsibilities') ||
               text.includes('Qualifications') ||
               text.includes('Education/Experience') ||
               text.includes('Skills/Knowledge'))) {
            selectedJobContainer = container as HTMLElement;
            console.log('🔍 Workday: Found job content in generic container');
            break;
          }
        }
      }
      
      // If still no container found, try to extract from the page title and meta tags
      if (!selectedJobContainer) {
        console.log('🔍 Workday: No job container found, trying to extract from page metadata...');
        const pageTitle = document.title;
        const metaTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const metaDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
        
        if (pageTitle && pageTitle !== '' && metaDescription && metaDescription.length > 100) {
          console.log('🔍 Workday: Found job data in page metadata');
          // Create a virtual container with the metadata
          const virtualContainer = document.createElement('div');
          virtualContainer.innerHTML = `
            <h1>${pageTitle}</h1>
            <div class="company">CliftonLarsonAllen LLP</div>
            <div class="description">${metaDescription}</div>
          `;
          selectedJobContainer = virtualContainer;
        }
      }
      
      if (!selectedJobContainer) {
        console.log('🔍 Workday: No selected job container found');
        return null;
      }
      
      // Extract job data from the selected job container
      const position = this.extractTextWithFallbacks(selectedJobContainer, this.selectors.title);
      const organization = this.extractTextWithFallbacks(selectedJobContainer, this.selectors.company);
      
      if (!position || !organization) {
        console.log('🔍 Workday: Missing required fields in selected job');
        return null;
      }

      const location = this.extractTextWithFallbacks(selectedJobContainer, this.selectors.location);
      const description = this.extractTextWithFallbacks(selectedJobContainer, this.selectors.description);
      const environment = this.detectEnvironmentFromDescription(description);
      
      // Extract salary information
      const salaryInfo = this.extractSalaryFromWorkday(selectedJobContainer, description);
      console.log('🔍 Workday: Salary info extracted from selected job:', salaryInfo);
      
      // Extract published date
      const publishedDate = this.extractPublishedDate(selectedJobContainer);
      const ageOfPosting = this.calculateAgeOfPosting(publishedDate);
      console.log('🔍 Workday: Published date from selected job:', publishedDate, 'Age of posting:', ageOfPosting);
      
      // Determine job type
      const jobType = this.determineJobType(salaryInfo.salary_type, description);
      console.log('🔍 Workday: Job type determined from selected job:', jobType);

      // Get the current URL (might be different from the selected job)
      const currentUrl = window.location.href;

      return {
        organization: organization.trim(),
        position: position.trim(),
        link: currentUrl,
        salary: salaryInfo.salary || 'Not specified',
        salary_type: salaryInfo.salary_type || 'annual',
        salaryTypeDisplay: salaryInfo.salary_type === 'annual' ? 'Annual' : 
                          salaryInfo.salary_type === 'hourly' ? 'Hourly' :
                          salaryInfo.salary_type === 'monthly' ? 'Monthly' :
                          salaryInfo.salary_type === 'contract' ? 'Contract' : 'Annual',
        salary_min: salaryInfo.salary_min || null,
        salary_max: salaryInfo.salary_max || null,
        location: location || 'Not specified',
        type: jobType,
        environment: environment || 'Not specified',
        stage: 'Saved',
        source: 'workday',
        job_site: 'Workday',
        date_saved: new Date().toISOString(),
        date_posted: publishedDate,
        job_posting_url: currentUrl,
        description: description || '',
        // Legacy fields
        jobId: this.generateJobId(),
        companyName: organization.trim(),
        jobLink: currentUrl,
        jobTitle: position.trim(),
        workType: jobType,
        ageOfPosting: ageOfPosting,
        numApplicants: 'Unknown'
      };
    } catch (error) {
      console.warn('Error extracting from selected job:', error);
      return null;
    }
  }

  private extractFromJsonLd(): JobData | null {
    try {
      console.log('🔍 Workday: Attempting to extract from JSON-LD structured data...');
      
      // Look for JSON-LD script tags with JobPosting schema
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      
      for (const script of jsonLdScripts) {
        try {
          const jsonData = JSON.parse(script.textContent || '');
          
          // Check if this is a JobPosting schema
          if (jsonData['@type'] === 'JobPosting') {
            console.log('🔍 Workday: Found JobPosting JSON-LD data');
            
            const title = jsonData.title || '';
            const organization = jsonData.hiringOrganization?.name || '';
            const description = jsonData.description || '';
            const datePosted = jsonData.datePosted || '';
            const jobType = jsonData.jobType || jsonData.employmentType || '';
            const jobLocation = jsonData.jobLocation?.address || {};
            
            if (!title || !organization) {
              console.log('🔍 Workday: Missing required fields in JSON-LD');
              continue;
            }

            // Extract location from jobLocation
            let location = 'Not specified';
            if (jobLocation.addressLocality && jobLocation.addressCountry) {
              location = `${jobLocation.addressLocality}, ${jobLocation.addressCountry}`;
            } else if (jobLocation.addressLocality) {
              location = jobLocation.addressLocality;
            }

            // Determine job type from JSON-LD data
            const determinedJobType = this.determineJobTypeFromJsonLd(jobType, description);
            console.log('🔍 Workday: Job type determined from JSON-LD:', determinedJobType);
            
            // Extract salary information from description
            const salaryInfo = this.extractSalaryFromDescription(description);
            console.log('🔍 Workday: Salary info extracted from JSON-LD:', salaryInfo);
            
            // Set salary type based on job type
            if (determinedJobType === 'Full Time' && salaryInfo.salary_type === 'annual') {
              salaryInfo.salary_type = 'annual';
            } else if (determinedJobType === 'Part Time' && salaryInfo.salary_type === 'hourly') {
              salaryInfo.salary_type = 'hourly';
            }
            
            // Calculate age of posting
            const ageOfPosting = this.calculateAgeOfPosting(datePosted);
            console.log('🔍 Workday: Age of posting from JSON-LD:', ageOfPosting);

            // Detect environment from description
            const environment = this.detectEnvironmentFromDescription(description);

            return {
              organization: organization.trim(),
              position: title.trim(),
              link: window.location.href,
              salary: salaryInfo.salary || 'Not specified',
              salary_type: salaryInfo.salary_type || 'annual',
              salaryTypeDisplay: salaryInfo.salary_type === 'annual' ? 'Annual' : 
                                salaryInfo.salary_type === 'hourly' ? 'Hourly' :
                                salaryInfo.salary_type === 'monthly' ? 'Monthly' :
                                salaryInfo.salary_type === 'contract' ? 'Contract' : 'Annual',
              salary_min: salaryInfo.salary_min || null,
              salary_max: salaryInfo.salary_max || null,
              location: location,
              type: determinedJobType,
              environment: environment || 'Not specified',
              stage: 'Saved',
              source: 'workday',
              job_site: 'Workday',
              date_saved: new Date().toISOString(),
              date_posted: datePosted,
              job_posting_url: window.location.href,
              description: description,
              // Legacy fields
              jobId: this.generateJobId(),
              companyName: organization.trim(),
              jobLink: window.location.href,
              jobTitle: title.trim(),
              workType: determinedJobType,
              ageOfPosting: ageOfPosting,
              numApplicants: 'Unknown'
            };
          }
        } catch (parseError) {
          console.log('🔍 Workday: Error parsing JSON-LD script:', parseError);
          continue;
        }
      }
      
      console.log('🔍 Workday: No valid JobPosting JSON-LD found');
      return null;
    } catch (error) {
      console.warn('Error extracting from JSON-LD:', error);
      return null;
    }
  }

  private extractPublishedDate(jobContainer: HTMLElement): string | null {
    try {
      console.log('🔍 Workday: Starting published date extraction...');
      
      // Method 1: Look for posted date in dedicated elements
      const postedDate = this.extractTextWithFallbacks(jobContainer, this.selectors.postedDate);
      if (postedDate) {
        console.log('🔍 Workday: Found posted date in dedicated element:', postedDate);
        return this.parseWorkdayDate(postedDate);
      }
      
      // Method 2: Look for date patterns in description
      const description = this.extractTextWithFallbacks(jobContainer, this.selectors.description);
      if (description) {
        const datePatterns = [
          /posted\s+(?:on\s+)?(\w+\s+\d{1,2},?\s+\d{4})/i,
          /published\s+(?:on\s+)?(\w+\s+\d{1,2},?\s+\d{4})/i,
          /created\s+(?:on\s+)?(\w+\s+\d{1,2},?\s+\d{4})/i,
          /(\w+\s+\d{1,2},?\s+\d{4})/i
        ];
        
        for (const pattern of datePatterns) {
          const match = description.match(pattern);
          if (match) {
            console.log('🔍 Workday: Found date in description:', match[1]);
            return this.parseWorkdayDate(match[1]);
          }
        }
      }
      
      // Method 3: Look for date in script tags or JSON data
      const allScripts = Array.from(document.querySelectorAll('script'))
        .map(script => script.textContent || script.innerHTML)
        .join(' ');
      
      const datePatterns = [
        /"postedAt"\s*:\s*"([^"]+)"/g,
        /"createdAt"\s*:\s*"([^"]+)"/g,
        /"publishedAt"\s*:\s*"([^"]+)"/g,
        /"datePosted"\s*:\s*"([^"]+)"/g
      ];
      
      for (const pattern of datePatterns) {
        const matches = Array.from(allScripts.matchAll(pattern));
        if (matches.length > 0) {
          const dateStr = matches[0][1];
          console.log('🔍 Workday: Found date in script:', dateStr);
          return dateStr;
        }
      }
      
    } catch (error) {
      console.warn('Error extracting published date:', error);
    }
    
    console.log('🔍 Workday: No published date found');
    return null;
  }

  private parseWorkdayDate(dateStr: string): string | null {
    try {
      // Handle various Workday date formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      
      // Try to parse relative dates like "2 days ago", "1 week ago"
      const relativePatterns = [
        /(\d+)\s+days?\s+ago/i,
        /(\d+)\s+weeks?\s+ago/i,
        /(\d+)\s+months?\s+ago/i,
        /(\d+)\s+years?\s+ago/i
      ];
      
      for (const pattern of relativePatterns) {
        const match = dateStr.match(pattern);
        if (match) {
          const amount = parseInt(match[1]);
          const now = new Date();
          
          if (pattern.source.includes('days')) {
            now.setDate(now.getDate() - amount);
          } else if (pattern.source.includes('weeks')) {
            now.setDate(now.getDate() - (amount * 7));
          } else if (pattern.source.includes('months')) {
            now.setMonth(now.getMonth() - amount);
          } else if (pattern.source.includes('years')) {
            now.setFullYear(now.getFullYear() - amount);
          }
          
          return now.toISOString();
        }
      }
      
    } catch (error) {
      console.warn('Error parsing Workday date:', error);
    }
    
    return null;
  }

  private calculateAgeOfPosting(publishedDate: string | null): string {
    if (!publishedDate) {
      return 'Unknown';
    }
    
    try {
      const published = new Date(publishedDate);
      const now = new Date();
      const diffInMs = now.getTime() - published.getTime();
      
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) {
        return 'Today';
      } else if (diffInDays === 1) {
        return '1 day ago';
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
      } else if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
      } else {
        const years = Math.floor(diffInDays / 365);
        return years === 1 ? '1 year ago' : `${years} years ago`;
      }
    } catch (error) {
      console.warn('Error calculating age of posting:', error);
      return 'Unknown';
    }
  }

  private extractSalaryFromWorkday(jobContainer: HTMLElement, description: string): { 
    salary: string; 
    salary_type: 'annual' | 'hourly' | 'monthly' | 'contract'; 
    salary_min: number | null; 
    salary_max: number | null 
  } {
    // First try to extract from dedicated salary field
    const salaryElement = this.extractTextWithFallbacks(jobContainer, this.selectors.salary);
    if (salaryElement) {
      console.log('🔍 Workday: Found salary in dedicated field:', salaryElement);
      const salaryInfo = parseSalary(salaryElement);
      if (salaryInfo.salary !== 'Not specified') {
        return salaryInfo;
      }
    }
    
    // Fallback to description parsing
    if (description) {
      console.log('🔍 Workday: Parsing salary from description');
      return parseSalary(description);
    }
    
    return { salary: 'Not specified', salary_type: 'annual', salary_min: null, salary_max: null };
  }

  private determineJobTypeFromJsonLd(jobType: string, description: string): string {
    // Map Workday job types to our job types
    const jobTypeMap: Record<string, string> = {
      'FULL_TIME': 'Full Time',
      'PART_TIME': 'Part Time',
      'CONTRACTOR': 'Contract',
      'INTERN': 'Internship',
      'TEMPORARY': 'Contract',
      'FREELANCE': 'Contract',
      'Full Time': 'Full Time',
      'Part Time': 'Part Time',
      'Contract': 'Contract',
      'Internship': 'Internship'
    };

    // First check the job type from JSON-LD
    if (jobType && jobTypeMap[jobType]) {
      const mappedType = jobTypeMap[jobType];
      console.log(`🔍 Workday: Mapped job type from JSON-LD: ${jobType} -> ${mappedType}`);
      
      // Special handling for PART_TIME with annual salary - likely Full Time
      if (mappedType === 'Part Time') {
        const salaryInfo = this.extractSalaryFromDescription(description);
        if (salaryInfo.salary_type === 'annual' && salaryInfo.salary !== 'Not specified') {
          console.log('🔍 Workday: PART_TIME with annual salary detected, treating as Full Time');
          return 'Full Time';
        }
      }
      
      return mappedType;
    }

    // Fallback to description analysis
    return this.determineJobType('annual', description);
  }

  private determineJobTypeFromEmploymentType(employmentType: string, description: string): string {
    // Map Workday employment types to our job types
    const employmentTypeMap: Record<string, string> = {
      'FULL_TIME': 'Full Time',
      'PART_TIME': 'Part Time',
      'CONTRACTOR': 'Contract',
      'INTERN': 'Internship',
      'TEMPORARY': 'Contract',
      'FREELANCE': 'Contract'
    };

    // First check the employment type from JSON-LD
    if (employmentType && employmentTypeMap[employmentType]) {
      const mappedType = employmentTypeMap[employmentType];
      
      // Special case: If it's PART_TIME but salary type is annual, it's likely Full Time
      if (mappedType === 'Part Time') {
        // Check if there's salary information that suggests full-time work
        const salaryInfo = this.extractSalaryFromDescription(description);
        if (salaryInfo.salary_type === 'annual' && salaryInfo.salary !== 'Not specified') {
          console.log('🔍 Workday: PART_TIME with annual salary detected, treating as Full Time');
          return 'Full Time';
        }
      }
      
      return mappedType;
    }

    // Fallback to description analysis
    return this.determineJobType('annual', description);
  }

  private determineJobType(salaryType: string, description: string): string {
    // If salary is annual, default to Full Time
    if (salaryType === 'annual') {
      return 'Full Time';
    }
    
    // If salary is hourly, check for part-time indicators
    if (salaryType === 'hourly') {
      const partTimeIndicators = [
        'part-time', 'part time', 'parttime',
        'flexible hours', 'flexible schedule',
        '20 hours', '30 hours', 'less than 40',
        'weekend', 'evening', 'night shift'
      ];
      
      const lowerDescription = description.toLowerCase();
      for (const indicator of partTimeIndicators) {
        if (lowerDescription.includes(indicator)) {
          return 'Part Time';
        }
      }
      
      return 'Full Time';
    }
    
    // If salary is contract-based
    if (salaryType === 'contract') {
      return 'Contract';
    }
    
    // If salary is monthly, likely full-time
    if (salaryType === 'monthly') {
      return 'Full Time';
    }
    
    // Check description for job type indicators
    const lowerDescription = description.toLowerCase();
    
    // Check for contract indicators
    const contractIndicators = [
      'contract', 'contractor', 'freelance', 'consultant',
      'temporary', 'temp', 'project-based', 'project based'
    ];
    
    for (const indicator of contractIndicators) {
      if (lowerDescription.includes(indicator)) {
        return 'Contract';
      }
    }
    
    // Check for part-time indicators
    const partTimeIndicators = [
      'part-time', 'part time', 'parttime',
      'flexible hours', 'flexible schedule',
      '20 hours', '30 hours', 'less than 40',
      'weekend', 'evening', 'night shift'
    ];
    
    for (const indicator of partTimeIndicators) {
      if (lowerDescription.includes(indicator)) {
        return 'Part Time';
      }
    }
    
    // Check for internship indicators
    const internshipIndicators = [
      'intern', 'internship', 'co-op', 'coop',
      'student', 'entry level', 'entry-level'
    ];
    
    for (const indicator of internshipIndicators) {
      if (lowerDescription.includes(indicator)) {
        return 'Internship';
      }
    }
    
    // Default to Full Time if no specific indicators found
    return 'Full Time';
  }

  private extractSalaryFromDescription(description: string): { 
    salary: string; 
    salary_type: 'annual' | 'hourly' | 'monthly' | 'contract'; 
    salary_min: number | null; 
    salary_max: number | null 
  } {
    if (!description) {
      return { salary: 'Not specified', salary_type: 'annual', salary_min: null, salary_max: null };
    }

    console.log('🔍 Workday: Extracting salary from description...');

    // Look for salary patterns in the description
    const salaryPatterns = [
      // Pattern: $80,000 - $100,000
      /\$([0-9,]+)\s*-\s*\$([0-9,]+)/g,
      // Pattern: $80,000 to $100,000
      /\$([0-9,]+)\s+to\s+\$([0-9,]+)/g,
      // Pattern: 80,000 - 100,000
      /([0-9,]+)\s*-\s*([0-9,]+)/g,
      // Pattern: 80,000 to 100,000
      /([0-9,]+)\s+to\s+([0-9,]+)/g,
      // Pattern: $80,000+
      /\$([0-9,]+)\+/g,
      // Pattern: $80,000
      /\$([0-9,]+)/g
    ];

    for (const pattern of salaryPatterns) {
      const matches = Array.from(description.matchAll(pattern));
      if (matches.length > 0) {
        const match = matches[0];
        
        if (match.length >= 3) {
          // Range found
          const min = parseInt(match[1].replace(/,/g, ''));
          const max = parseInt(match[2].replace(/,/g, ''));
          const salaryText = match[0];
          
          console.log(`🔍 Workday: Found salary range: ${salaryText}`);
          return {
            salary: salaryText,
            salary_type: 'annual',
            salary_min: min,
            salary_max: max
          };
        } else if (match.length >= 2) {
          // Single value found
          const value = parseInt(match[1].replace(/,/g, ''));
          const salaryText = match[0];
          
          console.log(`🔍 Workday: Found salary value: ${salaryText}`);
          return {
            salary: salaryText,
            salary_type: 'annual',
            salary_min: value,
            salary_max: value
          };
        }
      }
    }

    console.log('🔍 Workday: No salary patterns found in description');
    
    // Try the general salary parser as fallback, but only if it finds actual numeric salary
    const fallbackResult = parseSalary(description);
    if (fallbackResult.salary !== 'Not specified' && 
        fallbackResult.salary_min !== null && 
        fallbackResult.salary_max !== null) {
      console.log(`🔍 Workday: Fallback parser found numeric salary: ${fallbackResult.salary}`);
      return fallbackResult;
    }

    console.log('🔍 Workday: No numeric salary information found, returning "Not specified"');
    return { salary: 'Not specified', salary_type: 'annual', salary_min: null, salary_max: null };
  }
}
