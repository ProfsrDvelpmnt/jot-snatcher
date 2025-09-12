// Enhanced extraction coordinator
import { detectSite } from '@/utils/siteDetector';
import { JobData } from '@/types';
import { JobExtractor } from '@/utils/enhancedJobExtractor';
import { 
  LinkedInExtractor, 
  MonsterExtractor, 
  ZipRecruiterExtractor, 
  GreenhouseExtractor, 
  HiringCafeExtractor, 
  IndeedExtractor 
} from '@/sites';

export class ExtractionManager {
  private extractors: Map<string, JobExtractor> = new Map();

  constructor() {
    this.initializeExtractors();
  }

  private initializeExtractors() {
    // Initialize all site-specific extractors
    this.extractors.set('linkedin', new LinkedInExtractor());
    this.extractors.set('monster', new MonsterExtractor());
    this.extractors.set('ziprecruiter', new ZipRecruiterExtractor());
    this.extractors.set('greenhouse', new GreenhouseExtractor());
    this.extractors.set('hiring-cafe', new HiringCafeExtractor());
    this.extractors.set('indeed', new IndeedExtractor());
    
    console.log('Initialized extractors for all supported sites');
  }

  // Extract job data from current page
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

  // Extract all jobs from current page (for job listing pages)
  extractAllJobs(): JobData[] {
    const currentSite = detectSite(window.location.href);
    
    if (!currentSite) {
      console.log('Site not supported for extraction');
      return [];
    }

    const siteKey = this.getSiteKey(currentSite.domain);
    const extractor = this.extractors.get(siteKey);

    if (!extractor) {
      console.warn(`No extractor found for site: ${siteKey}`);
      return [];
    }

    try {
      // For now, just return the current job as a single-item array
      // This can be enhanced later for job listing pages
      const jobData = extractor.extractJobData();
      return jobData ? [jobData] : [];
    } catch (error) {
      console.error('Error extracting job data:', error);
      return [];
    }
  }

  // Check if current page has job listings
  hasJobListings(): boolean {
    const currentSite = detectSite(window.location.href);
    if (!currentSite) return false;

    const siteKey = this.getSiteKey(currentSite.domain);
    const extractor = this.extractors.get(siteKey);
    
    if (!extractor) return false;

    // Check if we can find a job container
    return extractor.findJobContainer() !== null;
  }

  // Get current site information
  getCurrentSite(): string | null {
    const currentSite = detectSite(window.location.href);
    return currentSite?.name || null;
  }

  // Check if current site is supported
  isSiteSupported(): boolean {
    const currentSite = detectSite(window.location.href);
    if (!currentSite) return false;

    const siteKey = this.getSiteKey(currentSite.domain);
    return this.extractors.has(siteKey);
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
      description: '',
      // Legacy fields
      jobId: `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      companyName: 'Manual Entry Required',
      jobLink: window.location.href,
      jobTitle: 'Manual Entry Required',
      workType: 'Not specified',
      ageOfPosting: 'Unknown',
      numApplicants: 'Unknown'
    };
  }
}

// Export singleton instance
export const extractionManager = new ExtractionManager();
