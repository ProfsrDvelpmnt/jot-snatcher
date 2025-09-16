// Simple debug script - copy and paste this into browser console
// Run this when the Hiring.Cafe modal is open

console.log('🔍 HIRING.CAFE MODAL DEBUG');
console.log('========================');

const detailedView = document.querySelector('.flex.flex-col.items-start.justify-start.text-start.w-full.bg-white.p-6');
if (!detailedView) {
  console.log('❌ No detailed view found');
} else {
  console.log('✅ Detailed view found');
  
  // Look for the specific job description container structure
  console.log('\n🎯 JOB DESCRIPTION CONTAINER SEARCH:');
  console.log('==================================');
  
  const jobDescContainer = detailedView.querySelector('.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl');
  if (jobDescContainer) {
    console.log('✅ Job description container FOUND!');
    console.log('📏 Container dimensions:', {
      width: jobDescContainer.offsetWidth,
      height: jobDescContainer.offsetHeight,
      scrollHeight: jobDescContainer.scrollHeight
    });
    
    // Check for the "Job Description" span
    const jobDescSpan = jobDescContainer.querySelector('span.text-md.border.my-2.px-2.font-semibold.rounded-full.text-gray-600');
    if (jobDescSpan && jobDescSpan.textContent?.includes('Job Description')) {
      console.log('✅ "Job Description" span FOUND!');
      console.log('   Text:', jobDescSpan.textContent.trim());
    } else {
      console.log('❌ "Job Description" span NOT FOUND');
    }
    
    // Check for the "Copy Job Description" button
    const copyButton = jobDescContainer.querySelector('button.mt-4.inline-flex.items-center.space-x-2.bg-pink-50.rounded.px-4.py-2.text-pink-600.text-xs.font-semibold');
    if (copyButton && copyButton.textContent?.includes('Copy Job Description')) {
      console.log('✅ "Copy Job Description" button FOUND!');
      console.log('   Text:', copyButton.textContent.trim());
    } else {
      console.log('❌ "Copy Job Description" button NOT FOUND');
    }
    
    // Check for the article with content
    const article = jobDescContainer.querySelector('article.prose.prose-h1\\:text-2xl.pt-4.pb-16');
    if (article) {
      console.log('✅ Article with exact classes FOUND!');
      console.log('   Classes:', article.className);
      console.log('   Text length:', article.textContent?.length || 0);
      console.log('   First 200 chars:', article.textContent?.substring(0, 200) + '...');
    } else {
      console.log('❌ Article with exact classes NOT FOUND');
      
      // Try other article selectors
      const articleSelectors = [
        'article.prose.pt-4.pb-16',
        'article.prose',
        'article[class*="prose"]',
        'article'
      ];
      
      console.log('🔍 Trying other article selectors...');
      for (const selector of articleSelectors) {
        const article = jobDescContainer.querySelector(selector);
        if (article) {
          console.log(`✅ Found article with selector: ${selector}`);
          console.log('   Classes:', article.className);
          console.log('   Text length:', article.textContent?.length || 0);
          console.log('   First 200 chars:', article.textContent?.substring(0, 200) + '...');
          break;
        }
      }
    }
    
    // Show all children of the container
    console.log('\n🌳 Container children:');
    Array.from(jobDescContainer.children).forEach((child, index) => {
      console.log(`  ${index + 1}. <${child.tagName.toLowerCase()}> class="${child.className}"`);
      console.log(`     Text length: ${child.textContent?.length || 0}`);
      if (child.textContent?.length > 0) {
        console.log(`     First 100 chars: "${child.textContent.substring(0, 100)}..."`);
      }
    });
    
  } else {
    console.log('❌ Job description container NOT FOUND');
    
    // Try to find it by looking for the "Job Description" span first
    console.log('\n🔍 Fallback: Looking for "Job Description" span...');
    const jobDescSpans = detailedView.querySelectorAll('span.text-md.border.my-2.px-2.font-semibold.rounded-full.text-gray-600');
    console.log(`Found ${jobDescSpans.length} spans with matching classes`);
    
    for (let i = 0; i < jobDescSpans.length; i++) {
      const span = jobDescSpans[i];
      if (span.textContent?.includes('Job Description')) {
        console.log(`✅ Found "Job Description" span at index ${i}`);
        console.log('   Text:', span.textContent.trim());
        
        // Look for parent container
        const parentContainer = span.closest('.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl');
        if (parentContainer) {
          console.log('✅ Found parent container via span!');
          console.log('   Parent classes:', parentContainer.className);
        } else {
          console.log('❌ Parent container not found');
        }
        break;
      }
    }
  }
  
  // Look for all articles in the detailed view
  console.log('\n📰 ALL ARTICLES IN DETAILED VIEW:');
  console.log('================================');
  
  const allArticles = detailedView.querySelectorAll('article');
  console.log(`Found ${allArticles.length} articles total`);
  
  allArticles.forEach((article, index) => {
    console.log(`\nArticle ${index + 1}:`);
    console.log('  Classes:', article.className);
    console.log('  Text length:', article.textContent?.length || 0);
    console.log('  Parent classes:', article.parentElement?.className);
    console.log('  First 200 chars:', article.textContent?.substring(0, 200) + '...');
  });
  
  // Look for all elements with "prose" class
  console.log('\n📝 ALL PROSE ELEMENTS:');
  console.log('====================');
  
  const proseElements = detailedView.querySelectorAll('[class*="prose"]');
  console.log(`Found ${proseElements.length} elements with "prose" class`);
  
  proseElements.forEach((element, index) => {
    console.log(`\nProse element ${index + 1}:`);
    console.log('  Tag:', element.tagName);
    console.log('  Classes:', element.className);
    console.log('  Text length:', element.textContent?.length || 0);
    console.log('  Parent classes:', element.parentElement?.className);
  });
  
  // Show all spans with "Job Description" text
  console.log('\n📋 SPANS WITH "JOB DESCRIPTION" TEXT:');
  console.log('===================================');
  
  const allSpans = detailedView.querySelectorAll('span');
  const jobDescSpans = Array.from(allSpans).filter(span => 
    span.textContent?.includes('Job Description')
  );
  
  console.log(`Found ${jobDescSpans.length} spans containing "Job Description"`);
  jobDescSpans.forEach((span, index) => {
    console.log(`\nSpan ${index + 1}:`);
    console.log('  Classes:', span.className);
    console.log('  Text:', span.textContent?.trim());
    console.log('  Parent classes:', span.parentElement?.className);
    
    // Explore the parent structure
    console.log('  Parent element:', span.parentElement?.tagName, span.parentElement?.className);
    console.log('  Grandparent element:', span.parentElement?.parentElement?.tagName, span.parentElement?.parentElement?.className);
    
    // Look for job description content near this span
    console.log('  Looking for job description content...');
    const parent = span.parentElement;
    if (parent) {
      // Look for articles in the parent
      const articles = parent.querySelectorAll('article');
      console.log(`    Found ${articles.length} articles in parent`);
      
      // Look for divs with job content
      const divs = parent.querySelectorAll('div');
      console.log(`    Found ${divs.length} divs in parent`);
      
      // Look for any elements with substantial text content
      const allElements = parent.querySelectorAll('*');
      const textElements = Array.from(allElements).filter(el => 
        el.textContent && el.textContent.length > 100 && 
        (el.textContent.includes('Duties') || el.textContent.includes('Responsibilities') || el.textContent.includes('Requirements'))
      );
      console.log(`    Found ${textElements.length} elements with job content`);
      
      textElements.forEach((el, i) => {
        console.log(`      Element ${i + 1}: <${el.tagName.toLowerCase()}> class="${el.className}"`);
        console.log(`        Text length: ${el.textContent.length}`);
        console.log(`        First 200 chars: "${el.textContent.substring(0, 200)}..."`);
      });
    }
  });
  
  // Look for the actual job description content structure
  console.log('\n🔍 SEARCHING FOR JOB DESCRIPTION CONTENT:');
  console.log('========================================');
  
  // Look for elements containing job-related keywords
  const keywords = ['Duties', 'Responsibilities', 'Requirements', 'Qualifications', 'Job Type', 'Pay', 'Benefits'];
  keywords.forEach(keyword => {
    const elements = detailedView.querySelectorAll('*');
    const matches = Array.from(elements).filter(el => 
      el.textContent?.includes(keyword) && 
      el.children.length === 0 && // Only leaf nodes
      el.textContent.length > 50
    );
    
    if (matches.length > 0) {
      console.log(`\n"${keyword}" found in ${matches.length} elements:`);
      matches.forEach((el, index) => {
        console.log(`  ${index + 1}. <${el.tagName.toLowerCase()}> class="${el.className}"`);
        console.log(`     Text: "${el.textContent?.trim().substring(0, 100)}..."`);
        console.log(`     Parent: <${el.parentElement?.tagName.toLowerCase()}> class="${el.parentElement?.className}"`);
      });
    }
  });
}

console.log('\n✅ Debug complete! Check the output above to verify the structure.');
