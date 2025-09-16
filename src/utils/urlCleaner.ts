/**
 * Utility functions for cleaning and normalizing URLs
 */

/**
 * Cleans a URL by removing unnecessary query parameters and normalizing it
 * @param url - The URL to clean
 * @returns The cleaned URL
 */
export function cleanUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // For Indeed URLs, remove tracking and unnecessary parameters
    if (urlObj.hostname.includes('indeed.com')) {
      // Keep only essential parameters for Indeed
      const essentialParams = ['q', 'l', 'radius', 'from', 'vjk'];
      const cleanParams = new URLSearchParams();
      
      for (const param of essentialParams) {
        const value = urlObj.searchParams.get(param);
        if (value) {
          cleanParams.set(param, value);
        }
      }
      
      // Rebuild URL with only essential parameters
      urlObj.search = cleanParams.toString();
      return urlObj.toString();
    }
    
    // For other job sites, remove common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'fbclid', 'msclkid', 'ref', 'source', 'campaign',
      'cf-turnstile-response', 'cf_chl_jschl_tk', 'cf_chl_captcha_tk',
      'advn', 'jk', 'vjk', 'from', 'to', 'sort', 'start', 'page',
      'fccid', 'bb', 'xkcb', 'vjs', 'jcid', 'jtk', 'jts', 'jtkid',
      'jtsid', 'jtsid', 'jtsid', 'jtsid', 'jtsid', 'jtsid', 'jtsid'
    ];
    
    for (const param of trackingParams) {
      urlObj.searchParams.delete(param);
    }
    
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return the original URL
    console.warn('Failed to clean URL:', error);
    return url;
  }
}

/**
 * Cleans a job posting URL specifically for job sites
 * @param url - The job posting URL to clean
 * @returns The cleaned job posting URL
 */
export function cleanJobUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // For Indeed job detail pages, keep only essential parameters
    if (urlObj.hostname.includes('indeed.com')) {
      if (urlObj.pathname.includes('/viewjob')) {
        // For job detail pages, remove all query parameters except jk
        const jk = urlObj.searchParams.get('jk');
        if (jk) {
          urlObj.search = `?jk=${jk}`;
        } else {
          urlObj.search = '';
        }
      } else if (urlObj.pathname.includes('/jobs')) {
        // For job listing pages, keep essential search parameters
        const essentialParams = ['q', 'l', 'radius'];
        const cleanParams = new URLSearchParams();
        
        for (const param of essentialParams) {
          const value = urlObj.searchParams.get(param);
          if (value) {
            cleanParams.set(param, value);
          }
        }
        
        urlObj.search = cleanParams.toString();
      }
    }
    
    // For LinkedIn, remove tracking parameters
    if (urlObj.hostname.includes('linkedin.com')) {
      const trackingParams = ['trk', 'trkInfo', 'trackingId', 'refId', 'ref'];
      for (const param of trackingParams) {
        urlObj.searchParams.delete(param);
      }
    }
    
    // For other job sites, remove common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'fbclid', 'msclkid', 'ref', 'source', 'campaign',
      'cf-turnstile-response', 'cf_chl_jschl_tk', 'cf_chl_captcha_tk',
      'advn', 'from', 'to', 'sort', 'start', 'page'
    ];
    
    for (const param of trackingParams) {
      urlObj.searchParams.delete(param);
    }
    
    return urlObj.toString();
  } catch (error) {
    console.warn('Failed to clean job URL:', error);
    return url;
  }
}

