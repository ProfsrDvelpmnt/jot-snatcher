// Debug script to find location selectors on Indeed job listing page
console.log('=== Indeed Location Debug ===');

// Check if we're on Indeed
if (window.location.hostname.includes('indeed.com')) {
  console.log('✅ On Indeed.com');
  console.log('🔗 Current URL:', window.location.href);
  
  // Look for location in various possible locations
  console.log('\n=== Location Selectors ===');
  const locationSelectors = [
    '[data-testid="job-location"]',
    '[data-testid="inlineHeader-companyLocation"]',
    '[data-testid="inlineHeader-companyLocation"] [data-testid="job-location"]',
    '.jobsearch-JobInfoHeader-subtitle',
    '.jobsearch-JobInfoHeader-subtitle [data-testid="job-location"]',
    '.css-1wbl7v6',
    '[data-testid="job-location"] span',
    '.jobsearch-JobInfoHeader-subtitle span',
    '[aria-label="Location"]',
    '[aria-label="Location"] span',
    '[aria-label="Location"] [data-testid="list-item"] .css-1f1q1js'
  ];
  
  locationSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      const text = element.textContent?.trim();
      if (text && text.length > 0) {
        console.log(`✅ Location with "${selector}" [${index}]:`, text);
      }
    });
  });
  
  // Check selected job panel specifically
  console.log('\n=== Selected Job Panel Location ===');
  const selectedJobPanel = document.querySelector('#jobsearch-ViewjobPaneWrapper');
  if (selectedJobPanel) {
    console.log('✅ Found selected job panel');
    
    // Look for location within the panel
    const panelLocationSelectors = [
      '[data-testid="job-location"]',
      '[data-testid="inlineHeader-companyLocation"]',
      '.jobsearch-JobInfoHeader-subtitle',
      '.css-1wbl7v6',
      '[aria-label="Location"]'
    ];
    
    panelLocationSelectors.forEach(selector => {
      const elements = selectedJobPanel.querySelectorAll(selector);
      elements.forEach((element, index) => {
        const text = element.textContent?.trim();
        if (text && text.length > 0) {
          console.log(`✅ Panel location with "${selector}" [${index}]:`, text);
        }
      });
    });
    
    // Look for location in job details section
    const jobDetailsSection = selectedJobPanel.querySelector('#jobDetailsSection');
    if (jobDetailsSection) {
      console.log('✅ Found job details section in panel');
      
      const detailsLocationSelectors = [
        '[aria-label="Location"]',
        '[aria-label="Location"] span',
        '[aria-label="Location"] [data-testid="list-item"] .css-1f1q1js'
      ];
      
      detailsLocationSelectors.forEach(selector => {
        const elements = jobDetailsSection.querySelectorAll(selector);
        elements.forEach((element, index) => {
          const text = element.textContent?.trim();
          if (text && text.length > 0) {
            console.log(`✅ Details location with "${selector}" [${index}]:`, text);
          }
        });
      });
    }
  } else {
    console.log('❌ No selected job panel found');
  }
  
  // Check job cards for location
  console.log('\n=== Job Cards Location ===');
  const jobCards = document.querySelectorAll('[data-jk]');
  console.log(`Found ${jobCards.length} job cards`);
  
  if (jobCards.length > 0) {
    const firstCard = jobCards[0];
    console.log('First job card location selectors:');
    
    const cardLocationSelectors = [
      '[data-testid="job-location"]',
      '.jobsearch-SerpJobCard [data-testid="job-location"]',
      '.jobsearch-SerpJobCard .css-1wbl7v6',
      '.jobsearch-SerpJobCard .jobsearch-JobInfoHeader-subtitle'
    ];
    
    cardLocationSelectors.forEach(selector => {
      const element = firstCard.querySelector(selector);
      if (element) {
        console.log(`✅ Card location with "${selector}":`, element.textContent?.trim());
      }
    });
  }
  
} else {
  console.log('❌ Not on Indeed.com');
}

console.log('\n=== Debug Complete ===');
