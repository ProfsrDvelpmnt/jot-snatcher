// src/utils/extractor-debugger.ts - Debug utility for testing extractors
export class ExtractorDebugger {
  static debugExtraction(siteName: string) {
    console.group(`🔍 Debugging ${siteName} Extraction`);
    
    const site = detectSite(window.location.href);
    if (!site) {
      console.error('❌ Site not detected');
      console.groupEnd();
      return null;
    }
    
    console.log('✅ Site detected:', site);
    
    // Test each selector
    const selectors = SITE_CONFIGS[siteName.toLowerCase()]?.selectors;
    if (!selectors) {
      console.error('❌ No selectors found for site');
      console.groupEnd();
      return null;
    }
    
    console.group('📋 Selector Testing');
    Object.entries(selectors).forEach(([key, selector]) => {
      this.testSelector(key, selector);
    });
    console.groupEnd();
    
    // Test extraction
    console.group('🎯 Extraction Testing');
    try {
      const extractorManager = new ExtractorManager();
      const jobData = extractorManager.extractCurrentJob();
      
      if (jobData) {
        console.log('✅ Extraction successful');
        this.validateJobData(jobData);
      } else {
        console.warn('⚠️ No job data extracted');
      }
      
      console.groupEnd();
      console.groupEnd();
      return jobData;
    } catch (error) {
      console.error('❌ Extraction failed:', error);
      console.groupEnd();
      console.groupEnd();
      return null;
    }
  }
  
  private static testSelector(name: string, selector: string | string[]) {
    const selectors = Array.isArray(selector) ? selector : [selector];
    let found = false;
    
    for (let i = 0; i < selectors.length; i++) {
      const element = document.querySelector(selectors[i]);
      if (element) {
        const text = element.textContent?.trim() || '';
        console.log(`✅ ${name}[${i}]: "${selectors[i]}" → "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        found = true;
        break;
      } else {
        console.log(`❌ ${name}[${i}]: "${selectors[i]}" → not found`);
      }
    }
    
    if (!found) {
      console.warn(`⚠️ No working selector found for ${name}`);
    }
  }
  
  private static validateJobData(jobData: JobData) {
    console.group('✅ Job Data Validation');
    
    // Required fields
    const required = ['organization', 'position'];
    required.forEach(field => {
      const value = jobData[field as keyof JobData];
      if (value && value !== 'Not specified' && value !== 'Manual Entry Required') {
        console.log(`✅ ${field}: "${value}"`);
      } else {
        console.error(`❌ ${field}: Missing or invalid`);
      }
    });
    
    // Optional but important fields
    const optional = ['location', 'salary', 'type', 'environment', 'description'];
    optional.forEach(field => {
      const value = jobData[field as keyof JobData];
      if (value && value !== 'Not specified') {
        console.log(`✅ ${field}: "${typeof value === 'string' ? value.substring(0, 50) : value}${typeof value === 'string' && value.length > 50 ? '...' : ''}"`);
      } else {
        console.warn(`⚠️ ${field}: Not extracted`);
      }
    });
    
    console.groupEnd();
  }
  
  // Test all supported sites on current page
  static testAllExtractors() {
    console.group('🧪 Testing All Extractors');
    
    const currentUrl = window.location.href;
    console.log('Current URL:', currentUrl);
    
    const supportedSites = ['linkedin', 'monster', 'ziprecruiter', 'greenhouse', 'hiring-cafe', 'indeed'];
    
    supportedSites.forEach(site => {
      if (currentUrl.includes(site)) {
        console.log(`🎯 Testing ${site} extractor...`);
        this.debugExtraction(site);
      }
    });
    
    console.groupEnd();
  }
  
  // Generate test report
  static generateTestReport(): string {
    const site = detectSite(window.location.href);
    if (!site) return 'No supported site detected';
    
    const extractorManager = new ExtractorManager();
    const jobData = extractorManager.extractCurrentJob();
    
    const report = {
      url: window.location.href,
      site: site.name,
      timestamp: new Date().toISOString(),
      extraction_successful: !!jobData,
      required_fields: jobData ? {
        organization: jobData.organization !== 'Manual Entry Required',
        position: jobData.position !== 'Manual Entry Required'
      } : null,
      extracted_data: jobData,
      page_elements: this.getPageElementReport(site)
    };
    
    return JSON.stringify(report, null, 2);
  }
  
  private static getPageElementReport(site: SiteConfig) {
    const selectors = site.selectors;
    const report: any = {};
    
    Object.entries(selectors).forEach(([key, selector]) => {
      const selArray = Array.isArray(selector) ? selector : [selector];
      report[key] = selArray.map(sel => ({
        selector: sel,
        found: !!document.querySelector(sel),
        text: document.querySelector(sel)?.textContent?.trim().substring(0, 100)
      }));
    });
    
    return report;
  }
}

// Add to window for console access
declare global {
  interface Window {
    JOTDebugger: typeof ExtractorDebugger;
  }
}

if (typeof window !== 'undefined') {
  window.JOTDebugger = ExtractorDebugger;
}

// src/utils/fallback-extraction.ts - Fallback extraction for unsupported layouts
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

// src/utils/extraction-validator.ts - Validate extracted data quality
export class ExtractionValidator {
  static validateJobData(data: JobData): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
    score: number;
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    let score = 0;
    
    // Required field validation
    if (!data.organization || data.organization === 'Manual Entry Required') {
      errors.push('Organization is required');
    } else {
      score += 25;
    }
    
    if (!data.position || data.position === 'Manual Entry Required') {
      errors.push('Position is required');
    } else {
      score += 25;
    }
    
    // Quality checks
    if (data.location && data.location !== 'Not specified') score += 10;
    if (data.salary && data.salary !== 'Not specified') score += 15;
    if (data.type && data.type !== 'Not specified') score += 5;
    if (data.environment && data.environment !== 'Not specified') score += 5;
    if (data.description && data.description.length > 50) score += 15;
    
    // Data quality warnings
    if (data.organization && data.organization.length < 2) {
      warnings.push('Organization name seems too short');
    }
    
    if (data.position && data.position.length < 3) {
      warnings.push('Position title seems too short');
    }
    
    if (data.salary === 'Not specified') {
      warnings.push('Salary information not found');
    }
    
    if (data.location === 'Not specified') {
      warnings.push('Location not specified');
    }
    
    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      score: Math.min(score, 100)
    };
  }
  
  static shouldUseExtractedData(data: JobData): boolean {
    const validation = this.validateJobData(data);
    return validation.isValid && validation.score >= 50;
  }
}

// Console commands for testing (add to content script)
if (typeof window !== 'undefined') {
  // Make debugging functions available in console
  (window as any).testExtraction = () => {
    return ExtractorDebugger.testAllExtractors();
  };
  
  (window as any).debugCurrentSite = () => {
    const site = detectSite(window.location.href);
    if (site) {
      return ExtractorDebugger.debugExtraction(site.name.toLowerCase());
    } else {
      console.log('No supported site detected');
      return null;
    }
  };
  
  (window as any).generateReport = () => {
    const report = ExtractorDebugger.generateTestReport();
    console.log(report);
    return report;
  };
  
  (window as any).tryFallback = () => {
    return FallbackExtractor.extractWithCommonPatterns();
  };
}

// Usage examples and integration guide
/**
 * INTEGRATION GUIDE:
 * 
 * 1. Add the new extractor files to your src/sites/ directory
 * 2. Update your src/config/sites.ts with the new SITE_CONFIGS
 * 3. Update your ExtractorManager to include the new extractors
 * 4. For testing, open browser console on any job site and run:
 *    - testExtraction() - Test all extractors
 *    - debugCurrentSite() - Debug current site extraction
 *    - generateReport() - Get detailed extraction report
 *    - tryFallback() - Test fallback extraction
 * 
 * 5. Cross-browser testing:
 *    - Chrome: Use existing chrome API calls
 *    - Edge: Same as Chrome (Chromium-based)
 *    - Firefox: Use browser API wrapper (provided in cross-browser.ts)
 * 
 * 6. Performance monitoring:
 *    - Each extraction logs timing information
 *    - Target: < 3 seconds extraction time
 *    - Fallback to minimal data if extraction takes too long
 * 
 * 7. Error handling:
 *    - Always return minimal valid JobData even on failure
 *    - Log extraction attempts for debugging
 *    - Provide user feedback during extraction
 */