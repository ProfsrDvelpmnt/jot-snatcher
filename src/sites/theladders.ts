// TheLadders.com-specific extraction logic
import { JobExtractor } from '@/utils/enhancedJobExtractor';
import { SiteConfig } from '@/utils/siteDetector';
import { JobData } from '@/types';
import { parseSalary } from '@/utils/salaryParser';

export class TheLaddersExtractor extends JobExtractor {
  constructor() {
    super({
      domain: 'theladders.com',
      name: 'TheLadders',
      enabled: true,
      selectors: {
        // Main job container - look for job details page or listing
        jobContainer: [
          '.job-detail-view-container',
          '.sticky-job-details-container',
          'body',
          '.job-details',
          '.job-posting',
          '.job-container',
          'main'
        ],
        
        // Job title selectors
        title: [
          '.sticky-job-title',
          'h1.job-title',
          '.job-header h1',
          'h1',
          '.job-title',
          '[data-testid="job-title"]'
        ],
        
        // Company name selectors - be very specific to avoid mixing with salary
        company: [
          '.member-company-name',
          '.company-name',
          '.job-company',
          '.employer-name',
          '[data-testid="company-name"]'
        ],
        
        // Location selectors - be very specific to avoid mixing with other data
        location: [
          '.member-job-view-header-details-light-font',
          '.job-location',
          '.location',
          '.job-loc',
          '[data-testid="job-location"]',
          '.remote-flag-badge-basic'  // Add remote flag badge as location source
        ],
        
        // Salary selectors - be very specific to avoid mixing with company/location
        salary: [
          '.salary',
          '.compensation',
          '.salary-info',
          '[data-testid="salary"]'
        ],
        
        // Description selectors
        description: [
          '#job-description-box',
          '.job-description-text',
          '.job-description',
          '.description',
          '.job-content',
          '.content',
          '[data-testid="job-description"]'
        ],

        // Apply link selectors
        applyLink: [
          '.apply-for-me-button',
          '.regular-apply-button',
          '.apply-button',
          '.apply-link',
          'a[href*="apply"]',
          '[data-testid="apply-button"]'
        ],

        // Job link selectors for extracting specific job URLs - prioritize active/selected jobs
        jobLink: [
          '.selected-card a[href*="/job/"]',
          '.clickable-member-job-card.selected-card a[href*="/job/"]',
          '.member-job-card-container.active a[href*="/job/"]',
          '.clickable-member-job-card.active a[href*="/job/"]',
          '.job-card-container-0 a[href*="/job/"]',
          '[action="job-card"][style*="background"] a[href*="/job/"]',
          '.clickable-card.selected a[href*="/job/"]',
          '.job-card-title[href*="/job/"]',
          '.member-job-card-container a[href*="/job/"]',
          '.clickable-member-job-card a[href*="/job/"]'
        ],

        // Posted date selectors
        postedDate: [
          '.posted-date',
          '.job-posted',
          '.date-posted',
          '[data-testid="posted-date"]'
        ],

        // Job type selectors
        jobType: [
          '.remote-flag-badge-basic',
          '.remote-flag-badge-in-person',
          '.job-type',
          '.employment-type',
          '.work-type',
          '[data-testid="job-type"]'
        ],


        // Job list selectors for listing pages
        jobList: [
          '.job-list',
          '.jobs-container',
          '.search-results'
        ]
      }
    });
  }

  // Extract job link URL from href attributes
  private extractJobLinkUrl(container: Element, selectors: string | string[] | undefined): string {
    console.log('🔍 extractJobLinkUrl called with selectors:', selectors);
    
    if (!selectors) {
      console.log('🔍 No selectors provided');
      return '';
    }

    const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
    console.log('🔍 Testing selectors:', selectorArray);
    
    // First try to find job links within the container
    for (const selector of selectorArray) {
      console.log('🔍 Testing selector in container:', selector);
      const elements = container.querySelectorAll(selector);
      console.log('🔍 Found elements in container for selector:', selector, 'count:', elements.length);
      
      for (const element of elements) {
        const anchor = element as HTMLAnchorElement;
        console.log('🔍 Checking element in container:', anchor.tagName, 'href:', anchor.href);
        
        if (anchor?.href && anchor.href.includes('/job/')) {
          console.log('🔍 Found job link element in container:', anchor.href);
          return anchor.href;
        }
      }
    }

    // If no job links found in container, search the entire document
    console.log('🔍 No job links found in container, searching entire document...');
    
    // FIRST: Try the most specific selected-card selectors directly
    console.log('🔍 First checking for selected-card directly...');
    const directSelectedCards = document.querySelectorAll('.selected-card a[href*="/job/"]');
    console.log('🔍 Direct selected-card links found:', directSelectedCards.length);
    
    if (directSelectedCards.length > 0) {
      const directLink = directSelectedCards[0] as HTMLAnchorElement;
      console.log('🔍 Found job link via direct selected-card:', directLink.href);
      return directLink.href;
    }
    
    // SECOND: Try to find active/selected job cards by looking for visual indicators
    console.log('🔍 Looking for visually selected job cards...');
    
    // Look for job cards with different background colors or styles that indicate selection
    const allJobCards = document.querySelectorAll('.member-job-card-container, .clickable-member-job-card, [action="job-card"]');
    console.log('🔍 Found total job cards:', allJobCards.length);
    
    // First, find the most common background color (default)
    const backgroundColors = new Map<string, number>();
    for (let i = 0; i < Math.min(allJobCards.length, 20); i++) {
      const card = allJobCards[i] as HTMLElement;
      const backgroundColor = window.getComputedStyle(card).backgroundColor;
      backgroundColors.set(backgroundColor, (backgroundColors.get(backgroundColor) || 0) + 1);
    }
    
    const mostCommonBackground = Array.from(backgroundColors.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'rgba(0, 0, 0, 0)';
    
    console.log('🔍 Most common background color:', mostCommonBackground);
    
    for (let i = 0; i < allJobCards.length; i++) {
      const card = allJobCards[i] as HTMLElement;
      const computedStyle = window.getComputedStyle(card);
      const backgroundColor = computedStyle.backgroundColor;
      const backgroundImage = computedStyle.backgroundImage;
      
      console.log(`🔍 Card ${i}:`, {
        tagName: card.tagName,
        className: card.className,
        backgroundColor: backgroundColor,
        backgroundImage: backgroundImage,
        style: card.getAttribute('style'),
        isDefaultBackground: backgroundColor === mostCommonBackground
      });
      
      // Check if this card looks like it's selected (different background, active class, etc.)
      const isSelected = card.classList.contains('selected-card') ||
                        card.classList.contains('active') || 
                        card.classList.contains('selected') ||
                        // Only consider job-card-container-0 if it also has selected-card or other strong indicators
                        (card.classList.contains('job-card-container-0') && (card.classList.contains('selected-card') || card.getAttribute('style')?.includes('background'))) ||
                        (backgroundColor !== mostCommonBackground && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') ||
                        backgroundImage !== 'none' ||
                        card.getAttribute('style')?.includes('background');
      
      if (isSelected) {
        console.log(`🔍 Card ${i} appears to be selected, looking for job link...`);
        const jobLink = card.querySelector('a[href*="/job/"]') as HTMLAnchorElement;
        if (jobLink?.href && jobLink.href.includes('/job/')) {
          console.log('🔍 Found job link in selected card:', jobLink.href);
          return jobLink.href;
        }
      }
    }
    
    // Fallback: try specific active selectors - prioritize selected-card heavily
    const activeSelectors = [
      '.selected-card a[href*="/job/"]',
      '.clickable-member-job-card.selected-card a[href*="/job/"]',
      '.selected-card',
      '.clickable-member-job-card.selected-card',
      '.member-job-card-container.active',
      '.clickable-member-job-card.active', 
      '[action="job-card"][style*="background"]',
      '.clickable-card.selected'
    ];
    
    for (const activeSelector of activeSelectors) {
      console.log('🔍 Checking fallback active selector:', activeSelector);
      const activeElements = document.querySelectorAll(activeSelector);
      console.log('🔍 Found active elements:', activeSelector, 'count:', activeElements.length);
      
      for (const activeElement of activeElements) {
        const jobLink = activeElement.querySelector('a[href*="/job/"]') as HTMLAnchorElement;
        if (jobLink?.href && jobLink.href.includes('/job/')) {
          console.log('🔍 Found job link in fallback active element:', jobLink.href);
          return jobLink.href;
        }
      }
    }
    
    // If no active job found, search all selectors
    for (const selector of selectorArray) {
      console.log('🔍 Testing selector in document:', selector);
      const elements = document.querySelectorAll(selector);
      console.log('🔍 Found elements in document for selector:', selector, 'count:', elements.length);
      
      for (const element of elements) {
        const anchor = element as HTMLAnchorElement;
        console.log('🔍 Checking element in document:', anchor.tagName, 'href:', anchor.href);
        
        if (anchor?.href && anchor.href.includes('/job/')) {
          console.log('🔍 Found job link element in document:', anchor.href);
          return anchor.href;
        }
      }
    }

    console.log('🔍 No job links found with any selector');
    return '';
  }

  /**
   * Extract job data from TheLadders.com pages
   * Handles both job detail pages and job listing pages
   */
  async extractJobData(): Promise<JobData | null> {
    try {
      console.log('🔍 TheLaddersExtractor: Starting extraction...');
      
      const jobContainer = this.findJobContainer();
      if (!jobContainer) {
        console.log('❌ TheLaddersExtractor: No job container found');
        return null;
      }

      // Extract basic job data
      const basicJobData = this.extractBasicJobDataFromContainer(jobContainer);
      if (!basicJobData) {
        console.log('❌ TheLaddersExtractor: No basic job data found');
        return null;
      }

      // Enhance with site-specific logic
      const enhancedData = this.enhanceJobData(basicJobData);
      
      console.log('✅ TheLaddersExtractor: Extraction completed:', enhancedData);
      return enhancedData;
    } catch (error) {
      console.error('❌ TheLaddersExtractor: Error during extraction:', error);
      return null;
    }
  }

  /**
   * Extract basic job data from a container element
   */
  private extractBasicJobDataFromContainer(container: Element): JobData | null {
    // Look for the specific nested structure from company-and-posting-info
    const companyPostingInfo = document.querySelector('.company-and-posting-info');
    
    const title = this.extractTextWithFallbacks(container, this.selectors.title);
    const organization = this.extractTextWithFallbacks(container, this.selectors.company);
    const location = this.extractTextWithFallbacks(container, this.selectors.location);
    const salary = this.extractTextWithFallbacks(container, this.selectors.salary);
    const description = this.extractTextWithFallbacks(container, this.selectors.description);
    const type = this.extractTextWithFallbacks(container, this.selectors.jobType);
    const postedDate = this.extractTextWithFallbacks(container, this.selectors.postedDate);
    
    console.log('🔍 TheLaddersExtractor: Raw extracted data:', {
      title,
      organization,
      location,
      salary,
      type,
      postedDate,
      description: description ? description.substring(0, 100) + '...' : 'none'
    });
    
    // Debug: Check all remote flag badge elements
    console.log('🔍 Debug: Checking all remote flag badge elements...');
    const allRemoteFlags = document.querySelectorAll('.remote-flag-badge-basic');
    console.log('🔍 Found remote flag elements:', allRemoteFlags.length);
    allRemoteFlags.forEach((flag, index) => {
      console.log(`🔍 Remote flag ${index + 1}:`, {
        text: flag.textContent?.trim(),
        classes: flag.className,
        element: flag
      });
    });
    
    // Debug: Check all location elements
    console.log('🔍 Debug: Checking all location elements...');
    const locationSelectors = this.selectors.location as string[];
    locationSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`🔍 Location selector "${selector}":`, elements.length, 'elements found');
      elements.forEach((el, index) => {
        console.log(`🔍 Location element ${index + 1}:`, {
          text: el.textContent?.trim(),
          classes: el.className,
          selector: selector
        });
      });
    });
    
    // Debug: Check if posted date element exists
    const postedDateElement = document.querySelector('.posted-date');
    console.log('🔍 Posted date element found:', postedDateElement);
    if (postedDateElement) {
      console.log('🔍 Posted date element text:', postedDateElement.textContent);
    }
    
    // Also check for posted date in the nested structure
    if (companyPostingInfo) {
      const nestedPostedDate = companyPostingInfo.querySelector('.posted-date');
      if (nestedPostedDate) {
        console.log('🔍 Posted date found in nested structure:', nestedPostedDate.textContent);
      }
    }

    if (!title || !organization) {
      console.log('❌ TheLaddersExtractor: Missing required fields (title or organization)');
      return null;
    }

    // Determine salary type first
    const salaryType = this.determineSalaryType(salary, description);
    const cleanedSalary = this.cleanSalary(salary);
    const cleanedDescription = this.cleanDescription(description);

    console.log('🔍 TheLaddersExtractor: Salary type determination:', {
      originalSalary: salary,
      originalDescription: description ? description.substring(0, 200) + '...' : 'none',
      determinedSalaryType: salaryType,
      cleanedSalary
    });

    // Clean location first
    const cleanedLocation = this.cleanLocation(location);
    
    // Enhanced location extraction logic for TheLadders
    let finalLocation = cleanedLocation;
    
    if (companyPostingInfo) {
      console.log('🔍 Found company-and-posting-info container');
      
      // Look for location in the nested structure
      const locationElement = companyPostingInfo.querySelector('.member-job-view-header-details-light-font');
      if (locationElement) {
        const locationText = locationElement.textContent?.trim() || '';
        console.log('🔍 Found location in nested structure:', locationText);
        
        // Also check for remote flag badge in the same container
        const remoteFlag = companyPostingInfo.querySelector('.remote-flag-badge-basic');
        if (remoteFlag) {
          const flagText = remoteFlag.textContent?.trim() || '';
          console.log('🔍 Found remote flag badge in nested structure:', flagText);
          
          // If location is just "Remote" and flag badge has "Remote in United States"
          if (locationText.toLowerCase() === 'remote' && flagText.toLowerCase().includes('remote in')) {
            const locationPart = flagText.toLowerCase().match(/remote in (.+)/);
            if (locationPart && locationPart[1]) {
              if (locationPart[1].includes('united states') || locationPart[1].includes('us')) {
                finalLocation = 'US-Anywhere';
                console.log('🔍 Enhanced location extraction: Remote + Remote in United States = US-Anywhere');
              } else {
                finalLocation = locationPart[1];
                console.log('🔍 Enhanced location extraction:', finalLocation);
              }
            }
          }
        }
      }
    }
    
    // Fallback to original logic if nested structure not found
    if (finalLocation === cleanedLocation && (!finalLocation || finalLocation.toLowerCase() === 'remote')) {
      console.log('🔍 Fallback to original remote flag badge detection');
      const allRemoteFlags = document.querySelectorAll('.remote-flag-badge-basic');
      for (const flag of allRemoteFlags) {
        const flagText = flag.textContent?.trim() || '';
        if (flagText.toLowerCase().includes('remote in')) {
          const locationPart = flagText.toLowerCase().match(/remote in (.+)/);
          if (locationPart && locationPart[1]) {
            if (locationPart[1].includes('united states') || locationPart[1].includes('us')) {
              finalLocation = 'US-Anywhere';
              console.log('🔍 Fallback location extraction: US-Anywhere');
              break;
            }
          }
        }
      }
    }
    
    // Enhanced posted date extraction
    let finalPostedDate = postedDate;
    
    // Check if we can find posted date in the nested structure
    if (companyPostingInfo) {
      const nestedPostedDate = companyPostingInfo.querySelector('.posted-date');
      if (nestedPostedDate) {
        const nestedDateText = nestedPostedDate.textContent?.trim() || '';
        console.log('🔍 Found posted date in nested structure:', nestedDateText);
        if (nestedDateText) {
          finalPostedDate = nestedDateText;
        }
      }
    }
    
    // Also check for posted date elements that contain icon-clock (the clock image)
    if (!finalPostedDate || finalPostedDate === postedDate) {
      // Look for elements that contain the icon-clock image
      const clockImages = document.querySelectorAll('.icon-clock');
      console.log('🔍 Found clock images:', clockImages.length);
      
      for (const clockImg of clockImages) {
        // Get the parent element that contains both the image and the text
        const parentElement = clockImg.parentElement;
        if (parentElement) {
          const parentText = parentElement.textContent?.trim() || '';
          console.log('🔍 Clock image parent text:', parentText);
          
          // If the parent contains date-like text, use it
          if (parentText && (parentText.toLowerCase().includes('today') || 
                            parentText.toLowerCase().includes('day') || 
                            parentText.toLowerCase().includes('week') ||
                            parentText.toLowerCase().includes('ago'))) {
            finalPostedDate = parentText;
            console.log('🔍 Found posted date from clock image parent:', finalPostedDate);
            break;
          }
        }
      }
    }
    
    // Also check for more specific posted date selectors (but only if we haven't found a better one from clock image)
    if (!finalPostedDate || finalPostedDate === postedDate) {
      const specificPostedDate = document.querySelector('.posted-date.bold-date, .posted-date');
      if (specificPostedDate) {
        const specificDateText = specificPostedDate.textContent?.trim() || '';
        console.log('🔍 Found posted date with specific selector:', specificDateText);
        if (specificDateText) {
          finalPostedDate = specificDateText;
        }
      }
    }
    
    // If we found a date from clock image parent, prioritize it over specific selectors
    const clockImages = document.querySelectorAll('.icon-clock');
    for (const clockImg of clockImages) {
      const parentElement = clockImg.parentElement;
      if (parentElement) {
        const parentText = parentElement.textContent?.trim() || '';
        if (parentText && (parentText.toLowerCase().includes('today') || 
                          parentText.toLowerCase().includes('day') || 
                          parentText.toLowerCase().includes('week') ||
                          parentText.toLowerCase().includes('month') ||
                          parentText.toLowerCase().includes('ago'))) {
          console.log('🔍 Prioritizing clock image parent text over specific selector:', parentText);
          finalPostedDate = parentText;
          break;
        }
      }
    }

    // Parse the posted date for both fields
    const parsedDatePosted = this.parsePostedDate(finalPostedDate);
    
    // For ageOfPosting, convert all relative dates to actual dates for display
    let ageOfPostingDisplay = finalPostedDate;
    if (finalPostedDate) {
      // Use the same parsing logic as parsePostedDate but format for display
      const parsedDate = this.parsePostedDate(finalPostedDate);
      
      // If we got an ISO string back, format it for display
      if (parsedDate && parsedDate.includes('T') && parsedDate.includes('Z')) {
        const date = new Date(parsedDate);
        ageOfPostingDisplay = date.toLocaleDateString(); // e.g., "9/15/2025"
        console.log('🔍 Converted ageOfPosting to date:', finalPostedDate, '->', ageOfPostingDisplay);
      } else {
        // If it's not a relative date we can parse, keep the original text
        ageOfPostingDisplay = finalPostedDate;
        console.log('🔍 Kept ageOfPosting as original text:', finalPostedDate);
      }
    }

    // Extract job link - try to find the actual job URL instead of using search page URL
    let jobLink = window.location.href; // fallback to current page URL
    const jobLinkUrl = this.extractJobLinkUrl(container, this.selectors.jobLink);
    if (jobLinkUrl && jobLinkUrl.includes('/job/')) {
      // If we found a job link, use it
      jobLink = jobLinkUrl.startsWith('http') ? jobLinkUrl : `https://www.theladders.com${jobLinkUrl}`;
      console.log('🔍 Found job-specific URL:', jobLink);
    } else {
      console.log('🔍 No job-specific URL found, using current page URL:', jobLink);
    }

    const result = {
      organization: this.cleanCompanyName(organization),
      position: this.cleanTitle(title),
      link: jobLink,
      salary: cleanedSalary,
      salary_type: salaryType.toLowerCase() as 'annual' | 'hourly',
      salaryTypeDisplay: salaryType, // Capitalized version for UI display
      salary_min: null,
      salary_max: null,
      location: finalLocation,
      type: this.parseJobType(type, salaryType),
      environment: this.determineEnvironment(finalLocation),
      stage: 'Saved',
      source: 'TheLadders',
      job_site: 'TheLadders',
      date_saved: new Date().toISOString(),
      date_posted: parsedDatePosted,
      ageOfPosting: ageOfPostingDisplay, // Show actual date when "Today" is found
      description: cleanedDescription
    };
    
    console.log('🔍 TheLaddersExtractor: Final result before enhancement:', result);
    console.log('🔍 TheLaddersExtractor: Key fields check:', {
      salary_type: result.salary_type,
      salaryTypeDisplay: result.salaryTypeDisplay,
      type: result.type,
      environment: result.environment,
      date_posted: result.date_posted,
      ageOfPosting: result.ageOfPosting
    });
    return result;
  }

  /**
   * Determine environment (Remote, Hybrid, In-Person) from location and job type
   */
  private determineEnvironment(location: string): string {
    console.log('🔍 determineEnvironment called with location:', location);
    
    // First try to find remote flag badge in the specific nested structure
    const companyPostingInfo = document.querySelector('.company-and-posting-info');
    if (companyPostingInfo) {
      const remoteFlag = companyPostingInfo.querySelector('.remote-flag-badge-basic');
      if (remoteFlag) {
        const flagText = remoteFlag.textContent?.trim() || '';
        console.log('🔍 Found remote flag badge in nested structure for environment:', flagText);
        
        // Extract just the environment type from the badge text
        if (flagText.toLowerCase().includes('remote')) {
          console.log('🔍 Remote flag badge indicates Remote environment');
          return 'Remote';
        }
        if (flagText.toLowerCase().includes('hybrid')) {
          console.log('🔍 Remote flag badge indicates Hybrid environment');
          return 'Hybrid';
        }
        if (flagText.toLowerCase().includes('in-person')) {
          console.log('🔍 Remote flag badge indicates In-Person environment');
          return 'In-Person';
        }
      }
    }
    
    // Fallback to original logic if nested structure not found
    const jobDetailsArea = document.querySelector('.job-detail-view-container, .sticky-job-details-container, .job-details, .job-posting');
    let remoteFlag = null;
    
    if (jobDetailsArea) {
      remoteFlag = jobDetailsArea.querySelector('.remote-flag-badge-basic');
    }
    
    if (!remoteFlag) {
      const allRemoteFlags = document.querySelectorAll('.remote-flag-badge-basic');
      for (const flag of allRemoteFlags) {
        const flagText = flag.textContent?.trim() || '';
        if (flagText.toLowerCase().includes('remote')) {
          remoteFlag = flag;
          break;
        }
      }
    }
    
    if (remoteFlag) {
      const flagText = remoteFlag.textContent?.trim() || '';
      console.log('🔍 Found relevant remote flag badge for environment (fallback):', flagText);
      
      if (flagText.toLowerCase().includes('remote')) {
        console.log('🔍 Remote flag badge indicates Remote environment');
        return 'Remote';
      }
      if (flagText.toLowerCase().includes('hybrid')) {
        console.log('🔍 Remote flag badge indicates Hybrid environment');
        return 'Hybrid';
      }
      if (flagText.toLowerCase().includes('in-person')) {
        console.log('🔍 Remote flag badge indicates In-Person environment');
        return 'In-Person';
      }
    }
    
    // Fallback to location-based detection
    if (!location) {
      console.log('🔍 No location provided, defaulting to In-Person');
      return 'In-Person';
    }
    
    const locationLower = location.toLowerCase();
    console.log('🔍 Checking location for environment indicators:', locationLower);
    
    // If location is "US-Anywhere", it's definitely remote
    if (locationLower.includes('us-anywhere') || locationLower.includes('anywhere')) {
      console.log('🔍 Location is US-Anywhere, indicating Remote environment');
      return 'Remote';
    }
    
    if (locationLower.includes('remote')) {
      console.log('🔍 Location indicates Remote environment');
      return 'Remote';
    }
    if (locationLower.includes('hybrid')) {
      console.log('🔍 Location indicates Hybrid environment');
      return 'Hybrid';
    }
    if (locationLower.includes('on-site') || locationLower.includes('onsite')) {
      console.log('🔍 Location indicates In-Person environment');
      return 'In-Person';
    }
    
    console.log('🔍 No environment indicators found, defaulting to In-Person');
    return 'In-Person';
  }

  /**
   * Enhance job data with TheLadders-specific processing
   */
  private async enhanceJobData(jobData: JobData): Promise<JobData> {
    const enhanced = { ...jobData };

    // Store our determined salary type before parsing
    const originalSalaryType = enhanced.salary_type;

    // Parse salary information to get min/max values
    if (enhanced.salary) {
      const parsedSalary = parseSalary(enhanced.salary);
      if (parsedSalary) {
        enhanced.salary_min = parsedSalary.salary_min;
        enhanced.salary_max = parsedSalary.salary_max;
        enhanced.salary = parsedSalary.salary;
        // Restore our determined salary type (don't let parser override it)
        enhanced.salary_type = originalSalaryType;
      }
    }

    // Set source
    enhanced.source = 'TheLadders';

    // Generate job ID if not present
    if (!enhanced.jobId) {
      enhanced.jobId = this.generateJobId(enhanced);
    }

    console.log('✅ TheLaddersExtractor: Enhanced job data:', enhanced);
    console.log('✅ TheLaddersExtractor: Enhanced key fields check:', {
      salary_type: enhanced.salary_type,
      salaryTypeDisplay: enhanced.salaryTypeDisplay,
      type: enhanced.type,
      environment: enhanced.environment,
      date_posted: enhanced.date_posted,
      ageOfPosting: enhanced.ageOfPosting
    });
    return enhanced;
  }

  /**
   * Clean job title by removing common prefixes/suffixes
   */
  private cleanTitle(title: string): string {
    if (!title) return title;

    // Remove common prefixes
    let cleaned = title
      .replace(/^(Job|Position|Role):\s*/i, '')
      .replace(/^(Senior|Junior|Lead|Principal)\s+/i, (match) => match + ' ')
      .trim();

    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');

    return cleaned;
  }

  /**
   * Clean company name
   */
  private cleanCompanyName(company: string): string {
    if (!company) return company;

    console.log('🔍 cleanCompanyName called with:', company);

    let cleaned = company.trim();

    // Handle URLs - extract company name from URL paths
    if (cleaned.includes('http') || cleaned.includes('www.') || cleaned.includes('/company/')) {
      console.log('🔍 Detected URL in company name, extracting company name...');
      
      // Extract from patterns like "https://www.theladders.com/company/hubspot"
      const urlMatch = cleaned.match(/\/company\/([^\/\s]+)/i);
      if (urlMatch && urlMatch[1]) {
        const companyFromUrl = urlMatch[1].replace(/[-_]/g, ' ');
        cleaned = this.capitalizeWords(companyFromUrl);
        console.log('🔍 Extracted company name from URL:', cleaned);
        return cleaned;
      }
      
      // Extract from patterns like "@https://www.theladders.com/company/hubspot"
      const atUrlMatch = cleaned.match(/@https?:\/\/[^\/]+\/company\/([^\/\s]+)/i);
      if (atUrlMatch && atUrlMatch[1]) {
        const companyFromUrl = atUrlMatch[1].replace(/[-_]/g, ' ');
        cleaned = this.capitalizeWords(companyFromUrl);
        console.log('🔍 Extracted company name from @URL:', cleaned);
        return cleaned;
      }
      
      // If it's just a plain URL, try to extract domain name
      try {
        const url = new URL(cleaned);
        const domain = url.hostname.replace('www.', '').split('.')[0];
        cleaned = this.capitalizeWords(domain);
        console.log('🔍 Extracted company name from domain:', cleaned);
        return cleaned;
      } catch (e) {
        console.log('🔍 Could not parse as URL, proceeding with other cleaning...');
      }
    }

    // Handle text patterns like "About HubSpot Learn More About HubSpot"
    if (cleaned.toLowerCase().includes('about') && cleaned.toLowerCase().includes('learn more')) {
      console.log('🔍 Detected "About X Learn More" pattern, extracting company name...');
      
      // Look for company name between "About" and "Learn More" - be more specific
      const aboutMatch = cleaned.match(/about\s+([^l]+?)\s+learn\s+more/i);
      if (aboutMatch && aboutMatch[1]) {
        cleaned = aboutMatch[1].trim();
        console.log('🔍 Extracted company name from About pattern:', cleaned);
        return this.cleanCompanyName(cleaned); // Recursively clean
      }
      
      // Alternative pattern for cases like "About Tanium Learn More About Tanium"
      const aboutMatch2 = cleaned.match(/about\s+(\w+)/i);
      if (aboutMatch2 && aboutMatch2[1]) {
        cleaned = aboutMatch2[1].trim();
        console.log('🔍 Extracted company name from About pattern (alternative):', cleaned);
        return this.cleanCompanyName(cleaned); // Recursively clean
      }
    }

    // Handle text patterns like "About CompanyName"
    if (cleaned.toLowerCase().startsWith('about ')) {
      console.log('🔍 Detected "About X" pattern, extracting company name...');
      cleaned = cleaned.replace(/^about\s+/i, '').trim();
      console.log('🔍 Extracted company name from About pattern:', cleaned);
    }

    // Remove common suffixes
    cleaned = cleaned
      .replace(/\s+(Inc|LLC|Corp|Corporation|Company|Co\.?|Ltd|Limited)\.?$/i, '')
      .trim();

    // Capitalize words properly
    cleaned = this.capitalizeWords(cleaned);

    console.log('🔍 Final cleaned company name:', cleaned);
    return cleaned;
  }

  /**
   * Capitalize words properly (handle special cases like HubSpot, LinkedIn, etc.)
   */
  private capitalizeWords(text: string): string {
    if (!text) return text;

    // Handle special cases
    const specialCases: { [key: string]: string } = {
      'hubspot': 'HubSpot',
      'linkedin': 'LinkedIn',
      'microsoft': 'Microsoft',
      'google': 'Google',
      'facebook': 'Facebook',
      'amazon': 'Amazon',
      'apple': 'Apple',
      'netflix': 'Netflix',
      'uber': 'Uber',
      'airbnb': 'Airbnb',
      'salesforce': 'Salesforce',
      'adobe': 'Adobe',
      'oracle': 'Oracle',
      'ibm': 'IBM',
      'intel': 'Intel',
      'cisco': 'Cisco',
      'vmware': 'VMware',
      'servicenow': 'ServiceNow',
      'workday': 'Workday',
      'atlassian': 'Atlassian',
      'slack': 'Slack',
      'zoom': 'Zoom',
      'dropbox': 'Dropbox',
      'twitter': 'Twitter',
      'meta': 'Meta',
      'tesla': 'Tesla',
      'spacex': 'SpaceX',
      'openai': 'OpenAI'
    };

    const lowerText = text.toLowerCase();
    if (specialCases[lowerText]) {
      return specialCases[lowerText];
    }

    // Default capitalization
    return text.replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Clean salary string - remove extra text and formatting
   */
  private cleanSalary(salary: string): string {
    if (!salary) return salary;

    // Remove extra whitespace and clean up
    let cleaned = salary
      .replace(/[\r\n\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Remove asterisks and other formatting characters
    cleaned = cleaned.replace(/\*+/g, '').trim();

    return cleaned;
  }

  /**
   * Determine salary type based on salary text and description
   */
  private determineSalaryType(salary: string, description: string): string {
    console.log('🔍 determineSalaryType called with:', { salary, description: description ? description.substring(0, 100) + '...' : 'none' });
    
    if (!salary && !description) {
      console.log('🔍 No salary or description, defaulting to Annual');
      return 'Annual'; // Default assumption
    }

    // PRIORITY 1: Check salary text first (most reliable indicator)
    if (salary) {
      const salaryLower = salary.toLowerCase();
      
      // If salary contains K (thousands), it's definitely annual
      if (salaryLower.includes('k')) {
        console.log('🔍 Salary contains K, returning Annual');
        return 'Annual';
      }
      
      // If salary contains large numbers (likely annual ranges like $150,000)
      if (salary.match(/\$?\d{3,}/)) {
        console.log('🔍 Salary contains large numbers, returning Annual');
        return 'Annual';
      }
      
      // Check for explicit hourly indicators in salary
      if (salaryLower.includes('/hr') || salaryLower.includes('hour') || salaryLower.includes('hourly')) {
        console.log('🔍 Salary explicitly mentions hourly, returning Hourly');
        return 'Hourly';
      }
    }

    // PRIORITY 2: Check description for explicit salary type mentions
    if (description) {
      const descLower = description.toLowerCase();
      
      // Look for explicit annual indicators in description
      if (descLower.includes('annual salary') || descLower.includes('yearly salary') || 
          descLower.includes('base salary') || descLower.includes('salary range')) {
        console.log('🔍 Description mentions annual salary, returning Annual');
        return 'Annual';
      }
      
      // Look for explicit hourly indicators in description
      if (descLower.includes('hourly wage') || descLower.includes('hourly rate') || 
          descLower.includes('per hour') || descLower.includes('$/hr')) {
        console.log('🔍 Description mentions hourly wage, returning Hourly');
        return 'Hourly';
      }
    }

    // PRIORITY 3: Check for general hourly indicators (but be more specific)
    const combinedText = `${salary || ''} ${description || ''}`.toLowerCase();
    console.log('🔍 Combined text for analysis:', combinedText.substring(0, 200) + '...');

    // Only consider it hourly if we find very specific hourly indicators
    if (combinedText.includes('/hr') || combinedText.includes('per hour') || 
        combinedText.includes('hourly wage') || combinedText.includes('hourly rate')) {
      console.log('🔍 Found specific hourly indicators, returning Hourly');
      return 'Hourly';
    }

    // Check for annual indicators
    if (combinedText.includes('annual') || combinedText.includes('yearly') || 
        combinedText.includes('salary') || combinedText.includes('base salary')) {
      console.log('🔍 Found annual indicators, returning Annual');
      return 'Annual';
    }

    // Default to Annual for professional jobs (most executive positions are salaried)
    console.log('🔍 Defaulting to Annual for professional jobs');
    return 'Annual';
  }

  /**
   * Clean location string
   */
  private cleanLocation(location: string): string {
    console.log('🔍 cleanLocation called with:', location);
    
    if (!location) {
      console.log('🔍 No location provided');
      return location;
    }

    // Remove common prefixes
    let cleaned = location
      .replace(/^(Location|Located in):\s*/i, '')
      .replace(/^(Remote|Hybrid|On-site):\s*/i, (match) => match + ' ')
      .trim();

    // Handle remote flag badge text like "Remote in United States" or "In-Person in New York"
    if (cleaned.toLowerCase().includes('remote in')) {
      // Extract location from "Remote in United States" -> "US-Anywhere"
      const locationPart = cleaned.toLowerCase().match(/remote in (.+)/);
      if (locationPart && locationPart[1]) {
        console.log('🔍 Found remote location:', locationPart[1]);
        if (locationPart[1].includes('united states') || locationPart[1].includes('us')) {
          console.log('🔍 Remote job in US, setting location to "US-Anywhere"');
          return 'US-Anywhere';
        }
        return locationPart[1];
      }
    }

    // Handle in-person flag badge text like "In-Person in New York"
    if (cleaned.toLowerCase().includes('in-person in')) {
      const locationPart = cleaned.toLowerCase().match(/in-person in (.+)/);
      if (locationPart && locationPart[1]) {
        console.log('🔍 Found in-person location:', locationPart[1]);
        return locationPart[1];
      }
    }

    // Handle specific remote location formats
    if (cleaned.toLowerCase().includes('us-anywhere') || 
        cleaned.toLowerCase().includes('anywhere')) {
      console.log('🔍 Detected remote location format, keeping as is');
      return cleaned; // Keep "US-Anywhere" as is
    }

    // Standardize remote indicators
    cleaned = cleaned
      .replace(/^remote$/i, 'Remote')
      .replace(/^hybrid$/i, 'Hybrid')
      .replace(/^on-site$/i, 'On-site');

    console.log('🔍 Cleaned location result:', cleaned);
    return cleaned;
  }

  /**
   * Clean job description
   */
  private cleanDescription(description: string): string {
    if (!description) return description;

    // Remove extra whitespace and normalize line breaks
    let cleaned = description
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return cleaned;
  }

  /**
   * Parse job type from various formats
   */
  private parseJobType(jobType: string, salaryType: string): string {
    console.log('🔍 parseJobType called with:', { jobType, salaryType });
    
    // If salary type is Annual, job type should be Full Time
    if (salaryType === 'Annual') {
      console.log('🔍 Salary type is Annual, setting job type to Full Time');
      return 'Full Time';
    }

    if (!jobType) {
      console.log('🔍 No job type found, checking remote flag badge');
      // If no job type found, try to get it from remote flag badge
      const remoteFlag = document.querySelector('.remote-flag-badge-basic');
      if (remoteFlag) {
        const flagText = remoteFlag.textContent?.trim() || '';
        console.log('🔍 Using remote flag badge as job type:', flagText);
        return flagText;
      }
      console.log('🔍 No remote flag badge found, defaulting to Full Time');
      return 'Full Time'; // Default assumption
    }

    // Standardize common job types
    const typeMapping: Record<string, string> = {
      'full-time': 'Full Time',
      'fulltime': 'Full Time',
      'part-time': 'Part Time',
      'parttime': 'Part Time',
      'contract': 'Contract',
      'temporary': 'Temporary',
      'internship': 'Internship',
      'remote': 'Remote',
      'hybrid': 'Hybrid',
      'in-person': 'In-Person'
    };

    const lowerType = jobType.toLowerCase().trim();
    const result = typeMapping[lowerType] || jobType;
    console.log('🔍 Job type mapping result:', result);
    return result;
  }

  /**
   * Parse posted date from various formats
   */
  private parsePostedDate(postedDate: string): string {
    console.log('🔍 parsePostedDate called with:', postedDate);
    
    if (!postedDate) {
      console.log('🔍 No posted date provided');
      return postedDate;
    }

    // Handle relative dates like "2 days ago", "1 week ago"
    const now = new Date();
    
    if (postedDate.includes('hour') || postedDate.includes('hr')) {
      const hours = parseInt(postedDate.match(/\d+/)?.[0] || '0');
      const date = new Date(now.getTime() - (hours * 60 * 60 * 1000));
      console.log('🔍 Parsed as hours ago:', date.toISOString());
      return date.toISOString();
    }
    
    if (postedDate.includes('day')) {
      const days = parseInt(postedDate.match(/\d+/)?.[0] || '0');
      const date = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      console.log('🔍 Parsed as days ago:', date.toISOString());
      return date.toISOString();
    }
    
    if (postedDate.includes('week')) {
      const weeks = parseInt(postedDate.match(/\d+/)?.[0] || '0');
      const date = new Date(now.getTime() - (weeks * 7 * 24 * 60 * 60 * 1000));
      console.log('🔍 Parsed as weeks ago:', date.toISOString());
      return date.toISOString();
    }
    
    if (postedDate.includes('month')) {
      const months = parseInt(postedDate.match(/\d+/)?.[0] || '0');
      const date = new Date(now);
      date.setMonth(date.getMonth() - months);
      console.log('🔍 Parsed as months ago:', date.toISOString());
      return date.toISOString();
    }
    
    if (postedDate.includes('year')) {
      const years = parseInt(postedDate.match(/\d+/)?.[0] || '0');
      const date = new Date(now);
      date.setFullYear(date.getFullYear() - years);
      console.log('🔍 Parsed as years ago:', date.toISOString());
      return date.toISOString();
    }

    // Handle "Today" case
    if (postedDate.toLowerCase().includes('today')) {
      console.log('🔍 Parsed as today:', now.toISOString());
      return now.toISOString();
    }

    // If it's already a proper date, return as is
    console.log('🔍 Returning posted date as is:', postedDate);
    return postedDate;
  }

  /**
   * Generate a unique job ID based on available data
   */
  private generateJobId(jobData: JobData): string {
    const url = window.location.href;
    const title = jobData.position || '';
    const company = jobData.organization || '';
    
    // Use URL path if available
    if (url.includes('/jobs/') || url.includes('/job/')) {
      const pathMatch = url.match(/\/(jobs?\/[^/?]+)/);
      if (pathMatch) {
        return `theladders_${pathMatch[1].replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
    }
    
    // Fallback to title and company hash
    const hash = this.simpleHash(title + company);
    return `theladders_${hash}`;
  }

  /**
   * Simple hash function for generating IDs
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if current page is a job detail page
   */
  isJobDetailPage(): boolean {
    const url = window.location.href.toLowerCase();
    return url.includes('/jobs/') || url.includes('/job/') || 
           document.querySelector('h1') !== null;
  }

  /**
   * Check if current page is a job listing page
   */
  isJobListingPage(): boolean {
    const url = window.location.href.toLowerCase();
    return url.includes('/search') || url.includes('/jobs') ||
           document.querySelector('.job-list, .jobs-container, .search-results') !== null;
  }

  /**
   * Get all job cards from listing page
   */
  getJobCards(): Element[] {
    const jobListSelectors = [
      '.job-list .job-card',
      '.jobs-container .job-card',
      '.search-results .job-card',
      '.job-card',
      '[data-testid="job-card"]'
    ];

    for (const selector of jobListSelectors) {
      const cards = Array.from(document.querySelectorAll(selector));
      if (cards.length > 0) {
        return cards;
      }
    }

    return [];
  }
}

// Export for use in other modules
export default TheLaddersExtractor;
