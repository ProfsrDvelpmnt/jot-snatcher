// Debug utility for testing extractors
import { detectSite } from './siteDetector';
import { SITE_CONFIGS } from './siteDetector';
import { extractionManager } from '@/extractors';
import { JobData } from '@/types';

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
      const jobData = extractionManager.extractCurrentJob();
      
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
    
    const jobData = extractionManager.extractCurrentJob();
    
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
  
  private static getPageElementReport(site: any) {
    const selectors = site.selectors;
    const report: any = {};
    
    Object.entries(selectors).forEach(([key, selector]) => {
      const selArray = Array.isArray(selector) ? selector : [selector];
      report[key] = selArray.map((sel: string) => ({
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
