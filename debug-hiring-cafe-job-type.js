// Debug script to check Hiring.Cafe job type extraction
// Run this in the browser console on Hiring.Cafe

console.log('=== Hiring.Cafe Job Type Debug ===');

// Find all job cards
const jobCards = document.querySelectorAll('.job-card, .job-item, [class*="job"]');
console.log('Found job cards:', jobCards.length);

jobCards.forEach((card, index) => {
  console.log(`\n--- Job Card ${index + 1} ---`);
  
  // Look for job type badges
  const badges = card.querySelectorAll('.rounded.text-xs.px-3.py-1.border.border-gray-400.font-bold');
  console.log('Badges found:', badges.length);
  
  badges.forEach((badge, badgeIndex) => {
    const text = badge.textContent?.trim();
    console.log(`Badge ${badgeIndex + 1}:`, text);
    
    // Test current validation logic
    const isValid = isValidJobType(text);
    console.log(`  Is valid job type:`, isValid);
  });
  
  // Look for other potential job type elements
  const jobTypeElements = card.querySelectorAll('[class*="type"], [class*="employment"], [class*="work"]');
  console.log('Job type elements found:', jobTypeElements.length);
  
  jobTypeElements.forEach((element, elementIndex) => {
    const text = element.textContent?.trim();
    console.log(`Job type element ${elementIndex + 1}:`, text);
  });
  
  // Look for "Full Time" text anywhere in the card
  const fullTimeElements = card.querySelectorAll('*');
  fullTimeElements.forEach(element => {
    if (element.textContent?.includes('Full Time')) {
      console.log('Found "Full Time" in element:', element.textContent.trim());
      console.log('Element classes:', element.className);
    }
  });
});

function isValidJobType(text) {
  if (!text) return false;
  
  // Must not contain salary indicators
  if (text.includes('$') || text.includes('k/yr') || text.includes('/yr')) {
    return false;
  }
  
  // Must not contain salary-related keywords
  const salaryKeywords = [
    'k/yr', '/yr', 'year', 'hour', 'hr', 'annual', 'monthly', 'weekly',
    'salary', 'pay', 'compensation', 'wage', 'rate', 'per hour', 'per year',
    'thousand', 'million', 'dollars', 'usd', 'k', 'm'
  ];
  
  const hasSalaryKeyword = salaryKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (hasSalaryKeyword) {
    return false;
  }
  
  // Must not contain numbers (salary amounts)
  const hasNumbers = /\d/.test(text);
  if (hasNumbers) {
    return false;
  }
  
  // Must not contain location indicators
  const locationIndicators = [
    'onsite', 'remote', 'hybrid', 'location', 'address', 'city', 'state',
    'country', 'united states', 'usa', 'us', 'california', 'texas', 'florida',
    'new york', 'chicago', 'atlanta', 'dallas', 'miami', 'seattle', 'denver'
  ];
  
  const hasLocationIndicator = locationIndicators.some(indicator => 
    text.toLowerCase().includes(indicator.toLowerCase())
  );
  
  if (hasLocationIndicator) {
    return false;
  }
  
  // Must not contain navigation or UI elements
  const uiIndicators = [
    'view all jobs', 'website', 'apply', 'click', 'button', 'link',
    'more info', 'details', 'read more', 'learn more'
  ];
  
  const hasUiIndicator = uiIndicators.some(indicator => 
    text.toLowerCase().includes(indicator.toLowerCase())
  );
  
  if (hasUiIndicator) {
    return false;
  }
  
  // Must be a valid employment type (not job title or position)
  const validJobTypes = [
    'full-time', 'part-time', 'contract', 'seasonal', 'temporary', 'permanent',
    'internship', 'intern', 'freelance', 'consultant', 'volunteer'
  ];
  
  const isValidJobType = validJobTypes.some(jobType => 
    text.toLowerCase().includes(jobType.toLowerCase())
  );
  
  if (!isValidJobType) {
    return false;
  }
  
  return true;
}
