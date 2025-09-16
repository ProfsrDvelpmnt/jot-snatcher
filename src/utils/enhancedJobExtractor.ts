// Enhanced JobExtractor base class with fallback logic
import { SiteConfig, JobSelectors } from './siteDetector';
import { JobData } from '@/types';
import { parseSalary } from './salaryParser';

export abstract class JobExtractor {
  protected selectors: JobSelectors;
  protected config: SiteConfig;

  constructor(config: SiteConfig) {
    this.config = config;
    this.selectors = config.selectors;
  }

  // Helper method to extract text with multiple selector fallbacks
  protected extractTextWithFallbacks(container: Element, selectors: string | string[] | undefined): string {
    if (!selectors) return '';
    
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
    
    for (const selector of selectorArray) {
      const element = container.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    
    return '';
  }

  // Wait for content to load with timeout
  protected waitForContent(timeout: number = 3000): boolean {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.findJobContainer()) {
        return true;
      }
      
      // Brief wait
      const waitTime = 100;
      const endTime = Date.now() + waitTime;
      while (Date.now() < endTime) {}
    }
    
    return false;
  }

  // Find job container with fallback selectors
  public findJobContainer(): Element | null {
    const containerSelectors = Array.isArray(this.selectors.jobContainer) 
      ? this.selectors.jobContainer 
      : [this.selectors.jobContainer];
    
    for (const selector of containerSelectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    
    return null;
  }

  // Detect work environment from job description
  protected detectEnvironmentFromDescription(description: string): string {
    if (!description) return 'Not specified';
    
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('remote') || lowerDesc.includes('work from home')) {
      return 'Remote';
    } else if (lowerDesc.includes('hybrid')) {
      return 'Hybrid';
    } else if (lowerDesc.includes('on-site') || lowerDesc.includes('in-office') || lowerDesc.includes('in-person')) {
      return 'In-Person';
    }
    
    return 'Not specified';
  }

  // Normalize job type text
  protected normalizeJobType(jobType: string): string {
    if (!jobType) return 'Not specified';
    
    const lower = jobType.toLowerCase();
    
    if (lower.includes('full')) return 'Full Time';
    if (lower.includes('part')) return 'Part Time';
    if (lower.includes('contract')) return 'Contract';
    if (lower.includes('temporary') || lower.includes('temp')) return 'Temporary';
    if (lower.includes('intern')) return 'Internship';
    
    return jobType;
  }

  // Parse relative time to ISO date
  protected parseRelativeTime(timeText: string): string | null {
    const now = new Date();
    const lower = timeText.toLowerCase();
    
    if (lower.includes('today')) {
      return now.toISOString();
    } else if (lower.includes('yesterday')) {
      now.setDate(now.getDate() - 1);
      return now.toISOString();
    } else if (lower.includes('day')) {
      const days = parseInt(lower.match(/\d+/)?.[0] || '0');
      now.setDate(now.getDate() - days);
      return now.toISOString();
    } else if (lower.includes('week')) {
      const weeks = parseInt(lower.match(/\d+/)?.[0] || '0');
      now.setDate(now.getDate() - (weeks * 7));
      return now.toISOString();
    }
    
    return null;
  }

  // Abstract method that each site extractor must implement
  abstract extractJobData(): JobData | null | Promise<JobData | null>;
}
