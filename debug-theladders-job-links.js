// Debug script to find job links on TheLadders.com
console.log('🔍 === DEBUGGING JOB LINKS ON THELADDERS ===');

// Function to get element info
function getElementInfo(element, selector) {
  if (!element) return null;
  
  return {
    tagName: element.tagName,
    text: element.textContent?.trim().substring(0, 100) || '',
    href: element.href || '',
    classes: element.className || '',
    id: element.id || '',
    selector: selector
  };
}

// 1. Check for all links containing "/job/"
console.log('\n🔍 === CHECKING FOR JOB LINKS ===');
const jobLinks = document.querySelectorAll('a[href*="/job/"]');
console.log(`Found ${jobLinks.length} links containing "/job/"`);

jobLinks.forEach((link, index) => {
  const info = getElementInfo(link, 'a[href*="/job/"]');
  console.log(`Job link ${index + 1}:`, info);
});

// 2. Check for all links in general
console.log('\n🔍 === CHECKING ALL LINKS ===');
const allLinks = document.querySelectorAll('a[href]');
console.log(`Found ${allLinks.length} total links`);

// Filter for links that might be job-related
const potentialJobLinks = Array.from(allLinks).filter(link => {
  const href = link.href.toLowerCase();
  return href.includes('theladders.com') && 
         (href.includes('/job/') || 
          href.includes('senior') || 
          href.includes('director') || 
          href.includes('engineer') ||
          href.includes('marketing'));
});

console.log(`Found ${potentialJobLinks.length} potential job links:`);
potentialJobLinks.forEach((link, index) => {
  const info = getElementInfo(link, 'potential job link');
  console.log(`Potential job link ${index + 1}:`, info);
});

// 3. Check current page URL
console.log('\n🔍 === CURRENT PAGE INFO ===');
console.log('Current URL:', window.location.href);
console.log('Current pathname:', window.location.pathname);
console.log('Current search:', window.location.search);

// 4. Check for job title links in the main content
console.log('\n🔍 === CHECKING JOB TITLE LINKS ===');
const titleSelectors = [
  'h1 a',
  'h2 a', 
  'h3 a',
  '.job-title a',
  '.sticky-job-title a',
  '[data-testid="job-title"] a',
  '.job-header a'
];

titleSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`Found ${elements.length} elements with selector: ${selector}`);
    elements.forEach((el, index) => {
      const info = getElementInfo(el, selector);
      console.log(`  ${index + 1}:`, info);
    });
  }
});

// 5. Check for any links that might be the current job
console.log('\n🔍 === CHECKING FOR CURRENT JOB LINK ===');
const currentJobSelectors = [
  '.sticky-job-title',
  'h1.job-title',
  '.job-header h1',
  'h1',
  '.job-title',
  '[data-testid="job-title"]'
];

currentJobSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`Found ${elements.length} elements with selector: ${selector}`);
    elements.forEach((el, index) => {
      const info = getElementInfo(el, selector);
      console.log(`  ${index + 1}:`, info);
      
      // Check if this element has a parent link
      const parentLink = el.closest('a');
      if (parentLink) {
        const linkInfo = getElementInfo(parentLink, 'parent link');
        console.log(`    Parent link:`, linkInfo);
      }
    });
  }
});

// 6. Check for any elements that might contain job URLs
console.log('\n🔍 === CHECKING FOR JOB URL ELEMENTS ===');
const urlElements = document.querySelectorAll('[href*="/job/"], [data-url*="/job/"], [data-href*="/job/"]');
console.log(`Found ${urlElements.length} elements with job URLs`);
urlElements.forEach((el, index) => {
  const info = getElementInfo(el, 'job URL element');
  console.log(`Job URL element ${index + 1}:`, info);
});

console.log('\n✅ Job link debugging complete!');
