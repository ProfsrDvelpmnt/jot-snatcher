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

  constructor() {
    this.extractorManager = new ExtractorManager();
    this.setupDynamicContentDetection();
  }

  private setupD