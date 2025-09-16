// Comprehensive debug script for Hiring.Cafe modal
// Run this in the browser console when the modal is open

console.log('🔍 COMPREHENSIVE HIRING.CAFE MODAL DEBUG');
console.log('======================================');

// Find all possible modal containers
const modalSelectors = [
  '.flex.flex-col.items-start.justify-start.text-start.w-full.bg-white.p-6',
  '[class*="modal"]',
  '[class*="chakra-modal"]',
  '[id*="modal"]',
  '.fixed',
  '.absolute',
  '[role="dialog"]'
];

console.log('🎯 SEARCHING FOR MODAL CONTAINERS:');
console.log('=================================');

let modalContainer = null;
modalSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
    elements.forEach((el, index) => {
      console.log(`  ${index + 1}. Classes: ${el.className}`);
      console.log(`     ID: ${el.id || 'none'}`);
      console.log(`     Text length: ${el.textContent?.length || 0}`);
      if (el.textContent?.includes('Job Description')) {
        console.log(`     🎯 *** CONTAINS "JOB DESCRIPTION" ***`);
        modalContainer = el;
      }
    });
  } else {
    console.log(`❌ No elements found with selector: ${selector}`);
  }
});

if (modalContainer) {
  console.log('\n🎯 FOUND MODAL CONTAINER WITH JOB DESCRIPTION:');
  console.log('============================================');
  console.log('Container:', modalContainer);
  console.log('Classes:', modalContainer.className);
  console.log('ID:', modalContainer.id);
  
  // Now search for job description content within this container
  console.log('\n🔍 SEARCHING FOR JOB DESCRIPTION CONTENT:');
  console.log('=======================================');
  
  // Look for the job description container
  const jobDescSelectors = [
    '.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl',
    '[class*="flex"][class*="flex-col"][class*="items-center"]',
    '[class*="border"][class*="shadow"]',
    '[class*="rounded-3xl"]'
  ];
  
  let jobDescContainer = null;
  jobDescSelectors.forEach(selector => {
    const elements = modalContainer.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
      elements.forEach((el, index) => {
        console.log(`  ${index + 1}. Classes: ${el.className}`);
        console.log(`     Text length: ${el.textContent?.length || 0}`);
        if (el.textContent?.includes('Job Description') || el.textContent?.includes('Duties')) {
          console.log(`     🎯 *** CONTAINS JOB CONTENT ***`);
          jobDescContainer = el;
        }
      });
    }
  });
  
  if (jobDescContainer) {
    console.log('\n🎯 FOUND JOB DESCRIPTION CONTAINER:');
    console.log('=================================');
    console.log('Container:', jobDescContainer);
    console.log('Classes:', jobDescContainer.className);
    
    // Look for articles within this container
    const articles = jobDescContainer.querySelectorAll('article');
    console.log(`\n📰 ARTICLES IN CONTAINER: ${articles.length}`);
    articles.forEach((article, index) => {
      console.log(`  Article ${index + 1}:`);
      console.log(`    Classes: ${article.className}`);
      console.log(`    Text length: ${article.textContent?.length || 0}`);
      console.log(`    First 200 chars: "${article.textContent?.substring(0, 200)}..."`);
      
      // Look for divs within the article
      const divs = article.querySelectorAll('div');
      console.log(`    Divs in article: ${divs.length}`);
      divs.forEach((div, divIndex) => {
        if (div.textContent && div.textContent.length > 50) {
          console.log(`      Div ${divIndex + 1}: classes="${div.className}"`);
          console.log(`        Text length: ${div.textContent.length}`);
          console.log(`        First 100 chars: "${div.textContent.substring(0, 100)}..."`);
        }
      });
    });
    
    // Look for the specific description div
    const descriptionDivSelectors = [
      'div.max-w-sm.md\\:max-w-md.lg\\:max-w-full.overflow-auto.px-4',
      'div[class*="max-w-sm"]',
      'div[class*="overflow-auto"]',
      'div[class*="px-4"]'
    ];
    
    console.log('\n🔍 SEARCHING FOR DESCRIPTION DIV:');
    descriptionDivSelectors.forEach(selector => {
      const elements = jobDescContainer.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
        elements.forEach((el, index) => {
          console.log(`  ${index + 1}. Classes: ${el.className}`);
          console.log(`     Text length: ${el.textContent?.length || 0}`);
          console.log(`     First 200 chars: "${el.textContent?.substring(0, 200)}..."`);
        });
      }
    });
    
  } else {
    console.log('\n❌ NO JOB DESCRIPTION CONTAINER FOUND');
    
    // Look for any elements with substantial job content
    console.log('\n🔍 SEARCHING FOR ANY JOB CONTENT:');
    const allElements = modalContainer.querySelectorAll('*');
    const jobContentElements = Array.from(allElements).filter(el => {
      const text = el.textContent?.trim() || '';
      return text.length > 200 && (
        text.includes('Duties') || 
        text.includes('Responsibilities') || 
        text.includes('Requirements') ||
        text.includes('Job Type') ||
        text.includes('Pay') ||
        text.includes('Benefits')
      );
    });
    
    console.log(`Found ${jobContentElements.length} elements with job content:`);
    jobContentElements.forEach((el, index) => {
      console.log(`  ${index + 1}. <${el.tagName.toLowerCase()}> class="${el.className}"`);
      console.log(`     Text length: ${el.textContent?.length || 0}`);
      console.log(`     First 200 chars: "${el.textContent?.substring(0, 200)}..."`);
      console.log(`     Parent: <${el.parentElement?.tagName.toLowerCase()}> class="${el.parentElement?.className}"`);
    });
  }
  
} else {
  console.log('\n❌ NO MODAL CONTAINER FOUND WITH JOB DESCRIPTION');
  
  // Look for any elements containing "Job Description" text
  console.log('\n🔍 SEARCHING FOR ANY "JOB DESCRIPTION" TEXT:');
  const allElements = document.querySelectorAll('*');
  const jobDescElements = Array.from(allElements).filter(el => 
    el.textContent?.includes('Job Description')
  );
  
  console.log(`Found ${jobDescElements.length} elements containing "Job Description":`);
  jobDescElements.forEach((el, index) => {
    console.log(`  ${index + 1}. <${el.tagName.toLowerCase()}> class="${el.className}"`);
    console.log(`     Text: "${el.textContent?.trim()}"`);
    console.log(`     Parent: <${el.parentElement?.tagName.toLowerCase()}> class="${el.parentElement?.className}"`);
  });
}

console.log('\n✅ Comprehensive debug complete!');
