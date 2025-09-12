// Fallback extraction for unsupported layouts
import { JobData } from '@/types';

export class FallbackExtractor {
  static extractWithCommonPatterns(): Partial<JobData> | null {
    console.log('🔄 Attempting fallback extraction...');
    
    const data: Partial<JobData> = {};
    
    // Try to find job title with common patterns
    data.position = this.findJobTitle();
    
    // Try to find company name
    data.organization = this.findCompanyName();
    
    // Try to find location
    data.location = this.findLocation();
    
    // Try to find salary
    data.salary = this.findSalary();
    
    // If we found at least position and organization, return the data
    if (data.position && data.organization && 
        data.position !== 'Not found' && data.organization !== 'Not found') {
      return {
        ...data,
        link: window.location.href,
        date_saved: new Date().toISOString(),
        stage: 'Saved',
        source: 'fallback',
        job_site: 'Unknown'
      };
    }
    
    return null;
  }
  
  private static findJobTitle(): string {
    const patterns = [
      'h1',
      '[data-testid*="title"]',
      '[data-test*="title"]',
      '[class*="job-title"]',
      '[class*="position"]',
      '[class*="role"]',
      '.title',
      '.job-name',
      '.position-title'
    ];
    
    for (const pattern of patterns) {
      const element = document.querySelector(pattern);
      if (element?.textContent?.trim() && element.textContent.trim().length > 0) {
        const text = element.textContent.trim();
        // Basic validation - job titles are usually reasonable length
        if (text.length >= 3 && text.length <= 100) {
          return text;
        }
      }
    }
    
    return 'Not found';
  }
  
  private static findCompanyName(): string {
    const patterns = [
      '[data-testid*="company"]',
      '[data-test*="company"]',
      '[class*="company"]',
      '[class*="employer"]',
      '.company-name',
      '.employer-name',
      'a[href*="company"]',
      'a[href*="/companies/"]'
    ];
    
    for (const pattern of patterns) {
      const element = document.querySelector(pattern);
      if (element?.textContent?.trim()) {
        const text = element.textContent.trim();
        if (text.length >= 2 && text.length <= 100) {
          return text;
        }
      }
    }
    
    return 'Not found';
  }
  
  private static findLocation(): string {
    const patterns = [
      '[data-testid*="location"]',
      '[data-test*="location"]',
      '[class*="location"]',
      '.location',
      '.job-location',
      '[class*="address"]'
    ];
    
    for (const pattern of patterns) {
      const element = document.querySelector(pattern);
      if (element?.textContent?.trim()) {
        const text = element.textContent.trim();
        // Location often contains city names, states, or "Remote"
        if (text.length >= 3 && text.length <= 100) {
          return text;
        }
      }
    }
    
    return 'Not specified';
  }
  
  private static findSalary(): string {
    const patterns = [
      '[data-testid*="salary"]',
      '[data-test*="salary"]',
      '[class*="salary"]',
      '[class*="compensation"]',
      '.salary',
      '.compensation',
      '.pay'
    ];
    
    // Also look for text that contains salary indicators
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
      const text = element.textContent?.trim() || '';
      if (text.match(/\$[\d,]+/) || text.toLowerCase().includes('salary') || 
          text.toLowerCase().includes('per hour') || text.toLowerCase().includes('annually')) {
        if (text.length <= 100) {
          return text;
        }
      }
    }
    
    for (const pattern of patterns) {
      const element = document.querySelector(pattern);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    
    return 'Not specified';
  }
}
