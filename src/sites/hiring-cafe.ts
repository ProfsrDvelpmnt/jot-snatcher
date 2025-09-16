// Hiring.Cafe-specific extraction logic - CARD-BASED LAYOUT VERSION
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
        // Main job container - look for the detailed view panel first, then fallback to cards
        jobContainer: [
          '.flex.flex-col.items-start.justify-start.text-start.w-full.bg-white.p-6', // Detailed view panel
          '.infinite-scroll-component__outerdiv', // Card grid container
          '.job-details',
          '.job-container', 
          '.content',
          'main',
          'body'
        ],
        
        // Job title selectors - prioritize detailed view, then card view
        title: [
          'h2.font-extrabold.text-3xl.text-gray-800.mb-4', // Detailed view title with exact classes
          'h2.font-extrabold.text-3xl.text-gray-800', // Detailed view title
          '.font-bold.text-start.line-clamp-3', // Card title
          'h1.job-title',
          '.job-header h1',
          'h1',
          '.job-title'
        ],
        
        // Company name selectors
        company: [
          '.text-xl.font-semibold.text-gray-700.flex-none', // Detailed view company with exact classes
          '.text-xl.font-semibold.text-gray-700', // Detailed view company
          '.company-name',
          '.job-company',
          '[data-company]',
          '.company'
        ],
        
        // Location selectors
        location: [
          '.flex.space-x-2 svg + span', // Location in detailed view (next to location icon)
          '.line-clamp-2', // Card location (within the location container)
          '.job-location',
          '.location',
          '[data-location]',
          '.job-loc'
        ],
        
        // Salary selectors - look for salary badges in detailed view
        salary: [
          '.rounded.text-xs.px-3.py-1.border.border-gray-400.font-bold', // Salary badge (will be filtered in extraction)
          '.salary',
          '.compensation',
          '[data-salary]',
          '.salary-info'
        ],
        
        // Description selectors - look in detailed view
        description: [
          'article.prose.prose-h1\\:text-2xl.pt-4.pb-16', // Exact article selector from your HTML
          '.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl article.prose div', // Main job description content
          '.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl article.prose', // Main job description container
          '.flex.flex-col.space-y-3', // Responsibilities and requirements sections
          '.job-description',
          '.description',
          '.content .text',
          '.job-content'
        ],

        // Job ID selectors for consistent job URLs
        jobId: [
          'a[href*="/job/"]', // Updated to match /job/ pattern
          'a[href*="/jobs/"]',
          '.job-link[href*="/jobs/"]',
          '[data-job-id]',
          'a[data-job-id]'
        ],

        // Posted date selectors - exact selector for "Posted Xh ago"
        postedDate: [
          '.text-xs.text-cyan-700.font-bold.flex-none', // "Posted Xh ago" with exact classes
          '.text-xs.text-cyan-700.font-bold', // "Posted Xh ago" in detailed view
          '.job-posted',
          '.posted-date',
          '.date-posted'
        ],

        // Job type selectors - look for badges in detailed view
        jobType: [
          '.rounded.text-xs.px-3.py-1.border.border-gray-400.font-bold', // Job type badges
          '.job-type',
          '.employment-type',
          '.work-type',
          '[class*="type"]', // Any element with "type" in class name
          '[class*="employment"]', // Any element with "employment" in class name
          '[class*="work"]' // Any element with "work" in class name
        ]
      }
    });
  }

  async extractJobData(): Promise<JobData | null> {
    // First, wait for the detailed view to load if it's not already visible
    console.log('Hiring.Cafe: Waiting for detailed view to load...');
    const jobData = await this.waitForDetailedView();
    
    if (jobData) {
      console.log('Hiring.Cafe: Job data extracted from detailed view');
      return jobData;
    }
    
    // If no detailed view, try to find job container on main page
    console.log('Hiring.Cafe: No detailed view found, looking for job container on main page...');
    const jobContainer = this.findJobContainer();
    if (!jobContainer) {
      console.log('Hiring.Cafe: No job container found');
      return null;
    }

    console.log('Hiring.Cafe: Job container found:', jobContainer);

    // Debug: Check what elements are available on the page
    console.log('Hiring.Cafe: Debugging page structure...');
    console.log('Hiring.Cafe: Looking for detailed view panel...');
    const detailedView = document.querySelector('.flex.flex-col.items-start.justify-start.text-start.w-full.bg-white.p-6');
    console.log('Hiring.Cafe: Detailed view found:', detailedView);
    
    console.log('Hiring.Cafe: Looking for card grid...');
    const cardGrid = document.querySelector('.infinite-scroll-component__outerdiv');
    console.log('Hiring.Cafe: Card grid found:', cardGrid);
    
    console.log('Hiring.Cafe: Looking for job description container...');
    const jobDescContainer = document.querySelector('.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl');
    console.log('Hiring.Cafe: Job description container found:', jobDescContainer);
    
    console.log('Hiring.Cafe: Looking for company info section...');
    const companySection = document.querySelector('.flex.flex-col.space-y-6.text-gray-700.w-full');
    console.log('Hiring.Cafe: Company section found:', companySection);
    
    console.log('Hiring.Cafe: Looking for job titles...');
    const titleElements = document.querySelectorAll('h1, h2, h3, [class*="title"], [class*="job"]');
    console.log('Hiring.Cafe: Title elements found:', Array.from(titleElements).map(el => ({
      tag: el.tagName,
      classes: el.className,
      text: el.textContent?.trim().substring(0, 50)
    })));
    
    console.log('Hiring.Cafe: Looking for all elements with "flex" class...');
    const flexElements = document.querySelectorAll('[class*="flex"]');
    console.log('Hiring.Cafe: Flex elements found:', Array.from(flexElements).slice(0, 10).map(el => ({
      tag: el.tagName,
      classes: el.className,
      text: el.textContent?.trim().substring(0, 30)
    })));

    // Check if we're in the detailed view (preferred) or card view
    const isDetailedView = jobContainer.classList.contains('bg-white') && 
                          jobContainer.classList.contains('p-6');
    
    console.log('Hiring.Cafe: View type:', isDetailedView ? 'Detailed' : 'Card');

    // If we're in card view, try to find a detailed view that might be loading
    if (!isDetailedView) {
      if (detailedView) {
        console.log('Hiring.Cafe: Found detailed view, switching to it');
        return this.extractFromDetailedView(detailedView);
      }
    }

    // Extract basic job information
    console.log('Hiring.Cafe: Trying to extract position with selectors:', this.selectors.title);
    const position = this.extractTextWithFallbacks(jobContainer, this.selectors.title);
    console.log('Hiring.Cafe: Position extracted:', position);
    
    console.log('Hiring.Cafe: Trying to extract organization with selectors:', this.selectors.company);
    const organization = this.cleanCompanyName(this.extractTextWithFallbacks(jobContainer, this.selectors.company));
    console.log('Hiring.Cafe: Organization extracted:', organization);

    console.log('Hiring.Cafe: Basic info extracted:', { position, organization });

    if (!position || !organization) {
      console.log('Hiring.Cafe: Missing required fields', { position, organization });
      return null;
    }

    // Extract additional job details
    const location = this.extractLocation(jobContainer, isDetailedView);
    const salaryText = this.extractSalarySafely(jobContainer);
    const description = this.extractDescription(jobContainer, isDetailedView);
    const jobType = this.extractJobType(jobContainer, isDetailedView);
    const postedDate = this.extractTextWithFallbacks(jobContainer, this.selectors.postedDate);
    const jobId = this.extractJobId();

    console.log('Hiring.Cafe: Additional info extracted:', { 
      location, salaryText, jobType, postedDate, jobId 
    });

    // Parse salary and environment
    const parsedSalary = parseSalary(salaryText);
    const environment = this.extractEnvironment(location, description, jobContainer);

    // Create consistent job URL
    const jobUrl = jobId ? `https://hiring.cafe/jobs/${jobId}/` : window.location.href;

    return {
      organization: organization.trim(),
      position: position.trim(),
      link: jobUrl,
      salary: parsedSalary.salary,
      salary_type: parsedSalary.salary_type,
      salaryTypeDisplay: this.capitalizeSalaryType(parsedSalary.salary_type),
      salary_min: parsedSalary.salary_min,
      salary_max: parsedSalary.salary_max,
      location: location || 'Not specified',
      type: jobType || 'Not specified',
      environment: environment || 'Not specified',
      stage: 'Saved',
      source: 'hiring-cafe',
      job_site: 'Hiring.Cafe',
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

  // Extract job data specifically from detailed view
  private extractFromDetailedView(detailedView: Element): JobData | null {
    console.log('Hiring.Cafe: Extracting from detailed view');

    // For Chakra UI modals, try to find the modal body first
    const modalBody = detailedView.querySelector('[id*="chakra-modal--body"]');
    if (modalBody) {
      console.log('Hiring.Cafe: Found Chakra modal body, extracting from it');
      return this.extractFromDetailedView(modalBody);
    }

    // Extract basic job information from detailed view
    const position = this.extractTextWithFallbacks(detailedView, ['h2.font-extrabold.text-3xl.text-gray-800']);
    const organization = this.cleanCompanyName(this.extractTextWithFallbacks(detailedView, ['.text-xl.font-semibold.text-gray-700']));

    if (!position || !organization) {
      console.log('Hiring.Cafe: Missing required fields in detailed view', { position, organization });
      return null;
    }

    // Extract additional details
    const location = this.extractLocation(detailedView, true);
    const salaryText = this.extractSalarySafely(detailedView);
    
    // Find the job description container first, then extract description from it
    let description = '';
    const jobDescContainer = detailedView.querySelector('.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl');
    if (jobDescContainer) {
      console.log('Hiring.Cafe: Found job description container, extracting description from it');
      description = this.extractDescription(jobDescContainer, true) || '';
    } else {
      console.log('Hiring.Cafe: Job description container not found, trying from detailed view');
      description = this.extractDescription(detailedView, true) || '';
    }
    
    const jobType = this.extractJobType(detailedView, true);
    const postedDate = this.extractTextWithFallbacks(detailedView, ['.text-xs.text-cyan-700.font-bold.flex-none', '.text-xs.text-cyan-700.font-bold']);
    const jobId = this.extractJobId();

    // Parse salary and environment
    const parsedSalary = parseSalary(salaryText);
    const environment = this.extractEnvironment(location, description, detailedView);

    // Create consistent job URL
    const jobUrl = jobId ? `https://hiring.cafe/jobs/${jobId}/` : window.location.href;

    return {
      organization: organization.trim(),
      position: position.trim(),
      link: jobUrl,
      salary: parsedSalary.salary,
      salary_type: parsedSalary.salary_type,
      salaryTypeDisplay: this.capitalizeSalaryType(parsedSalary.salary_type),
      salary_min: parsedSalary.salary_min,
      salary_max: parsedSalary.salary_max,
      location: location || 'Not specified',
      type: jobType || 'Not specified',
      environment: environment || 'Not specified',
      stage: 'Saved',
      source: 'hiring-cafe',
      job_site: 'Hiring.Cafe',
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

  // Extract location with special handling for card vs detailed view
  private extractLocation(container: Element, isDetailedView: boolean): string | null {
    if (isDetailedView) {
      // In detailed view, look for location in the specific structure
      // First try the exact structure you provided
      const locationElement = container.querySelector('.flex.space-x-2 svg + span');
      if (locationElement) {
        const locationText = locationElement.textContent?.trim();
        if (locationText && !locationText.includes('Website') && !locationText.includes('View All Jobs')) {
          console.log('Hiring.Cafe: Found location from svg + span:', locationText);
          return locationText;
        }
      }
      
      // Try to find any span with location-like text
      const allSpans = container.querySelectorAll('span');
      for (const span of allSpans) {
        const text = span.textContent?.trim();
        if (text && text.includes(',') && (text.includes('California') || text.includes('United States') || text.includes('State'))) {
          console.log('Hiring.Cafe: Found location from span search:', text);
          return text;
        }
      }
    } else {
      // In card view, look for location in the card structure
      const locationElement = container.querySelector('.line-clamp-2');
      if (locationElement) {
        return locationElement.textContent?.trim() || null;
      }
    }
    
    // Fallback to general selectors
    return this.extractTextWithFallbacks(container, this.selectors.location);
  }

  // Extract description with special handling for detailed view
  private extractDescription(container: Element, isDetailedView: boolean): string | null {
    if (isDetailedView) {
      console.log('Hiring.Cafe: Extracting description in detailed view...');
      
      // First try the exact article selector from the HTML you provided
      console.log('Hiring.Cafe: Looking for exact article element...');
      
      // First try to find the "Copied!" button, then look for the article right after it
      console.log('Hiring.Cafe: Looking for "Copied!" button...');
      const copiedButton = container.querySelector('button.mt-4.inline-flex.items-center.space-x-2.bg-pink-50.rounded.px-4.py-2.text-pink-600.text-xs.font-semibold');
      
      if (copiedButton) {
        console.log('Hiring.Cafe: Found "Copied!" button!');
        
        // Look for the article element that comes right after this button
        const articleElement = copiedButton.parentElement?.querySelector('article');
        
        if (articleElement) {
          console.log('Hiring.Cafe: Found article element after "Copied!" button!');
          let description = articleElement.textContent?.trim() || '';
          console.log('Hiring.Cafe: Description length from article after button:', description.length);
          
          // Also try to get the company information and add it
          const companyInfo = this.extractCompanyInfo(container);
          if (companyInfo) {
            description += '\n\n--- COMPANY INFORMATION ---\n' + companyInfo;
          }
          
          return description;
        } else {
          console.log('Hiring.Cafe: No article found after "Copied!" button');
        }
      } else {
        console.log('Hiring.Cafe: "Copied!" button not found, trying job description container...');
        
        // Fallback: try to find the job description container
        const jobDescContainer = container.querySelector('.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl');
        
        if (jobDescContainer) {
          console.log('Hiring.Cafe: Found job description container!');
          
          // Now look for the article within this container
          const articleSelectors = [
            'article.prose.prose-h1\\:text-2xl.pt-4.pb-16',
            'article.prose.pt-4.pb-16',
            'article.prose',
            'article[class*="prose"]'
          ];
          
          let exactArticle = null;
          for (const selector of articleSelectors) {
            console.log('Hiring.Cafe: Trying article selector in container:', selector);
            exactArticle = jobDescContainer.querySelector(selector);
            if (exactArticle) {
              console.log('Hiring.Cafe: Found article with selector:', selector);
              break;
            }
          }
          
          if (exactArticle) {
            console.log('Hiring.Cafe: Found exact article element!');
            let description = exactArticle.textContent?.trim() || '';
            console.log('Hiring.Cafe: Description length from exact article:', description.length);
            
            // Also try to get the company information and add it
            const companyInfo = this.extractCompanyInfo(container);
            if (companyInfo) {
              description += '\n\n--- COMPANY INFORMATION ---\n' + companyInfo;
            }
            
            return description;
          } else {
            console.log('Hiring.Cafe: No article found within job description container');
          }
        } else {
          console.log('Hiring.Cafe: Job description container not found, trying direct article selectors...');
          
          // Final fallback: try direct article selectors in the main container
          const articleSelectors = [
            'article.prose.prose-h1\\:text-2xl.pt-4.pb-16',
            'article.prose.pt-4.pb-16',
            'article.prose',
            'article[class*="prose"][class*="pt-4"][class*="pb-16"]'
          ];
          
          let exactArticle = null;
          for (const selector of articleSelectors) {
            console.log('Hiring.Cafe: Trying direct selector:', selector);
            exactArticle = container.querySelector(selector);
            if (exactArticle) {
              console.log('Hiring.Cafe: Found article with direct selector:', selector);
              break;
            }
          }
          
          if (exactArticle) {
            console.log('Hiring.Cafe: Found exact article element!');
            let description = exactArticle.textContent?.trim() || '';
            console.log('Hiring.Cafe: Description length from exact article:', description.length);
            
            // Also try to get the company information and add it
            const companyInfo = this.extractCompanyInfo(container);
            if (companyInfo) {
              description += '\n\n--- COMPANY INFORMATION ---\n' + companyInfo;
            }
            
            return description;
          }
        }
      }
      
      // If we get here, no article was found, so log debug info
      console.log('Hiring.Cafe: No article element found with any selector');
      
      // Debug: Log all article elements in the container
      const allArticles = container.querySelectorAll('article');
      console.log('Hiring.Cafe: Found', allArticles.length, 'article elements in container');
      allArticles.forEach((article, index) => {
        console.log(`Hiring.Cafe: Article ${index}:`, {
          classes: article.className,
          textLength: article.textContent?.length || 0,
          firstText: article.textContent?.substring(0, 100) || ''
        });
      });
      
      // Debug: Log all elements with "prose" class
      const proseElements = container.querySelectorAll('[class*="prose"]');
      console.log('Hiring.Cafe: Found', proseElements.length, 'elements with "prose" class');
      proseElements.forEach((element, index) => {
        console.log(`Hiring.Cafe: Prose element ${index}:`, {
          tagName: element.tagName,
          classes: element.className,
          textLength: element.textContent?.length || 0
        });
      });
      
      // Look for the job description section by finding the "Job Description" span first
      console.log('Hiring.Cafe: Looking for "Job Description" span...');
      const jobDescriptionSpans = container.querySelectorAll('span.text-md.border.my-2.px-2.font-semibold.rounded-full.text-gray-600');
      console.log('Hiring.Cafe: Found job description spans:', jobDescriptionSpans.length);
      
      // Also try a more flexible selector for the span
      const flexibleSpans = container.querySelectorAll('span[class*="text-md"][class*="border"][class*="font-semibold"]');
      console.log('Hiring.Cafe: Found flexible spans:', flexibleSpans.length);
      
      // Log what spans we actually found
      if (flexibleSpans.length > 0) {
        console.log('Hiring.Cafe: Flexible spans found:', Array.from(flexibleSpans).map(span => ({
          text: span.textContent?.trim(),
          classes: span.className
        })));
      }
      
      let jobDescriptionContainer = null;
      
      // Look for the span that contains "Job Description" text
      for (const span of jobDescriptionSpans) {
        if (span.textContent?.trim() === 'Job Description') {
          console.log('Hiring.Cafe: Found "Job Description" span, looking for parent container...');
          // Find the parent container that contains this span
          jobDescriptionContainer = span.closest('.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl');
          if (jobDescriptionContainer) {
            console.log('Hiring.Cafe: Found job description container via span parent');
            break;
          }
        }
      }
      
      // Fallback: if not found via span, try the original selectors
      if (!jobDescriptionContainer) {
        console.log('Hiring.Cafe: Not found via span, trying original selectors...');
        const jobDescriptionSelectors = [
          '.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl',
          '.flex.flex-col.items-center.border.shadow-2xl.rounded-3xl',
          'div[class*="border"][class*="shadow"][class*="rounded"]',
          'div[class*="mb-16"][class*="border"]',
          'article.prose'
        ];
        
        for (const selector of jobDescriptionSelectors) {
          const elements = container.querySelectorAll(selector);
          if (elements.length > 1) {
            // If multiple elements found, look for the one with substantial content
            for (let i = 0; i < elements.length; i++) {
              const element = elements[i];
              const text = element.textContent?.trim() || '';
              // Look for elements with substantial content (more than 1000 characters)
              if (text.length > 1000) {
                jobDescriptionContainer = element;
                console.log(`Hiring.Cafe: Found full job description container (element ${i + 1}) with selector: ${selector}, content length: ${text.length}`);
                break;
              }
            }
          } else if (elements.length === 1) {
            jobDescriptionContainer = elements[0];
            console.log(`Hiring.Cafe: Found single job description container with selector: ${selector}`);
          }
          
          if (jobDescriptionContainer) break;
        }
      }
      
      console.log('Hiring.Cafe: Job description container search result:', jobDescriptionContainer);
      
      if (jobDescriptionContainer) {
        console.log('Hiring.Cafe: Found job description container');
        
        // Extract the main description content from the deeply nested div structure
        // Look for the content in the nested divs: article.prose > div > div > div > div...
        let articleContent = jobDescriptionContainer.querySelector('article.prose div div div div div div div div div div div div div div');
        console.log('Hiring.Cafe: Deeply nested div search result:', articleContent);
        
        if (!articleContent) {
          // Fallback: try the article element's direct div
          articleContent = jobDescriptionContainer.querySelector('article.prose div');
          console.log('Hiring.Cafe: Article content div search result:', articleContent);
        }
        
        if (!articleContent) {
          // Fallback: try the article element itself
          articleContent = jobDescriptionContainer.querySelector('article.prose');
          console.log('Hiring.Cafe: Article element search result:', articleContent);
        }
        
        if (articleContent) {
          console.log('Hiring.Cafe: Found article content');
          let description = articleContent.textContent?.trim() || '';
          console.log('Hiring.Cafe: Description length:', description.length);
          
          // Also try to get the company information and add it
          const companyInfo = this.extractCompanyInfo(container);
          if (companyInfo) {
            description += '\n\n--- COMPANY INFORMATION ---\n' + companyInfo;
          }
          
          return description;
        }
      } else {
        console.log('Hiring.Cafe: Job description container not found, trying alternative selectors...');
        
        // Try alternative selectors for job description
        const altSelectors = [
          'article.prose',
          '[class*="prose"]',
          '[class*="description"]',
          'div[class*="border"][class*="rounded"]',
          'div[class*="max-w"]', // Look for content containers
          'div[class*="overflow-auto"]', // Look for scrollable content
          'p', // Look for paragraphs
          'div[class*="px-4"]' // Look for padded content
        ];
        
        for (const selector of altSelectors) {
          const elements = container.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.textContent?.trim();
            if (text && text.length > 500) { // Increased to 500 characters
              console.log(`Hiring.Cafe: Found substantial content with selector ${selector}, length: ${text.length}`);
              console.log('Hiring.Cafe: Content preview:', text.substring(0, 100) + '...');
              
              // Also try to get the company information and add it
              const companyInfo = this.extractCompanyInfo(container);
              if (companyInfo) {
                return text + '\n\n--- COMPANY INFORMATION ---\n' + companyInfo;
              }
              
              return text;
            }
          }
        }
      }
      
      // Fallback: look for all description sections
      const descriptionSections = container.querySelectorAll('.flex.flex-col.space-y-3');
      let descriptionParts: string[] = [];
      
      descriptionSections.forEach(section => {
        const text = section.textContent?.trim();
        if (text && text.length > 10) { // Filter out very short text
          descriptionParts.push(text);
        }
      });
      
      if (descriptionParts.length > 0) {
        return descriptionParts.join('\n\n');
      }
    }
    
    // Fallback to general selectors
    return this.extractTextWithFallbacks(container, this.selectors.description);
  }

  // Extract company information from the company details section
  private extractCompanyInfo(container: Element): string | null {
    const companySection = container.querySelector('.flex.flex-col.space-y-6.text-gray-700.w-full');
    if (!companySection) return null;

    let companyInfo = '';
    
    // Extract company name
    const companyName = companySection.querySelector('.font-bold.text-gray-700.text-xl');
    if (companyName) {
      companyInfo += `Company: ${companyName.textContent?.trim()}\n`;
    }
    
    // Extract company description
    const companyDescription = companySection.querySelector('.text-gray-600');
    if (companyDescription) {
      companyInfo += `Description: ${companyDescription.textContent?.trim()}\n`;
    }
    
    // Extract company details from table
    const table = companySection.querySelector('table');
    if (table) {
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const field = cells[0].textContent?.trim();
          const value = cells[1].textContent?.trim();
          if (field && value) {
            companyInfo += `${field}: ${value}\n`;
          }
        }
      });
    }
    
    return companyInfo.trim() || null;
  }

  // Extract salary from salary badges and job description
  private extractSalaryFromBadges(container: Element): string | null {
    // First try salary badges
    const badges = container.querySelectorAll('.rounded.text-xs.px-3.py-1.border.border-gray-400.font-bold');
    
    for (const badge of badges) {
      const text = badge.textContent?.trim();
      if (text && text.includes('$') && (text.includes('k/yr') || text.includes('/yr') || text.includes('k') || text.includes('year'))) {
        console.log('Hiring.Cafe: Found salary badge:', text);
        return text;
      }
    }
    
    // Fallback: look for salary in job description
    const jobDescriptionContainer = container.querySelector('.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl');
    if (jobDescriptionContainer) {
      const articleContent = jobDescriptionContainer.querySelector('article.prose');
      if (articleContent) {
        const text = articleContent.textContent || '';
        const salaryMatch = text.match(/USD\s+\$[\d,]+\.?\d*\s*-\s*\$[\d,]+\.?\d*\s*\/\s*Hour/i);
        if (salaryMatch) {
          console.log('Hiring.Cafe: Found salary in description:', salaryMatch[0]);
          return salaryMatch[0];
        }
      }
    }
    
    return null;
  }

  // Enhanced salary extraction that avoids job type information
  private extractSalarySafely(container: Element): string | null {
    // First try the specialized salary extraction
    const salaryFromBadges = this.extractSalaryFromBadges(container);
    if (salaryFromBadges) {
      return salaryFromBadges;
    }

    // If no salary found in badges, try the general selectors but filter out job type info
    const salarySelectors = this.selectors.salary || [];
    
    for (const selector of salarySelectors) {
      const elements = container.querySelectorAll(selector);
      
      for (const element of elements) {
        const text = element.textContent?.trim();
        if (text && this.isValidSalaryText(text)) {
          console.log('Hiring.Cafe: Found valid salary text:', text);
          return text;
        }
      }
    }
    
    console.log('Hiring.Cafe: No valid salary found');
    return null;
  }

  // Validate that text contains actual salary information, not job type
  private isValidSalaryText(text: string): boolean {
    // Must contain dollar sign
    if (!text.includes('$')) {
      return false;
    }
    
    // Must contain salary indicators
    const salaryIndicators = [
      'k/yr', '/yr', 'year', 'hour', 'hr', 'annual', 'monthly', 'weekly',
      'salary', 'pay', 'compensation', 'wage', 'rate'
    ];
    
    const hasSalaryIndicator = salaryIndicators.some(indicator => 
      text.toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (!hasSalaryIndicator) {
      return false;
    }
    
    // Must NOT contain job type indicators
    const jobTypeIndicators = [
      'onsite', 'remote', 'hybrid', 'full-time', 'part-time', 'contract',
      'permanent', 'temporary', 'intern', 'internship', 'entry-level',
      'senior', 'junior', 'mid-level', 'freelance', 'consultant'
    ];
    
    const hasJobTypeIndicator = jobTypeIndicators.some(indicator => 
      text.toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (hasJobTypeIndicator) {
      console.log('Hiring.Cafe: Rejecting text with job type indicator:', text);
      return false;
    }
    
    // Must contain numbers (salary amounts)
    const hasNumbers = /\d/.test(text);
    if (!hasNumbers) {
      return false;
    }
    
    return true;
  }

  // Extract job type with special handling for detailed view badges
  private extractJobType(container: Element, isDetailedView: boolean): string | null {
    if (isDetailedView) {
      // In detailed view, look for job type badges (excluding salary badges)
      const badges = container.querySelectorAll('.rounded.text-xs.px-3.py-1.border.border-gray-400.font-bold');
      const jobTypes: string[] = [];
      
      badges.forEach(badge => {
        const text = badge.textContent?.trim();
        if (text && this.isValidJobType(text)) {
          jobTypes.push(text);
        }
      });
      
      if (jobTypes.length > 0) {
        return jobTypes.join(', ');
      }
    }
    
    // Fallback to general selectors with validation
    const fallbackText = this.extractTextWithFallbacks(container, this.selectors.jobType);
    if (fallbackText && this.isValidJobType(fallbackText)) {
      return fallbackText;
    }
    
    // If no valid job type found, return null (will default to "Not specified")
    return null;
  }

  // Validate that text represents a valid job type, not location or other info
  private isValidJobType(text: string): boolean {
    // Must not contain salary indicators
    if (text.includes('$') || text.includes('k/yr') || text.includes('/yr')) {
      console.log('Hiring.Cafe: Rejecting text with salary indicator:', text);
      return false;
    }
    
    // Must not contain salary-related keywords
    const salaryKeywords = [
      'k/yr', '/yr', 'year', 'hour', 'hr', 'annual', 'monthly', 'weekly',
      'salary', 'pay', 'compensation', 'wage', 'rate', 'per hour', 'per year',
      'thousand', 'million', 'dollars', 'usd', 'k', 'm'
    ];
    
    const hasSalaryKeyword = salaryKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasSalaryKeyword) {
      console.log('Hiring.Cafe: Rejecting text with salary keyword:', text);
      return false;
    }
    
    // Must not contain numbers (salary amounts)
    const hasNumbers = /\d/.test(text);
    if (hasNumbers) {
      console.log('Hiring.Cafe: Rejecting text with numbers (likely salary):', text);
      return false;
    }
    
    // Must not contain location indicators
    const locationIndicators = [
      'onsite', 'remote', 'hybrid', 'location', 'address', 'city', 'state',
      'country', 'united states', 'usa', 'us', 'california', 'texas', 'florida',
      'new york', 'chicago', 'atlanta', 'dallas', 'miami', 'seattle', 'denver'
    ];
    
    const hasLocationIndicator = locationIndicators.some(indicator => 
      text.toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (hasLocationIndicator) {
      console.log('Hiring.Cafe: Rejecting text with location indicator:', text);
      return false;
    }
    
    // Must not contain navigation or UI elements
    const uiIndicators = [
      'view all jobs', 'website', 'apply', 'click', 'button', 'link',
      'more info', 'details', 'read more', 'learn more'
    ];
    
    const hasUiIndicator = uiIndicators.some(indicator => 
      text.toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (hasUiIndicator) {
      console.log('Hiring.Cafe: Rejecting text with UI indicator:', text);
      return false;
    }
    
    // Must be a valid employment type (not job title or position)
    const validJobTypes = [
      'full-time', 'full time', 'part-time', 'part time', 'contract', 'seasonal', 
      'temporary', 'permanent', 'internship', 'intern', 'freelance', 'consultant', 'volunteer'
    ];
    
    const isValidJobType = validJobTypes.some(jobType => 
      text.toLowerCase().includes(jobType.toLowerCase())
    );
    
    if (!isValidJobType) {
      console.log('Hiring.Cafe: Rejecting text that is not a valid job type:', text);
      return false;
    }
    
    return true;
  }

  // Extract job ID for consistent job URLs
  private extractJobId(): string | null {
    const jobIdSelectors = this.selectors.jobId || [];
    
    // First try to find job ID in href attributes
    for (const selector of jobIdSelectors) {
      const element = document.querySelector(selector) as HTMLAnchorElement;
      if (element && element.href) {
        // Extract job ID from Hiring.cafe job URL patterns: /job/... or /jobs/12345/
        const jobMatch = element.href.match(/\/job\/([^\/\?]+)/);
        if (jobMatch) {
          console.log(`✅ Hiring.Cafe: Found job ID ${jobMatch[1]} from href: ${element.href}`);
          return jobMatch[1];
        }
        
        const jobsMatch = element.href.match(/\/jobs\/(\d+)\/?/);
        if (jobsMatch) {
          console.log(`✅ Hiring.Cafe: Found job ID ${jobsMatch[1]} from href: ${element.href}`);
          return jobsMatch[1];
        }
      }
    }
    
    // Fallback: try to extract from current URL if it's a job view page
    const currentJobMatch = window.location.href.match(/\/job\/([^\/\?]+)/);
    if (currentJobMatch) {
      console.log(`✅ Hiring.Cafe: Found job ID ${currentJobMatch[1]} from current URL`);
      return currentJobMatch[1];
    }
    
    const currentJobsMatch = window.location.href.match(/\/jobs\/(\d+)\/?/);
    if (currentJobsMatch) {
      console.log(`✅ Hiring.Cafe: Found job ID ${currentJobsMatch[1]} from current URL`);
      return currentJobsMatch[1];
    }
    
    // Fallback: try to extract from data-job-id attribute
    for (const selector of jobIdSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const dataJobId = element.getAttribute('data-job-id');
        if (dataJobId) {
          console.log(`✅ Hiring.Cafe: Found job ID ${dataJobId} from data-job-id attribute`);
          return dataJobId;
        }
      }
    }
    
    console.log('❌ Hiring.Cafe: No job ID found');
    return null;
  }

  // Extract environment from location, description, and badges
  private extractEnvironment(location: string | null, description: string | null, container?: Element): string | null {
    // First try to find environment in badges
    if (container) {
      const environmentFromBadges = this.extractEnvironmentFromBadges(container);
      if (environmentFromBadges) {
        return environmentFromBadges;
      }
    }

    if (location) {
      // Look for environment indicators in location text
      const environmentMatch = location.match(/(Remote|Hybrid|On-site|Onsite|In-person|Work from home|WFH)/i);
      if (environmentMatch) {
        // Normalize the result
        const env = environmentMatch[1].toLowerCase();
        if (env === 'on-site' || env === 'onsite') {
          return 'Onsite';
        }
        return environmentMatch[1];
      }
    }

    // Fallback: detect from description
    if (description) {
      return this.detectEnvironmentFromDescription(description);
    }

    return null;
  }

  // Extract environment from job badges
  private extractEnvironmentFromBadges(container: Element): string | null {
    const badges = container.querySelectorAll('.rounded.text-xs.px-3.py-1.border.border-gray-400.font-bold');
    
    for (const badge of badges) {
      const text = badge.textContent?.trim();
      if (text) {
        const envPatterns = [
          { pattern: /^(remote|work from home|wfh)$/i, value: 'Remote' },
          { pattern: /^(hybrid|flexible)$/i, value: 'Hybrid' },
          { pattern: /^(on-site|onsite|in-person|in office)$/i, value: 'Onsite' }
        ];

        for (const { pattern, value } of envPatterns) {
          if (pattern.test(text)) {
            console.log('Hiring.Cafe: Found environment from badge:', text, '->', value);
            return value;
          }
        }
      }
    }

    return null;
  }

  // Detect environment from job description text
  public detectEnvironmentFromDescription(description: string): string {
    const envPatterns = [
      { pattern: /(remote|work from home|wfh)/i, value: 'Remote' },
      { pattern: /(hybrid|flexible)/i, value: 'Hybrid' },
      { pattern: /(on-site|onsite|in-person|in office)/i, value: 'Onsite' }
    ];

    for (const { pattern, value } of envPatterns) {
      if (pattern.test(description)) {
        return value;
      }
    }

    return 'Not specified';
  }

  // Capitalize salary type to match other job fields
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

  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `JOB-${timestamp}-${random}`;
  }

  // Method to wait for detailed view to load after clicking a card
  public async waitForDetailedView(timeoutMs: number = 10000): Promise<JobData | null> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkForDetailedView = () => {
        // Try multiple selectors to find the modal/detailed view
        const modalSelectors = [
          '[role="dialog"][id*="chakra-modal"]', // Chakra UI modal
          '#chakra-modal--body-\\:rgb\\:',
          '[id*="chakra-modal"]',
          '.flex.flex-col.items-start.justify-start.text-start.w-full.bg-white.p-6',
          '[class*="modal"]',
          '[role="dialog"]',
          '.fixed',
          '.absolute'
        ];
        
        let detailedView = null;
        for (const selector of modalSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent?.includes('Job Description')) {
            detailedView = element;
            console.log(`Hiring.Cafe: Found modal with selector: ${selector}`);
            break;
          }
        }
        
        const elapsed = Date.now() - startTime;
        
        if (detailedView) {
          console.log(`Hiring.Cafe: Detailed view loaded after ${elapsed}ms, checking for content...`);
          
          // Check if the detailed view has actual content (not just the container)
          const hasCopiedButton = detailedView.querySelector('button.mt-4.inline-flex.items-center.space-x-2.bg-pink-50.rounded.px-4.py-2.text-pink-600.text-xs.font-semibold');
          const hasJobDescContainer = detailedView.querySelector('.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl');
          const hasArticle = detailedView.querySelector('article');
          const hasDescription = detailedView.querySelector('[class*="prose"]');
          const hasJobDescription = detailedView.querySelector('span[class*="Job Description"]');
          
          // Also check if we have any job description content at all
          const hasAnyJobContent = detailedView.querySelector('span.text-md.border.my-2.px-2.font-semibold.rounded-full.text-gray-600');
          
          // Check for the specific description div structure
          const hasDescriptionDiv = detailedView.querySelector('div.max-w-sm.md\\:max-w-md.lg\\:max-w-full.overflow-auto.px-4');
          
          // Check for Chakra UI modal content
          const hasChakraModalBody = detailedView.querySelector('[id*="chakra-modal--body"]');
          const hasJobContent = detailedView.textContent?.includes('Duties') || detailedView.textContent?.includes('Responsibilities');
          
          console.log(`Hiring.Cafe: Content check - Copied Button: ${!!hasCopiedButton}, Job Desc Container: ${!!hasJobDescContainer}, Article: ${!!hasArticle}, Prose: ${!!hasDescription}, Job Description span: ${!!hasJobDescription}, Any Job Content: ${!!hasAnyJobContent}, Description Div: ${!!hasDescriptionDiv}, Chakra Modal Body: ${!!hasChakraModalBody}, Has Job Content: ${!!hasJobContent}`);
          
          // If we have content, extract it
          if (hasCopiedButton || hasJobDescContainer || hasArticle || hasDescription || hasJobDescription || hasAnyJobContent || hasDescriptionDiv || hasChakraModalBody || hasJobContent) {
            console.log(`Hiring.Cafe: Content found after ${elapsed}ms, extracting data`);
            const jobData = this.extractFromDetailedView(detailedView);
            resolve(jobData);
            return;
          }
          
          // If we have the container but no content yet, keep waiting
          if (elapsed < timeoutMs) {
            console.log(`Hiring.Cafe: Detailed view container found but no content yet, waiting... ${elapsed}ms elapsed`);
            setTimeout(checkForDetailedView, 500);
            return;
          }
        }
        
        if (elapsed > timeoutMs) {
          console.log(`Hiring.Cafe: Timeout waiting for detailed view after ${elapsed}ms`);
          resolve(null);
          return;
        }
        
        // Log progress every 1000ms
        if (elapsed % 1000 < 200) {
          console.log(`Hiring.Cafe: Still waiting for detailed view... ${elapsed}ms elapsed`);
        }
        
        // Check again in 500ms
        setTimeout(checkForDetailedView, 500);
      };
      
      checkForDetailedView();
    });
  }

  // Clean company name by removing @ symbol and other unwanted characters
  private cleanCompanyName(companyName: string | null): string | null {
    if (!companyName) {
      return null;
    }

    // Remove @ symbol and any leading/trailing whitespace
    let cleaned = companyName.trim();
    
    // Remove @ symbol if it's at the beginning
    if (cleaned.startsWith('@')) {
      cleaned = cleaned.substring(1).trim();
    }
    
    // Remove any other @ symbols that might be in the middle
    cleaned = cleaned.replace(/@/g, '');
    
    return cleaned || null;
  }
}
