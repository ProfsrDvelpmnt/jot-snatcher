// TheLadders.com Debug Script
// Run this in the browser console on a TheLadders.com job page to debug extraction

console.log('🔍 TheLadders.com Debug Script Starting...');
console.log('🔍 Current URL:', window.location.href);

// Function to safely get text content
function getTextContent(element) {
  return element ? element.textContent?.trim() || '' : '';
}

// Function to get element info
function getElementInfo(element, selector) {
  if (!element) return null;
  return {
    selector: selector,
    text: getTextContent(element),
    className: element.className,
    id: element.id,
    tagName: element.tagName,
    element: element
  };
}

// Debug job container detection
console.log('\n🔍 === JOB CONTAINER DETECTION ===');
const jobContainerSelectors = [
  '.job-detail-view-container',
  '.sticky-job-details-container',
  'body',
  '.job-details',
  '.job-posting',
  '.job-container',
  'main'
];

let jobContainer = null;
for (const selector of jobContainerSelectors) {
  const element = document.querySelector(selector);
  if (element) {
    console.log(`✅ Found job container with selector: ${selector}`);
    jobContainer = element;
    break;
  }
}

if (!jobContainer) {
  console.log('❌ No job container found');
} else {
  console.log('📦 Job container element:', jobContainer);
}

// Debug title extraction
console.log('\n🔍 === TITLE EXTRACTION ===');
const titleSelectors = [
  '.sticky-job-title',
  'h1.job-title',
  '.job-header h1',
  'h1',
  '.job-title',
  '[data-testid="job-title"]'
];

for (const selector of titleSelectors) {
  const element = document.querySelector(selector);
  if (element) {
    const info = getElementInfo(element, selector);
    console.log(`✅ Title found with selector: ${selector}`, info);
    break;
  }
}

// Debug company extraction
console.log('\n🔍 === COMPANY EXTRACTION ===');
const companySelectors = [
  '.member-company-name',
  '.company-name',
  '.job-company',
  '.employer-name',
  '[data-testid="company-name"]'
];

for (const selector of companySelectors) {
  const element = document.querySelector(selector);
  if (element) {
    const info = getElementInfo(element, selector);
    console.log(`✅ Company found with selector: ${selector}`, info);
    break;
  }
}

// Debug location extraction
console.log('\n🔍 === LOCATION EXTRACTION ===');
const locationSelectors = [
  '.member-job-view-header-details-light-font',
  '.job-location',
  '.location',
  '.job-loc',
  '[data-testid="job-location"]',
  '.remote-flag-badge-basic'
];

for (const selector of locationSelectors) {
  const elements = document.querySelectorAll(selector);
  console.log(`🔍 Location selector "${selector}": ${elements.length} elements found`);
  elements.forEach((el, index) => {
    const info = getElementInfo(el, selector);
    console.log(`  ${index + 1}:`, info);
  });
}

// Debug remote flag badge analysis
console.log('\n🔍 === REMOTE FLAG BADGE ANALYSIS ===');
const allRemoteFlags = document.querySelectorAll('.remote-flag-badge-basic');
console.log(`🔍 Total remote flag badges found: ${allRemoteFlags.length}`);

// Look for the specific nested structure from company-and-posting-info
const companyPostingInfo = document.querySelector('.company-and-posting-info');
console.log('🔍 Company posting info container found:', companyPostingInfo);

let relevantRemoteFlag = null;

// First check the nested structure
if (companyPostingInfo) {
  console.log('🔍 Checking nested structure for all elements...');
  
  // Check for location element in nested structure
  const locationElement = companyPostingInfo.querySelector('.member-job-view-header-details-light-font');
  if (locationElement) {
    const locationText = getTextContent(locationElement);
    console.log('🔍 Location in nested structure:', locationText);
  }
  
  // Check for remote flag badge in nested structure
  relevantRemoteFlag = companyPostingInfo.querySelector('.remote-flag-badge-basic');
  if (relevantRemoteFlag) {
    const flagText = getTextContent(relevantRemoteFlag);
    console.log('✅ Found remote flag badge in nested structure:', flagText);
  }
  
  // Check for posted date in nested structure
  const nestedPostedDate = companyPostingInfo.querySelector('.posted-date');
  if (nestedPostedDate) {
    const dateText = getTextContent(nestedPostedDate);
    console.log('✅ Found posted date in nested structure:', dateText);
  }
  
  // Check for clock images in nested structure
  const nestedClockImages = companyPostingInfo.querySelectorAll('.icon-clock');
  if (nestedClockImages.length > 0) {
    console.log('✅ Found clock images in nested structure:', nestedClockImages.length);
    nestedClockImages.forEach((clockImg, index) => {
      const parentText = clockImg.parentElement ? getTextContent(clockImg.parentElement) : '';
      console.log(`  Clock image ${index + 1} parent text:`, parentText);
    });
  }
}

// Fallback to job details area if not found in nested structure
if (!relevantRemoteFlag) {
  const jobDetailsArea = document.querySelector('.job-detail-view-container, .sticky-job-details-container, .job-details, .job-posting');
  console.log('🔍 Job details area found:', jobDetailsArea);

  if (jobDetailsArea) {
    relevantRemoteFlag = jobDetailsArea.querySelector('.remote-flag-badge-basic');
    console.log('🔍 Remote flag badge in job details area:', relevantRemoteFlag);
  }
}

// Final fallback - try the first one that contains "remote"
if (!relevantRemoteFlag) {
  for (const flag of allRemoteFlags) {
    const flagText = getTextContent(flag);
    console.log(`🔍 Checking remote flag: "${flagText}"`);
    if (flagText.toLowerCase().includes('remote')) {
      relevantRemoteFlag = flag;
      console.log('✅ Found remote flag badge with "remote" text:', flagText);
      break;
    }
  }
}

if (relevantRemoteFlag) {
  const flagText = getTextContent(relevantRemoteFlag);
  console.log('🎯 Relevant remote flag badge text:', flagText);
  
  // Test location extraction logic
  if (flagText.toLowerCase().includes('remote in')) {
    const locationPart = flagText.toLowerCase().match(/remote in (.+)/);
    if (locationPart && locationPart[1]) {
      console.log('🔍 Extracted location part:', locationPart[1]);
      if (locationPart[1].includes('united states') || locationPart[1].includes('us')) {
        console.log('✅ Should set location to: US-Anywhere');
      } else {
        console.log('✅ Should set location to:', locationPart[1]);
      }
    }
  }
  
  // Test environment determination
  if (flagText.toLowerCase().includes('remote')) {
    console.log('✅ Should set environment to: Remote');
  } else if (flagText.toLowerCase().includes('hybrid')) {
    console.log('✅ Should set environment to: Hybrid');
  } else if (flagText.toLowerCase().includes('in-person')) {
    console.log('✅ Should set environment to: In-Person');
  }
} else {
  console.log('❌ No relevant remote flag badge found');
}

// Debug salary extraction
console.log('\n🔍 === SALARY EXTRACTION ===');
const salarySelectors = [
  '.salary',
  '.compensation',
  '.salary-info',
  '[data-testid="salary"]'
];

for (const selector of salarySelectors) {
  const element = document.querySelector(selector);
  if (element) {
    const info = getElementInfo(element, selector);
    console.log(`✅ Salary found with selector: ${selector}`, info);
    
    // Test salary type determination
    const salaryText = info.text.toLowerCase();
    if (salaryText.includes('k')) {
      console.log('✅ Salary contains K, should be Annual');
    } else if (salaryText.includes('/hr') || salaryText.includes('hour')) {
      console.log('✅ Salary mentions hourly, should be Hourly');
    } else {
      console.log('🔍 Salary type unclear from text');
    }
    break;
  }
}

// Debug description extraction
console.log('\n🔍 === DESCRIPTION EXTRACTION ===');
const descriptionSelectors = [
  '#job-description-box',
  '.job-description-text',
  '.job-description',
  '.description',
  '.job-content',
  '.content',
  '[data-testid="job-description"]'
];

for (const selector of descriptionSelectors) {
  const element = document.querySelector(selector);
  if (element) {
    const info = getElementInfo(element, selector);
    info.text = info.text.substring(0, 200) + '...'; // Truncate for readability
    console.log(`✅ Description found with selector: ${selector}`, info);
    break;
  }
}

// Debug posted date extraction
console.log('\n🔍 === POSTED DATE EXTRACTION ===');
const postedDateSelectors = [
  '.posted-date.bold-date',
  '.posted-date',
  '.job-posted',
  '.date-posted',
  '[data-testid="posted-date"]'
];

for (const selector of postedDateSelectors) {
  const elements = document.querySelectorAll(selector);
  console.log(`🔍 Posted date selector "${selector}": ${elements.length} elements found`);
  elements.forEach((el, index) => {
    const info = getElementInfo(el, selector);
    console.log(`  ${index + 1}:`, info);
    
    // Test date parsing
    const dateText = info.text.toLowerCase();
    if (dateText.includes('today')) {
      console.log('    ✅ Should parse as today');
    } else if (dateText.includes('day')) {
      const days = parseInt(dateText.match(/\d+/)?.[0] || '0');
      console.log(`    ✅ Should parse as ${days} days ago`);
    } else if (dateText.includes('week')) {
      const weeks = parseInt(dateText.match(/\d+/)?.[0] || '0');
      console.log(`    ✅ Should parse as ${weeks} weeks ago`);
    }
  });
}

// Debug icon-clock detection
console.log('\n🔍 === ICON-CLOCK DETECTION ===');
const clockImages = document.querySelectorAll('.icon-clock');
console.log(`🔍 Found ${clockImages.length} clock images`);

clockImages.forEach((clockImg, index) => {
  const parentElement = clockImg.parentElement;
  if (parentElement) {
    const parentText = getTextContent(parentElement);
    const parentInfo = getElementInfo(parentElement, '.icon-clock parent');
    console.log(`🔍 Clock image ${index + 1}:`, {
      parentText: parentText,
      parentElement: parentInfo,
      hasDateText: parentText.toLowerCase().includes('today') || 
                   parentText.toLowerCase().includes('day') || 
                   parentText.toLowerCase().includes('week') ||
                   parentText.toLowerCase().includes('ago')
    });
    
    // Test if this could be a posted date
    if (parentText.toLowerCase().includes('today')) {
      console.log('    ✅ Should parse as today');
    } else if (parentText.toLowerCase().includes('day')) {
      const days = parseInt(parentText.match(/\d+/)?.[0] || '0');
      console.log(`    ✅ Should parse as ${days} days ago`);
    } else if (parentText.toLowerCase().includes('week')) {
      const weeks = parseInt(parentText.match(/\d+/)?.[0] || '0');
      console.log(`    ✅ Should parse as ${weeks} weeks ago`);
    }
  }
});

// Debug job type extraction
console.log('\n🔍 === JOB TYPE EXTRACTION ===');
const jobTypeSelectors = [
  '.remote-flag-badge-basic',
  '.remote-flag-badge-in-person',
  '.job-type',
  '.employment-type',
  '.work-type',
  '[data-testid="job-type"]'
];

for (const selector of jobTypeSelectors) {
  const elements = document.querySelectorAll(selector);
  console.log(`🔍 Job type selector "${selector}": ${elements.length} elements found`);
  elements.forEach((el, index) => {
    const info = getElementInfo(el, selector);
    console.log(`  ${index + 1}:`, info);
  });
}

// Summary
console.log('\n🔍 === SUMMARY ===');
console.log('🔍 Job Container:', jobContainer ? 'Found' : 'Not Found');
console.log('🔍 Title:', document.querySelector('.sticky-job-title, h1.job-title, h1') ? 'Found' : 'Not Found');
console.log('🔍 Company:', document.querySelector('.member-company-name, .company-name') ? 'Found' : 'Not Found');
console.log('🔍 Location:', document.querySelector('.member-job-view-header-details-light-font, .remote-flag-badge-basic') ? 'Found' : 'Not Found');
console.log('🔍 Salary:', document.querySelector('.salary, .compensation') ? 'Found' : 'Not Found');
console.log('🔍 Description:', document.querySelector('#job-description-box, .job-description') ? 'Found' : 'Not Found');
console.log('🔍 Posted Date:', document.querySelector('.posted-date') ? 'Found' : 'Not Found');
console.log('🔍 Remote Flag Badge:', relevantRemoteFlag ? 'Found' : 'Not Found');

console.log('\n✅ TheLadders.com Debug Script Complete!');
