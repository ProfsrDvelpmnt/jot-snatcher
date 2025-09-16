// Debug script to expose all elements in the Hiring.Cafe modal window
// Run this in the browser console when the modal is open

function debugModalElements() {
  console.log('🔍 DEBUGGING HIRING.CAFE MODAL ELEMENTS');
  console.log('=====================================');
  
  // Find the modal/detailed view container
  const detailedView = document.querySelector('.flex.flex-col.items-start.justify-start.text-start.w-full.bg-white.p-6');
  
  if (!detailedView) {
    console.log('❌ No detailed view found');
    return;
  }
  
  console.log('✅ Detailed view found:', detailedView);
  console.log('📏 Detailed view dimensions:', {
    width: detailedView.offsetWidth,
    height: detailedView.offsetHeight,
    scrollHeight: detailedView.scrollHeight
  });
  
  // Function to recursively explore elements
  function exploreElement(element, depth = 0, path = '') {
    const indent = '  '.repeat(depth);
    const tagName = element.tagName.toLowerCase();
    const className = element.className || 'no-class';
    const id = element.id || 'no-id';
    const textContent = element.textContent?.trim().substring(0, 100) || '';
    
    console.log(`${indent}${tagName}${id !== 'no-id' ? '#' + id : ''}${className !== 'no-class' ? '.' + className.split(' ').join('.') : ''}`);
    
    if (textContent) {
      console.log(`${indent}  📝 Text: "${textContent}${element.textContent?.length > 100 ? '...' : ''}"`);
    }
    
    // Check for specific attributes
    if (element.href) console.log(`${indent}  🔗 href: ${element.href}`);
    if (element.src) console.log(`${indent}  🖼️ src: ${element.src}`);
    if (element.role) console.log(`${indent}  🎭 role: ${element.role}`);
    if (element.ariaLabel) console.log(`${indent}  ♿ aria-label: ${element.ariaLabel}`);
    
    // Check for data attributes
    const dataAttrs = Array.from(element.attributes).filter(attr => attr.name.startsWith('data-'));
    if (dataAttrs.length > 0) {
      console.log(`${indent}  📊 data attributes:`, dataAttrs.map(attr => `${attr.name}="${attr.value}"`).join(', '));
    }
    
    // Check for specific content patterns
    if (textContent.includes('Job Description') || textContent.includes('Description')) {
      console.log(`${indent}  🎯 *** JOB DESCRIPTION RELATED ***`);
    }
    if (textContent.includes('Responsibilities') || textContent.includes('Requirements')) {
      console.log(`${indent}  🎯 *** JOB CONTENT RELATED ***`);
    }
    if (textContent.includes('Company') || textContent.includes('About')) {
      console.log(`${indent}  🎯 *** COMPANY INFO RELATED ***`);
    }
    
    // Explore children (limit depth to avoid too much output)
    if (depth < 5) {
      Array.from(element.children).forEach((child, index) => {
        const childPath = path ? `${path} > ${tagName}:nth-child(${index + 1})` : `${tagName}:nth-child(${index + 1})`;
        exploreElement(child, depth + 1, childPath);
      });
    } else if (element.children.length > 0) {
      console.log(`${indent}  ... (${element.children.length} more children, depth limit reached)`);
    }
  }
  
  console.log('\n🌳 FULL ELEMENT TREE:');
  console.log('====================');
  exploreElement(detailedView);
  
  // Look for specific patterns
  console.log('\n🔍 SPECIFIC ELEMENT SEARCHES:');
  console.log('============================');
  
  // Job description related elements
  const jobDescSpans = detailedView.querySelectorAll('span');
  console.log(`\n📋 All spans (${jobDescSpans.length}):`);
  jobDescSpans.forEach((span, index) => {
    const text = span.textContent?.trim();
    if (text && text.length > 0) {
      console.log(`  ${index + 1}. "${text}" (classes: ${span.className})`);
    }
  });
  
  // Articles
  const articles = detailedView.querySelectorAll('article');
  console.log(`\n📰 All articles (${articles.length}):`);
  articles.forEach((article, index) => {
    console.log(`  ${index + 1}. Classes: ${article.className}`);
    console.log(`     Text length: ${article.textContent?.length || 0}`);
    console.log(`     First 200 chars: "${article.textContent?.substring(0, 200)}..."`);
  });
  
  // Buttons
  const buttons = detailedView.querySelectorAll('button');
  console.log(`\n🔘 All buttons (${buttons.length}):`);
  buttons.forEach((button, index) => {
    console.log(`  ${index + 1}. "${button.textContent?.trim()}" (classes: ${button.className})`);
  });
  
  // Divs with specific classes
  const divs = detailedView.querySelectorAll('div');
  console.log(`\n📦 All divs with classes containing "prose" or "description" (${Array.from(divs).filter(d => d.className.includes('prose') || d.className.includes('description')).length}):`);
  Array.from(divs).forEach((div, index) => {
    if (div.className.includes('prose') || div.className.includes('description')) {
      console.log(`  ${index + 1}. Classes: ${div.className}`);
      console.log(`     Text length: ${div.textContent?.length || 0}`);
    }
  });
  
  // Look for elements with specific text content
  console.log(`\n🎯 ELEMENTS CONTAINING SPECIFIC TEXT:`);
  console.log('====================================');
  
  const searchTerms = ['Job Description', 'Description', 'Responsibilities', 'Requirements', 'Duties', 'Qualifications'];
  searchTerms.forEach(term => {
    const elements = detailedView.querySelectorAll('*');
    const matches = Array.from(elements).filter(el => 
      el.textContent?.includes(term) && 
      el.children.length === 0 // Only leaf nodes
    );
    
    if (matches.length > 0) {
      console.log(`\n"${term}" found in ${matches.length} elements:`);
      matches.forEach((el, index) => {
        console.log(`  ${index + 1}. <${el.tagName.toLowerCase()}> class="${el.className}"`);
        console.log(`     Text: "${el.textContent?.trim()}"`);
      });
    }
  });
  
  // Look for the job description container specifically
  console.log(`\n🎯 JOB DESCRIPTION CONTAINER SEARCH:`);
  console.log('==================================');
  
  const jobDescContainer = detailedView.querySelector('.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl');
  if (jobDescContainer) {
    console.log('✅ Job description container found!');
    console.log('📏 Container dimensions:', {
      width: jobDescContainer.offsetWidth,
      height: jobDescContainer.offsetHeight,
      scrollHeight: jobDescContainer.scrollHeight
    });
    console.log('🌳 Container children:');
    Array.from(jobDescContainer.children).forEach((child, index) => {
      console.log(`  ${index + 1}. <${child.tagName.toLowerCase()}> class="${child.className}"`);
      console.log(`     Text length: ${child.textContent?.length || 0}`);
    });
  } else {
    console.log('❌ Job description container not found');
  }
  
  // Look for the "Copied!" button
  console.log(`\n🎯 "COPIED!" BUTTON SEARCH:`);
  console.log('========================');
  
  const copiedButton = detailedView.querySelector('button.mt-4.inline-flex.items-center.space-x-2.bg-pink-50.rounded.px-4.py-2.text-pink-600.text-xs.font-semibold');
  if (copiedButton) {
    console.log('✅ "Copied!" button found!');
    console.log('📏 Button dimensions:', {
      width: copiedButton.offsetWidth,
      height: copiedButton.offsetHeight
    });
    console.log('🌳 Button parent:', copiedButton.parentElement?.tagName, copiedButton.parentElement?.className);
  } else {
    console.log('❌ "Copied!" button not found');
    
    // Look for any button with "Copied" text
    const allButtons = detailedView.querySelectorAll('button');
    const copiedButtons = Array.from(allButtons).filter(btn => btn.textContent?.includes('Copied'));
    if (copiedButtons.length > 0) {
      console.log(`Found ${copiedButtons.length} buttons with "Copied" text:`);
      copiedButtons.forEach((btn, index) => {
        console.log(`  ${index + 1}. "${btn.textContent?.trim()}" (classes: ${btn.className})`);
      });
    }
  }
  
  // Look for article elements
  console.log(`\n🎯 ARTICLE ELEMENTS SEARCH:`);
  console.log('==========================');
  
  const articles = detailedView.querySelectorAll('article');
  if (articles.length > 0) {
    console.log(`✅ Found ${articles.length} article elements:`);
    articles.forEach((article, index) => {
      console.log(`  ${index + 1}. Classes: ${article.className}`);
      console.log(`     Text length: ${article.textContent?.length || 0}`);
      console.log(`     Parent: <${article.parentElement?.tagName.toLowerCase()}> class="${article.parentElement?.className}"`);
    });
  } else {
    console.log('❌ No article elements found');
  }
  
  // Look for elements with "prose" class
  console.log(`\n🎯 PROSE ELEMENTS SEARCH:`);
  console.log('========================');
  
  const proseElements = detailedView.querySelectorAll('[class*="prose"]');
  if (proseElements.length > 0) {
    console.log(`✅ Found ${proseElements.length} elements with "prose" class:`);
    proseElements.forEach((el, index) => {
      console.log(`  ${index + 1}. <${el.tagName.toLowerCase()}> class="${el.className}"`);
      console.log(`     Text length: ${el.textContent?.length || 0}`);
      console.log(`     Parent: <${el.parentElement?.tagName.toLowerCase()}> class="${el.parentElement?.className}"`);
    });
  } else {
    console.log('❌ No elements with "prose" class found');
  }
  
  console.log('\n✅ Debug complete! Check the output above to identify the correct elements.');
}

// Run the debug function
debugModalElements();
