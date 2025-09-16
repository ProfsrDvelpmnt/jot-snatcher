// Debug script to check what's actually being extracted from Indeed
console.log('=== Indeed Extraction Debug ===');

// Check if we're on Indeed
if (window.location.hostname.includes('indeed.com')) {
  console.log('✅ On Indeed.com');
  
  // Check for job title
  const titleElement = document.querySelector('h1[data-testid="jobsearch-JobInfoHeader-title"]');
  if (titleElement) {
    console.log('📋 Job Title:', titleElement.textContent?.trim());
  } else {
    console.log('❌ Job title not found');
  }
  
  // Check for company
  const companyElement = document.querySelector('[data-testid="company-name"]');
  if (companyElement) {
    console.log('🏢 Company:', companyElement.textContent?.trim());
  } else {
    console.log('❌ Company not found');
  }
  
  // Check for location
  const locationElement = document.querySelector('[data-testid="job-location"]');
  if (locationElement) {
    console.log('📍 Location:', locationElement.textContent?.trim());
  } else {
    console.log('❌ Location not found');
  }
  
  // Check for salary
  const salaryElement = document.querySelector('[data-testid*="salary"]');
  if (salaryElement) {
    console.log('💰 Salary:', salaryElement.textContent?.trim());
  } else {
    console.log('❌ Salary not found');
  }
  
  // Check for job type
  const jobTypeElement = document.querySelector('[data-testid="Full-time-tile"]');
  if (jobTypeElement) {
    console.log('💼 Job Type:', jobTypeElement.textContent?.trim());
  } else {
    console.log('❌ Job type not found');
  }
  
  // Check for work setting
  const workSettingElement = document.querySelector('[data-testid="In-person-tile"]');
  if (workSettingElement) {
    console.log('🏢 Work Setting:', workSettingElement.textContent?.trim());
  } else {
    console.log('❌ Work setting not found');
  }
  
  // Check for description
  const descriptionElement = document.querySelector('#jobDescriptionText');
  if (descriptionElement) {
    const descText = descriptionElement.textContent?.trim();
    console.log('📝 Description length:', descText?.length || 0);
    console.log('📝 Description preview:', descText?.substring(0, 200) + '...');
  } else {
    console.log('❌ Description not found');
  }
  
  // Check for job URL
  console.log('🔗 Current URL:', window.location.href);
  
} else {
  console.log('❌ Not on Indeed.com');
}

// Test the actual extraction functions
console.log('\n=== Testing Extraction Functions ===');

// Test position cleaning
function cleanPositionTitle(position) {
  if (!position) return null;
  let cleaned = position.trim();
  
  const suffixesToRemove = [
    ' - job post', ' - job', ' job post', ' job',
    ' - indeed', ' - indeed.com'
  ];
  
  for (const suffix of suffixesToRemove) {
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.replace(suffix, '').trim();
      break;
    }
  }
  
  return cleaned || null;
}

// Test salary parsing
function parseSalary(salaryText) {
  if (!salaryText || salaryText.trim() === '') {
    return { salary: '', salary_type: 'annual', salary_min: null, salary_max: null };
  }

  const originalText = salaryText.trim();
  const cleanText = salaryText.replace(/[$,\s]/g, '').toLowerCase();
  
  // Annual salary patterns
  if (cleanText.includes('per year') || cleanText.includes('a year') || cleanText.includes('annually') || 
      cleanText.includes('yearly') || cleanText.includes('/yr') ||
      (cleanText.match(/\d+(?:\.\d+)?k?\s*-\s*\d+(?:\.\d+)?k?/) && !cleanText.includes('hour') && !cleanText.includes('month'))) {
    const numbers = cleanText.match(/(\d+(?:\.\d+)?)/g);
    if (numbers && numbers.length >= 2) {
      const min = parseFloat(numbers[0]) * (numbers[0].length <= 3 ? 1000 : 1);
      const max = parseFloat(numbers[1]) * (numbers[1].length <= 3 ? 1000 : 1);
      return {
        salary: originalText,
        salary_type: 'annual',
        salary_min: min,
        salary_max: max
      };
    }
  }
  
  return { salary: originalText, salary_type: 'annual', salary_min: null, salary_max: null };
}

// Test environment detection
function extractEnvironmentFromJobDetails(container) {
  // Look for "Work setting" in job details
  const workSettingElements = container.querySelectorAll('*');
  for (const element of workSettingElements) {
    const text = element.textContent?.trim();
    if (text && text.includes('Work setting:')) {
      const setting = text.replace('Work setting:', '').trim();
      if (setting.toLowerCase().includes('in-person')) {
        return 'In-person';
      } else if (setting.toLowerCase().includes('remote')) {
        return 'Remote';
      } else if (setting.toLowerCase().includes('hybrid')) {
        return 'Hybrid';
      }
    }
  }
  
  // Alternative: Look for the specific "In-person" tile
  const inPersonTile = container.querySelector('[data-testid="In-person-tile"]');
  if (inPersonTile) {
    return 'In-person';
  }
  
  // Look for work setting section and check for in-person
  const workSettingSection = container.querySelector('[aria-label="Work setting"]');
  if (workSettingSection) {
    const inPersonSpan = workSettingSection.querySelector('span');
    if (inPersonSpan && inPersonSpan.textContent?.includes('In-person')) {
      return 'In-person';
    }
  }
  
  return 'Not specified';
}

// Test job type detection
function extractJobTypeFromJobDetails(container) {
  // Look for "Job type" in job details
  const jobTypeElements = container.querySelectorAll('*');
  for (const element of jobTypeElements) {
    const text = element.textContent?.trim();
    if (text && text.includes('Job type:')) {
      const type = text.replace('Job type:', '').trim();
      if (isValidJobType(type)) {
        return type;
      }
    }
  }
  
  // Alternative: Look for the specific "Full-time" tile
  const fullTimeTile = container.querySelector('[data-testid="Full-time-tile"]');
  if (fullTimeTile) {
    return 'Full-time';
  }
  
  // Look for job type section and check for full-time
  const jobTypeSection = container.querySelector('[aria-label="Job type"]');
  if (jobTypeSection) {
    const fullTimeSpan = jobTypeSection.querySelector('span');
    if (fullTimeSpan && fullTimeSpan.textContent?.includes('Full-time')) {
      return 'Full-time';
    }
  }
  
  return 'Not specified';
}

function isValidJobType(text) {
  if (!text) return false;
  
  const validTypes = [
    'full-time', 'full time', 'part-time', 'part time', 'contract', 'seasonal',
    'temporary', 'permanent', 'internship', 'intern', 'freelance', 'consultant', 'volunteer'
  ];
  
  return validTypes.some(type => 
    text.toLowerCase().includes(type.toLowerCase())
  );
}

// Run the tests
console.log('\n=== Function Tests ===');

// Test position cleaning
const testTitle = 'Nurse- Nursing Officer of the Day (NOD) - job post';
console.log('Position cleaning test:', cleanPositionTitle(testTitle));

// Test salary parsing
const testSalary = '$80,684 - $144,804 a year';
console.log('Salary parsing test:', parseSalary(testSalary));

// Test environment detection
const environment = extractEnvironmentFromJobDetails(document.body);
console.log('Environment detection:', environment);

// Test job type detection
const jobType = extractJobTypeFromJobDetails(document.body);
console.log('Job type detection:', jobType);

console.log('\n=== Debug Complete ===');
