// Debug script to find the correct selectors for Indeed job listing page
console.log('=== Indeed Selector Debug ===');

// Check if we're on Indeed
if (window.location.hostname.includes('indeed.com')) {
  console.log('✅ On Indeed.com');
  console.log('🔗 Current URL:', window.location.href);
  
  // Look for job title in various possible locations
  console.log('\n=== Job Title Selectors ===');
  const titleSelectors = [
    'h1[data-testid="jobsearch-JobInfoHeader-title"]',
    'h1',
    'h2',
    '[data-testid="job-title"]',
    '[data-testid="job-title"] a',
    '.jobsearch-JobInfoHeader-title',
    '.jobsearch-SerpJobCard h2',
    '.jobsearch-SerpJobCard h3',
    '.jobsearch-SerpJobCard [data-testid="job-title"]',
    '.jobsearch-SerpJobCard a[data-jk]',
    '[data-jk] h2',
    '[data-jk] h3',
    '[data-jk] a',
    '.jobsearch-SerpJobCard .jobTitle',
    '.jobsearch-SerpJobCard .jobTitle a'
  ];
  
  titleSelectors.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`✅ Found with "${selector}":`, element.textContent?.trim());
    }
  });
  
  // Look for job cards
  console.log('\n=== Job Cards ===');
  const jobCards = document.querySelectorAll('[data-jk]');
  console.log(`Found ${jobCards.length} job cards`);
  
  if (jobCards.length > 0) {
    const firstCard = jobCards[0];
    console.log('First job card:', firstCard);
    console.log('First job card text:', firstCard.textContent?.trim().substring(0, 200));
    
    // Look for title within the first card
    const cardTitleSelectors = [
      'h2',
      'h3', 
      'a',
      '[data-testid="job-title"]',
      '.jobTitle',
      '.jobTitle a'
    ];
    
    cardTitleSelectors.forEach(selector => {
      const element = firstCard.querySelector(selector);
      if (element) {
        console.log(`✅ Card title with "${selector}":`, element.textContent?.trim());
      }
    });
  }
  
  // Look for salary in various locations
  console.log('\n=== Salary Selectors ===');
  const salarySelectors = [
    '[data-testid*="salary"]',
    '[data-testid="attribute_snippet_testid"]',
    '.jobsearch-JobMetadataHeader-item',
    '.css-1f1q1js',
    '[data-testid="list-item"] .css-1f1q1js',
    '[aria-label="Pay"] span',
    '[data-testid="$80,684 - $144,804 a year-tile"]'
  ];
  
  salarySelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      const text = element.textContent?.trim();
      if (text && (text.includes('$') || text.includes('salary') || text.includes('year') || text.includes('hour'))) {
        console.log(`✅ Salary with "${selector}" [${index}]:`, text);
      }
    });
  });
  
  // Look for job type in various locations
  console.log('\n=== Job Type Selectors ===');
  const jobTypeSelectors = [
    '[data-testid="Full-time-tile"]',
    '[data-testid="Part-time-tile"]',
    '[data-testid="Contract-tile"]',
    '[data-testid="attribute_snippet_testid"]',
    '.jobsearch-JobMetadataHeader-item',
    '.css-1f1q1js',
    '[data-testid="list-item"] .css-1f1q1js',
    '[aria-label="Job type"] span',
    '[aria-label="Job type"] .css-1f1q1js'
  ];
  
  jobTypeSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      const text = element.textContent?.trim();
      if (text && (text.includes('Full-time') || text.includes('Part-time') || text.includes('Contract') || text.includes('time'))) {
        console.log(`✅ Job type with "${selector}" [${index}]:`, text);
      }
    });
  });
  
  // Look for work setting in various locations
  console.log('\n=== Work Setting Selectors ===');
  const workSettingSelectors = [
    '[data-testid="In-person-tile"]',
    '[data-testid="Remote-tile"]',
    '[data-testid="Hybrid-tile"]',
    '[aria-label="Work setting"] span',
    '[aria-label="Work setting"] .css-1f1q1js',
    '[data-testid="list-item"] .css-1f1q1js'
  ];
  
  workSettingSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      const text = element.textContent?.trim();
      if (text && (text.includes('In-person') || text.includes('Remote') || text.includes('Hybrid'))) {
        console.log(`✅ Work setting with "${selector}" [${index}]:`, text);
      }
    });
  });
  
  // Check if there's a selected job panel
  console.log('\n=== Selected Job Panel ===');
  const selectedJobPanel = document.querySelector('#jobsearch-ViewjobPaneWrapper');
  if (selectedJobPanel) {
    console.log('✅ Found selected job panel');
    console.log('Panel content preview:', selectedJobPanel.textContent?.trim().substring(0, 200));
  } else {
    console.log('❌ No selected job panel found');
  }
  
  // Check for job details section
  console.log('\n=== Job Details Section ===');
  const jobDetailsSection = document.querySelector('#jobDetailsSection');
  if (jobDetailsSection) {
    console.log('✅ Found job details section');
    console.log('Details content preview:', jobDetailsSection.textContent?.trim().substring(0, 200));
  } else {
    console.log('❌ No job details section found');
  }
  
} else {
  console.log('❌ Not on Indeed.com');
}

console.log('\n=== Debug Complete ===');
