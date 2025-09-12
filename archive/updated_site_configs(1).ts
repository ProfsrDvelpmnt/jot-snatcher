// src/config/sites.ts - Updated SITE_CONFIGS
export const SITE_CONFIGS: { [key: string]: SiteConfig } = {
  indeed: {
    domain: 'indeed.com',
    name: 'Indeed',
    enabled: true,
    extractorClass: 'IndeedExtractor', // Your existing extractor
    selectors: {
      // Your existing Indeed selectors...
    }
  },
  
  linkedin: {
    domain: 'linkedin.com',
    name: 'LinkedIn',
    enabled: true,
    extractorClass: 'LinkedInExtractor',
    selectors: {
      jobContainer: '.jobs-search__job-details--container, .job-details-jobs-unified-top-card, [data-job-id]',
      // Additional selectors defined in LinkedInExtractor class
    }
  },
  
  monster: {
    domain: 'monster.com',
    name: 'Monster',
    enabled: true,
    extractorClass: 'MonsterExtractor',
    selectors: {
      jobContainer: '.JobView, .job-view-container, [data-test-id="job-view"]'
    }
  },
  
  ziprecruiter: {
    domain: 'ziprecruiter.com',
    name: 'ZipRecruiter',
    enabled: true,
    extractorClass: 'ZipRecruiterExtractor',
    selectors: {
      jobContainer: '.job_content, .jobDescriptionSection, [data-test="job-description"]'
    }
  },
  
  greenhouse: {
    domain: 'greenhouse.io',
    name: 'Greenhouse',
    enabled: true,
    extractorClass: 'GreenhouseExtractor',
    selectors: {
      jobContainer: '.job-post, .application, [data-mapped="true"]'
    }
  },
  
  'hiring-cafe': {
    domain: 'hiring.cafe',
    name: 'Hiring.Cafe',
    enabled: true,
    extractorClass: 'HiringCafeExtractor',
    selectors: {
      jobContainer: '.job-details, .job-container, .content'
    }
  }
};

// src/extractors/ExtractorManager.ts - Updated to handle new sites
import { LinkedInExtractor } from '../sites/linkedin';
import { MonsterExtractor } from '../sites/monster';
import { ZipRecruiterExtractor } from '../sites/ziprecruiter';
import { GreenhouseExtractor } from '../sites/greenhouse';
import { HiringCafeExtractor } from '../sites/hiring-cafe';

export class ExtractorManager {
  private extractors: Map<string, JobExtractor> = new Map();

  constructor() {
    // Initialize all extractors
    this.extractors.set('linkedin', new LinkedInExtractor());
    this.extractors.set('monster', new MonsterExtractor());
    this.extractors.set('ziprecruiter', new ZipRecruiterExtractor());
    this.extractors.set('greenhouse', new GreenhouseExtractor());
    this.extractors.set('hiring-cafe', new HiringCafeExtractor());
    // Keep your existing extractors
    // this.extractors.set('indeed', new IndeedExtractor());
  }

  extractCurrentJob(): JobData | null {
    const currentSite = detectSite(window.location.href);
    
    if (!currentSite) {
      console.log('Site not supported for extraction');
      return null;
    }

    const siteKey = this.getSiteKey(currentSite.domain);
    const extractor = this.extractors.get(siteKey);

    if (!extractor) {
      console.warn(`No extractor found for site: ${siteKey}`);
      return null;
    }

    try {
      console.log(`Extracting job data from ${currentSite.name}...`);
      const jobData = extractor.extractJobData();
      
      if (jobData) {
        console.log('Job data extracted successfully:', jobData);
        return jobData;
      } else {
        console.log('No job data found on current page');
        return this.createMinimalJobData(currentSite.name.toLowerCase());
      }
    } catch (error) {
      console.error('Error extracting job data:', error);
      return this.createMinimalJobData(currentSite.name.toLowerCase());
    }
  }

  private getSiteKey(domain: string): string {
    if (domain.includes('linkedin')) return 'linkedin';
    if (domain.includes('monster')) return 'monster';
    if (domain.includes('ziprecruiter')) return 'ziprecruiter';
    if (domain.includes('greenhouse')) return 'greenhouse';
    if (domain.includes('hiring.cafe')) return 'hiring-cafe';
    if (domain.includes('indeed')) return 'indeed';
    return domain;
  }

  // Create minimal job data when extraction fails but site is detected
  private createMinimalJobData(source: string): JobData {
    return {
      organization: 'Manual Entry Required',
      position: 'Manual Entry Required',
      link: window.location.href,
      salary: 'Not specified',
      salary_type: 'annual',
      salary_min: null,
      salary_max: null,
      location: 'Not specified',
      type: 'Not specified',
      environment: 'Not specified',
      stage: 'Saved',
      source: source,
      job_site: source.charAt(0).toUpperCase() + source.slice(1),
      date_saved: new Date().toISOString(),
      date_posted: null,
      job_posting_url: window.location.href,
      description: ''
    };
  }
}

// src/utils/cross-browser.ts - Cross-browser compatibility
export const browserAPI = (() => {
  // Detect browser environment
  const isFirefox = typeof browser !== 'undefined' && browser.runtime;
  const isChrome = typeof chrome !== 'undefined' && chrome.runtime;

  if (isFirefox) {
    return browser;
  } else if (isChrome) {
    return chrome;
  } else {
    throw new Error('Unsupported browser environment');
  }
})();

// Wrapper for cross-browser message passing
export const sendMessage = (message: any): Promise<any> => {
  if (typeof browser !== 'undefined' && browser.runtime) {
    // Firefox
    return browser.runtime.sendMessage(message);
  } else if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Chrome/Edge
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
  return Promise.reject(new Error('Browser API not available'));
};

// src/content/enhanced-content-script.ts - Enhanced content script with dynamic loading detection
export class EnhancedContentScript {
  private extractorManager: ExtractorManager;
  private observer: MutationObserver | null = null;
  private debounceTimer: number | null = null;
  private lastJobUrl: string = '';

  constructor() {
    this.extractorManager = new ExtractorManager();
    this.setupDynamicContentDetection();
    this.setupUrlChangeDetection();
  }

  private setupDynamicContentDetection() {
    // Set up MutationObserver to detect when job details change
    this.observer = new MutationObserver((mutations) => {
      let shouldCheckForJobUpdate = false;

      mutations.forEach((mutation) => {
        // Check if job-related content has changed
        if (mutation.type === 'childList') {
          const target = mutation.target as Element;
          
          // LinkedIn: Watch for job details container changes
          if (target.matches?.('.jobs-search__job-details--container, .job-details-jobs-unified-top-card') ||
              target.querySelector?.('.jobs-search__job-details--container, .job-details-jobs-unified-top-card')) {
            shouldCheckForJobUpdate = true;
          }
          
          // Monster: Watch for job view changes
          if (target.matches?.('.JobView, .job-view-container') ||
              target.querySelector?.('.JobView, .job-view-container')) {
            shouldCheckForJobUpdate = true;
          }
          
          // ZipRecruiter: Watch for job description changes
          if (target.matches?.('[data-test="job-description"], .jobDescriptionSection') ||
              target.querySelector?.[('[data-test="job-description"], .jobDescriptionSection')) {
            shouldCheckForJobUpdate = true;
          }
          
          // Greenhouse: Watch for job post changes
          if (target.matches?.('.job-post, .application') ||
              target.querySelector?.('.job-post, .application')) {
            shouldCheckForJobUpdate = true;
          }
          
          // Hiring.Cafe: Watch for content changes
          if (target.matches?.('.job-details, .job-container') ||
              target.querySelector?.('.job-details, .job-container')) {
            shouldCheckForJobUpdate = true;
          }
        }
      });

      if (shouldCheckForJobUpdate) {
        this.debounceJobUpdate();
      }
    });

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  private setupUrlChangeDetection() {
    // Detect URL changes for SPAs
    let currentUrl = window.location.href;
    
    const checkUrlChange = () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.debounceJobUpdate();
      }
    };

    // Check for URL changes periodically
    setInterval(checkUrlChange, 1000);

    // Also listen for popstate events
    window.addEventListener('popstate', () => {
      setTimeout(checkUrlChange, 100);
    });
  }

  private debounceJobUpdate() {
    // Debounce job updates to avoid excessive extraction attempts
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.checkForJobUpdate();
    }, 500); // Wait 500ms after last change
  }

  private checkForJobUpdate() {
    const currentUrl = window.location.href;
    
    // Only update if we're on a different job or if this is the first check
    if (currentUrl !== this.lastJobUrl) {
      this.lastJobUrl = currentUrl;
      
      // Notify background script that job might have changed
      sendMessage({
        type: 'JOB_CONTEXT_CHANGED',
        url: currentUrl,
        timestamp: Date.now()
      }).catch(error => {
        console.error('Failed to notify background script:', error);
      });
    }
  }

  public extractJobData(): JobData | null {
    return this.extractorManager.extractCurrentJob();
  }

  public cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}

// src/manifest/firefox-manifest.json - Firefox-specific manifest
{
  "manifest_version": 2,
  "name": "JOT Snatcher",
  "version": "1.0.0",
  "permissions": ["storage", "activeTab", "tabs", "<all_urls>"],
  "background": {
    "scripts": ["background.js"],
    "persistent": false
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content-script.js"],
    "run_at": "document_end"
  }],
  "browser_action": {
    "default_popup": "src/popup/index.html"
  },
  "web_accessible_resources": ["src/popup/index.html"]
}

// src/utils/site-specific-helpers.ts - Site-specific helper functions
export class SiteSpecificHelpers {
  
  // LinkedIn specific helpers
  static waitForLinkedInJobLoad(timeout: number = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkForJob = () => {
        const jobContainer = document.querySelector('.jobs-search__job-details--container, .job-details-jobs-unified-top-card');
        const jobTitle = jobContainer?.querySelector('h1');
        
        if (jobContainer && jobTitle?.textContent?.trim()) {
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          resolve(false);
          return;
        }
        
        setTimeout(checkForJob, 100);
      };
      
      checkForJob();
    });
  }

  // Monster specific helpers
  static waitForMonsterJobLoad(timeout: number = 3000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkForJob = () => {
        const jobContainer = document.querySelector('.JobView, .job-view-container');
        const jobTitle = jobContainer?.querySelector('h1');
        
        if (jobContainer && jobTitle?.textContent?.trim()) {
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          resolve(false);
          return;
        }
        
        setTimeout(checkForJob, 100);
      };
      
      checkForJob();
    });
  }

  // Generic environment detection from description or page content
  static detectWorkEnvironment(description: string, pageContent?: string): string {
    const combinedText = `${description} ${pageContent || ''}`.toLowerCase();
    
    // Remote indicators
    if (combinedText.includes('remote') || 
        combinedText.includes('work from home') ||
        combinedText.includes('100% remote') ||
        combinedText.includes('fully remote')) {
      return 'Remote';
    }
    
    // Hybrid indicators
    if (combinedText.includes('hybrid') ||
        combinedText.includes('flexible work') ||
        combinedText.includes('remote/office')) {
      return 'Hybrid';
    }
    
    // In-person indicators
    if (combinedText.includes('on-site') ||
        combinedText.includes('in-office') ||
        combinedText.includes('in-person') ||
        combinedText.includes('office environment')) {
      return 'In-Person';
    }
    
    return 'Not specified';
  }

  // Advanced salary parsing for complex formats
  static parseAdvancedSalary(salaryText: string): {
    salary: string;
    salary_type: 'annual' | 'hourly' | 'monthly' | 'contract';
    salary_min: number | null;
    salary_max: number | null;
  } {
    if (!salaryText) {
      return {
        salary: 'Not specified',
        salary_type: 'annual',
        salary_min: null,
        salary_max: null
      };
    }

    const text = salaryText.toLowerCase().replace(/[,$]/g, '');
    
    // Extract numbers
    const numbers = text.match(/\d+(?:\.\d+)?/g)?.map(n => parseFloat(n)) || [];
    
    let salary_type: 'annual' | 'hourly' | 'monthly' | 'contract' = 'annual';
    
    if (text.includes('hour') || text.includes('hr')) {
      salary_type = 'hourly';
    } else if (text.includes('month')) {
      salary_type = 'monthly';
    } else if (text.includes('contract') || text.includes('project')) {
      salary_type = 'contract';
    }
    
    let salary_min: number | null = null;
    let salary_max: number | null = null;
    
    if (numbers.length >= 2) {
      salary_min = Math.min(...numbers);
      salary_max = Math.max(...numbers);
    } else if (numbers.length === 1) {
      salary_min = numbers[0];
      salary_max = numbers[0];
    }
    
    return {
      salary: salaryText.trim(),
      salary_type,
      salary_min,
      salary_max
    };
  }
}

// src/utils/performance-monitor.ts - Performance monitoring for extraction
export class ExtractionPerformanceMonitor {
  private static startTime: number = 0;
  
  static startExtraction(siteName: string) {
    this.startTime = performance.now();
    console.log(`Starting extraction for ${siteName}...`);
  }
  
  static endExtraction(siteName: string, success: boolean, jobData?: JobData | null) {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    
    console.log(`Extraction completed for ${siteName}:`, {
      duration: `${duration.toFixed(2)}ms`,
      success,
      hasJobData: !!jobData,
      requiredFields: jobData ? {
        hasPosition: !!jobData.position,
        hasOrganization: !!jobData.organization
      } : null
    });
    
    // Send performance metrics to background script
    sendMessage({
      type: 'EXTRACTION_PERFORMANCE',
      site: siteName,
      duration,
      success,
      timestamp: Date.now()
    }).catch(console.error);
  }
}

// Integration example for your existing popup component
export const useJobExtraction = () => {
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'extracting' | 'success' | 'error'>('idle');
  const [jobData, setJobData] = useState<JobData | null>(null);

  const extractJobData = useCallback(async () => {
    setExtractionStatus('extracting');
    
    try {
      const response = await sendMessage({ type: 'COLLECT_JOB_DATA' });
      
      if (response && response.jobData) {
        setJobData(response.jobData);
        setExtractionStatus('success');
      } else {
        setExtractionStatus('error');
      }
    } catch (error) {
      console.error('Job extraction failed:', error);
      setExtractionStatus('error');
    }
  }, []);

  return {
    extractJobData,
    extractionStatus,
    jobData,
    isExtracting: extractionStatus === 'extracting'
  };
};