// Greenhouse-specific extraction logic
import { JobExtractor } from '@/utils/enhancedJobExtractor';
import { SiteConfig } from '@/utils/siteDetector';
import { JobData } from '@/types';
import { parseSalary } from '@/utils/salaryParser';

export class GreenhouseExtractor extends JobExtractor {
  constructor() {
    super({
      domain: 'greenhouse.io',
      name: 'Greenhouse',
      enabled: true,
      selectors: {
        jobContainer: 'body, .job__header, .job__description',
        
        title: [
          'h1.section-header.section-header--large.font-primary',
          '.job__title h1',
          'h1[class*="section-header"]',
          '.job__header h1'
        ],
        
        company: [
          '.logo img[alt*="Logo"]',
          '.image-container .logo img[alt]',
          '[class*="logo"] img[alt]',
          '.job__header .logo img[alt]'
        ],
        
        location: [
          '.job__location div',
          '.job__location',
          '[class*="location"] div',
          '.job__header [class*="location"]'
        ],
        
        description: [
          '.job__description.body',
          '.job__description',
          '[class*="description"] .body',
          '.body'
        ]
      }
    });
  }

  extractJobData(): JobData | null {
    const jobContainer = this.findJobContainer();
    if (!jobContainer) return null;

    const position = this.extractTextWithFallbacks(jobContainer, this.selectors.title);
    let organization = this.extractTextWithFallbacks(jobContainer, this.selectors.company);
    
    // Extract company name from logo alt text if available
    if (!organization) {
      const logoImg = jobContainer.querySelector('.logo img[alt*="Logo"]') as HTMLImageElement;
      if (logoImg && logoImg.alt) {
        organization = logoImg.alt.replace(' Logo', '').replace(' logo', '');
      }
    }

    // Fallback: try to extract from URL or page title
    if (!organization) {
      const url = window.location.href;
      const urlMatch = url.match(/greenhouse\.io\/([^\/]+)/);
      if (urlMatch) {
        organization = urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    if (!position || !organization) return null;

    const location = this.extractTextWithFallbacks(jobContainer, this.selectors.location);
    const description = this.extractTextWithFallbacks(jobContainer, this.selectors.description);
    const environment = this.detectEnvironmentFromDescription(description);
    
    // Extract salary information from description using enhanced parsing
    const salaryInfo = this.extractSalaryFromDescription(description);
    console.log('🔍 Greenhouse: Salary info extracted:', salaryInfo);
    
    // Extract published date and calculate age of posting
    const publishedDate = this.extractPublishedDate();
    const ageOfPosting = this.calculateAgeOfPosting(publishedDate);
    console.log('🔍 Greenhouse: Published date:', publishedDate, 'Age of posting:', ageOfPosting);
    
    // Determine job type based on salary type and description
    const jobType = this.determineJobType(salaryInfo.salary_type, description);
    console.log('🔍 Greenhouse: Job type determined:', jobType);

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
      source: 'greenhouse',
      job_site: 'Greenhouse',
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

  private extractPublishedDate(): string | null {
    try {
      console.log('🔍 Greenhouse: Starting published date extraction...');
      
      // Method 1: Direct regex search across all script content (most reliable)
      const allScripts = Array.from(document.querySelectorAll('script'))
        .map(script => script.textContent || script.innerHTML)
        .join(' ');
      
      console.log('🔍 Greenhouse: Combined script content length:', allScripts.length);
      
      // Also check for script tags with different selectors
      const jsonScripts = Array.from(document.querySelectorAll('script[type="application/json"], script[type="application/ld+json"]'))
        .map(script => script.textContent || script.innerHTML)
        .join(' ');
      
      console.log('🔍 Greenhouse: JSON script content length:', jsonScripts.length);
      
      // Combine all script content
      const combinedScripts = allScripts + ' ' + jsonScripts;
      console.log('🔍 Greenhouse: Total combined script content length:', combinedScripts.length);
      
      // Look for published_at patterns directly in the combined content
      const publishedPatterns = [
        /"published_at"\s*:\s*"([^"]+)"/g,
        /"created_at"\s*:\s*"([^"]+)"/g,
        /"posted_at"\s*:\s*"([^"]+)"/g,
        /"date_posted"\s*:\s*"([^"]+)"/g,
        /"job_posted"\s*:\s*"([^"]+)"/g,
        /"publishedAt"\s*:\s*"([^"]+)"/g,
        /"createdAt"\s*:\s*"([^"]+)"/g,
        /"postedAt"\s*:\s*"([^"]+)"/g
      ];
      
      // Debug: Check if we can find any published_at references
      if (combinedScripts.includes('published_at')) {
        console.log('🔍 Greenhouse: Found "published_at" in combined scripts');
        // Show a sample of where it appears
        const index = combinedScripts.indexOf('published_at');
        const sample = combinedScripts.substring(Math.max(0, index - 50), index + 100);
        console.log('🔍 Greenhouse: Sample context:', sample);
      } else {
        console.log('🔍 Greenhouse: No "published_at" found in combined scripts');
      }
      
      for (const pattern of publishedPatterns) {
        const matches = Array.from(combinedScripts.matchAll(pattern));
        if (matches.length > 0) {
          const publishedDate = matches[0][1];
          console.log('🔍 Greenhouse: Found published date with direct regex:', publishedDate);
          return publishedDate;
        }
      }
      
      // Method 2: Look for published_at in script tags (common in SPA applications)
      const scriptTags = document.querySelectorAll('script');
      console.log('🔍 Greenhouse: Found', scriptTags.length, 'script tags');
      
      // Debug: Show sample of script content
      if (scriptTags.length > 0) {
        const firstScript = scriptTags[0];
        const content = firstScript.textContent || firstScript.innerHTML;
        console.log('🔍 Greenhouse: First script content sample:', content.substring(0, 200) + '...');
        console.log('🔍 Greenhouse: First script type:', firstScript.type || 'no type');
      }
      
      for (let i = 0; i < scriptTags.length; i++) {
        const script = scriptTags[i];
        const content = script.textContent || script.innerHTML;
        if (content) {
          console.log(`🔍 Greenhouse: Script ${i} content length:`, content.length);
          if (content.includes('published_at')) {
            console.log(`🔍 Greenhouse: Script ${i} contains published_at:`, content.substring(0, 200) + '...');
          }
          if (content.includes('__remixContext')) {
            console.log(`🔍 Greenhouse: Script ${i} contains __remixContext:`, content.substring(0, 200) + '...');
          }
          // Look for various published_at patterns
          const patterns = [
            /"published_at":"([^"]+)"/,
            /"created_at":"([^"]+)"/,
            /"posted_at":"([^"]+)"/,
            /"date_posted":"([^"]+)"/,
            /"job_posted":"([^"]+)"/,
            /"publishedAt":"([^"]+)"/,
            /"createdAt":"([^"]+)"/,
            /"postedAt":"([^"]+)"/
          ];
          
          // Special pattern for window.__remixContext
          if (content.includes('window.__remixContext')) {
            console.log('🔍 Greenhouse: Found window.__remixContext, parsing...');
            try {
              // Extract the JSON part after window.__remixContext =
              // Use a more robust regex that handles nested objects
              const remixMatch = content.match(/window\.__remixContext\s*=\s*({[\s\S]*?});/);
              if (remixMatch) {
                const remixData = JSON.parse(remixMatch[1]);
                console.log('🔍 Greenhouse: Parsed __remixContext successfully');
                
                // Navigate to the jobPost.published_at
                if (remixData.state && remixData.state.loaderData && remixData.state.loaderData.root && remixData.state.loaderData.root.routes) {
                  const routes = remixData.state.loaderData.root.routes;
                  for (const routeKey in routes) {
                    const route = routes[routeKey];
                    if (route.jobPost && route.jobPost.published_at) {
                      console.log('🔍 Greenhouse: Found jobPost.published_at in __remixContext:', route.jobPost.published_at);
                      return route.jobPost.published_at;
                    }
                  }
                }
              }
            } catch (e) {
              console.log('🔍 Greenhouse: Error parsing __remixContext:', e instanceof Error ? e.message : String(e));
              
              // Fallback: try to extract published_at directly with regex
              const publishedMatch = content.match(/"published_at":"([^"]+)"/);
              if (publishedMatch) {
                console.log('🔍 Greenhouse: Found published_at with fallback regex:', publishedMatch[1]);
                return publishedMatch[1];
              }
            }
          }
          
          for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
              console.log('🔍 Greenhouse: Found published date with pattern:', pattern, '->', match[1]);
              return match[1];
            }
          }
          
          // Also try to parse as JSON and look for published_at
          try {
            const jsonData = JSON.parse(content);
            if (jsonData.published_at) {
              console.log('🔍 Greenhouse: Found published_at in JSON:', jsonData.published_at);
              return jsonData.published_at;
            }
            if (jsonData.created_at) {
              console.log('🔍 Greenhouse: Found created_at in JSON:', jsonData.created_at);
              return jsonData.created_at;
            }
            if (jsonData.posted_at) {
              console.log('🔍 Greenhouse: Found posted_at in JSON:', jsonData.posted_at);
              return jsonData.posted_at;
            }
            // Check nested objects
            if (jsonData.job && jsonData.job.published_at) {
              console.log('🔍 Greenhouse: Found job.published_at in JSON:', jsonData.job.published_at);
              return jsonData.job.published_at;
            }
            if (jsonData.job && jsonData.job.created_at) {
              console.log('🔍 Greenhouse: Found job.created_at in JSON:', jsonData.job.created_at);
              return jsonData.job.created_at;
            }
            if (jsonData.data && jsonData.data.published_at) {
              console.log('🔍 Greenhouse: Found data.published_at in JSON:', jsonData.data.published_at);
              return jsonData.data.published_at;
            }
            if (jsonData.data && jsonData.data.created_at) {
              console.log('🔍 Greenhouse: Found data.created_at in JSON:', jsonData.data.created_at);
              return jsonData.data.created_at;
            }
            // Check for Remix context structure
            if (jsonData.state && jsonData.state.loaderData && jsonData.state.loaderData.root && jsonData.state.loaderData.root.routes) {
              const routes = jsonData.state.loaderData.root.routes;
              for (const routeKey in routes) {
                const route = routes[routeKey];
                if (route.jobPost && route.jobPost.published_at) {
                  console.log('🔍 Greenhouse: Found jobPost.published_at in Remix context:', route.jobPost.published_at);
                  return route.jobPost.published_at;
                }
              }
            }
          } catch (e) {
            // Continue searching if JSON parsing fails
          }
        }
      }
      
      // Look for data attributes
      const elementsWithData = document.querySelectorAll('[data-published-at], [data-published], [data-posted-at], [data-created-at]');
      for (const element of elementsWithData) {
        const publishedAt = element.getAttribute('data-published-at') || 
                           element.getAttribute('data-published') || 
                           element.getAttribute('data-posted-at') ||
                           element.getAttribute('data-created-at');
        if (publishedAt) {
          console.log('🔍 Greenhouse: Found published date in data attribute:', publishedAt);
          return publishedAt;
        }
      }
      
      // Look for meta tags
      const metaPublished = document.querySelector('meta[property="article:published_time"], meta[name="published_at"], meta[name="created_at"]');
      if (metaPublished) {
        const content = metaPublished.getAttribute('content');
        console.log('🔍 Greenhouse: Found published date in meta tag:', content);
        return content;
      }
      
      // Look for time elements
      const timeElements = document.querySelectorAll('time[datetime]');
      for (const timeEl of timeElements) {
        const datetime = timeEl.getAttribute('datetime');
        if (datetime) {
          console.log('🔍 Greenhouse: Found published date in time element:', datetime);
          return datetime;
        }
      }
      
    } catch (error) {
      console.warn('Error extracting published date:', error);
    }
    
    console.log('🔍 Greenhouse: No published date found');
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
      
      // Convert to days (using the same method as Greenhouse)
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      // Check if it's "new" (within 7 days) - similar to Greenhouse logic
      const sevenDaysAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
      const isNew = published.getTime() > sevenDaysAgo;
      
      if (isNew) {
        if (diffInDays === 0) {
          return 'Today';
        } else if (diffInDays === 1) {
          return '1 day ago';
        } else if (diffInDays < 7) {
          return `${diffInDays} days ago`;
        }
      }
      
      // For older posts, use more precise calculations
      if (diffInDays < 30) {
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

  private extractSalaryFromDescription(description: string): { salary: string; salary_type: 'annual' | 'hourly' | 'monthly' | 'contract'; salary_min: number | null; salary_max: number | null } {
    if (!description) {
      return { salary: 'Not specified', salary_type: 'annual', salary_min: null, salary_max: null };
    }

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
          
          return {
            salary: salaryText,
            salary_type: 'annual',
            salary_min: value,
            salary_max: value
          };
        }
      }
    }

    // Fallback to the general salary parser
    return parseSalary(description);
  }

  private determineJobType(salaryType: string, description: string): string {
    // If salary is annual, default to Full Time
    if (salaryType === 'annual') {
      return 'Full Time';
    }
    
    // If salary is hourly, check for part-time indicators
    if (salaryType === 'hourly') {
      // Check description for part-time indicators
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
      
      // Default hourly to Full Time unless part-time indicators found
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
}
