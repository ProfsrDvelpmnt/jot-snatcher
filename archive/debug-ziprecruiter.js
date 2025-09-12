// Comprehensive ZipRecruiter debugging script
console.log('🔍 ZipRecruiter Extraction Debug Tool');
console.log('=====================================');

// Check if we're on ZipRecruiter
if (window.location.hostname.includes('ziprecruiter.com')) {
  console.log('✅ On ZipRecruiter page');
  console.log('📍 URL:', window.location.href);
  console.log('📄 Page Title:', document.title);
  
  // Test the current selectors from the ZipRecruiter extractor
  console.log('\n🔍 Testing ZipRecruiter Extractor Selectors:');
  
  // Job Container selectors
  const containerSelectors = [
    '.job_content', 
    '.jobDescriptionSection', 
    '[data-test="job-description"]'
  ];
  
  console.log('\n📦 Job Container Selectors:');
  containerSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`  ${selector}: ${elements.length} found`);
    if (elements.length > 0) {
      console.log(`    First element:`, elements[0]);
      console.log(`    Classes: ${elements[0].className}`);
    }
  });
  
  // Title selectors
  const titleSelectors = [
    'h1[data-test="job-title"]',
    '.job_title h1',
    'h1.job-title'
  ];
  
  console.log('\n📝 Job Title Selectors:');
  titleSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`  ${selector}: ${elements.length} found`);
    if (elements.length > 0) {
      console.log(`    Text: "${elements[0].textContent?.trim()}"`);
    }
  });
  
  // Company selectors
  const companySelectors = [
    '[data-test="company-name"]',
    '.company_name a',
    '.hiring_company a'
  ];
  
  console.log('\n🏢 Company Selectors:');
  companySelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`  ${selector}: ${elements.length} found`);
    if (elements.length > 0) {
      console.log(`    Text: "${elements[0].textContent?.trim()}"`);
    }
  });
  
  // Location selectors
  const locationSelectors = [
    '[data-test="job-location"]',
    '.location',
    '.job_location'
  ];
  
  console.log('\n📍 Location Selectors:');
  locationSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`  ${selector}: ${elements.length} found`);
    if (elements.length > 0) {
      console.log(`    Text: "${elements[0].textContent?.trim()}"`);
    }
  });
  
  // Salary selectors
  const salarySelectors = [
    '[data-test="compensation-text"]',
    '.salary_snippet_text',
    '.compensation'
  ];
  
  console.log('\n💰 Salary Selectors:');
  salarySelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`  ${selector}: ${elements.length} found`);
    if (elements.length > 0) {
      console.log(`    Text: "${elements[0].textContent?.trim()}"`);
    }
  });
  
  // Description selectors
  const descriptionSelectors = [
    '[data-test="job-description"]',
    '.jobDescriptionSection',
    '.job_description'
  ];
  
  console.log('\n📄 Description Selectors:');
  descriptionSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`  ${selector}: ${elements.length} found`);
    if (elements.length > 0) {
      console.log(`    Text: "${elements[0].textContent?.trim().substring(0, 100)}..."`);
    }
  });
  
  // Look for any data-test attributes
  console.log('\n🔍 All data-test attributes on page:');
  const dataTestElements = document.querySelectorAll('[data-test]');
  const dataTestValues = new Set();
  dataTestElements.forEach(el => {
    const value = el.getAttribute('data-test');
    if (value) dataTestValues.add(value);
  });
  console.log('  Found data-test values:', Array.from(dataTestValues));
  
  // Look for common job-related classes
  console.log('\n🔍 Common job-related classes:');
  const commonClasses = [
    'job', 'title', 'company', 'location', 'salary', 'description', 
    'position', 'role', 'employer', 'compensation', 'work'
  ];
  
  commonClasses.forEach(classPart => {
    const elements = document.querySelectorAll(`[class*="${classPart}"]`);
    if (elements.length > 0) {
      console.log(`  [class*="${classPart}"]: ${elements.length} found`);
      // Show first few unique class names
      const uniqueClasses = new Set();
      for (let i = 0; i < Math.min(elements.length, 5); i++) {
        uniqueClasses.add(elements[i].className);
      }
      console.log(`    Sample classes: ${Array.from(uniqueClasses).slice(0, 3).join(', ')}`);
    }
  });
  
  // Test the extraction manager
  console.log('\n🧪 Testing Extraction Manager:');
  if (typeof window.JOTDebugger !== 'undefined') {
    console.log('  JOTDebugger available, testing ZipRecruiter extraction...');
    try {
      const result = window.JOTDebugger.debugExtraction('ziprecruiter');
      console.log('  Debug result:', result);
    } catch (e) {
      console.log('  Error testing extraction:', e);
    }
  } else {
    console.log('  JOTDebugger not available');
  }
  
  // Look for h1 elements (common for job titles)
  console.log('\n🔍 All h1 elements:');
  const h1Elements = document.querySelectorAll('h1');
  h1Elements.forEach((h1, index) => {
    console.log(`  h1[${index}]: "${h1.textContent?.trim()}"`);
    console.log(`    Classes: ${h1.className}`);
    console.log(`    Data attributes: ${Array.from(h1.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', ')}`);
  });
  
  // Look for links (common for company names)
  console.log('\n🔍 All links (potential company names):');
  const links = document.querySelectorAll('a');
  const companyLinks = Array.from(links).filter(link => {
    const text = link.textContent?.trim() || '';
    const href = link.href || '';
    return (text.length > 2 && text.length < 50) && 
           (href.includes('company') || href.includes('employer') || 
            link.className.includes('company') || link.className.includes('employer'));
  });
  
  companyLinks.slice(0, 5).forEach((link, index) => {
    console.log(`  a[${index}]: "${link.textContent?.trim()}"`);
    console.log(`    href: ${link.href}`);
    console.log(`    classes: ${link.className}`);
  });
  
} else {
  console.log('❌ Not on ZipRecruiter page');
  console.log('📍 Current URL:', window.location.href);
}
