// Debug script specifically for Chakra UI modal
// Run this in the browser console when the modal is open

console.log('🔍 CHAKRA UI MODAL DEBUG');
console.log('======================');

// Try the specific selector you mentioned
const chakraModal = document.querySelector('#chakra-modal--body-\\:rgb\\: > div.flex.flex-col > div > div > div.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl > article > div');

if (chakraModal) {
  console.log('✅ Found Chakra modal with exact selector!');
  console.log('Element:', chakraModal);
  console.log('Classes:', chakraModal.className);
  console.log('Text length:', chakraModal.textContent?.length || 0);
  console.log('First 500 chars:', chakraModal.textContent?.substring(0, 500));
} else {
  console.log('❌ Chakra modal not found with exact selector');
  
  // Try to find the modal step by step
  console.log('\n🔍 STEP-BY-STEP MODAL SEARCH:');
  
  // Step 1: Find the modal body
  const modalBody = document.querySelector('#chakra-modal--body-\\:rgb\\:');
  if (modalBody) {
    console.log('✅ Step 1: Found modal body');
    console.log('  Classes:', modalBody.className);
    
    // Step 2: Find the flex div
    const flexDiv = modalBody.querySelector('div.flex.flex-col');
    if (flexDiv) {
      console.log('✅ Step 2: Found flex div');
      console.log('  Classes:', flexDiv.className);
      
      // Step 3: Find the next div
      const nextDiv = flexDiv.querySelector('div');
      if (nextDiv) {
        console.log('✅ Step 3: Found next div');
        console.log('  Classes:', nextDiv.className);
        
        // Step 4: Find the job description container
        const jobDescContainer = nextDiv.querySelector('div.flex.flex-col.items-center.mb-16.border.shadow-2xl.rounded-3xl');
        if (jobDescContainer) {
          console.log('✅ Step 4: Found job description container');
          console.log('  Classes:', jobDescContainer.className);
          
          // Step 5: Find the article
          const article = jobDescContainer.querySelector('article');
          if (article) {
            console.log('✅ Step 5: Found article');
            console.log('  Classes:', article.className);
            
            // Step 6: Find the description div
            const descriptionDiv = article.querySelector('div');
            if (descriptionDiv) {
              console.log('✅ Step 6: Found description div');
              console.log('  Classes:', descriptionDiv.className);
              console.log('  Text length:', descriptionDiv.textContent?.length || 0);
              console.log('  First 500 chars:', descriptionDiv.textContent?.substring(0, 500));
            } else {
              console.log('❌ Step 6: No description div found in article');
              
              // Show all divs in the article
              const allDivs = article.querySelectorAll('div');
              console.log(`  Found ${allDivs.length} divs in article:`);
              allDivs.forEach((div, index) => {
                console.log(`    Div ${index + 1}: classes="${div.className}"`);
                console.log(`      Text length: ${div.textContent?.length || 0}`);
                if (div.textContent && div.textContent.length > 50) {
                  console.log(`      First 200 chars: "${div.textContent.substring(0, 200)}..."`);
                }
              });
            }
          } else {
            console.log('❌ Step 5: No article found in job description container');
          }
        } else {
          console.log('❌ Step 4: No job description container found');
        }
      } else {
        console.log('❌ Step 3: No next div found');
      }
    } else {
      console.log('❌ Step 2: No flex div found');
    }
  } else {
    console.log('❌ Step 1: No modal body found');
    
    // Try alternative modal selectors
    console.log('\n🔍 TRYING ALTERNATIVE MODAL SELECTORS:');
    const altSelectors = [
      '[id*="chakra-modal"]',
      '[id*="modal"]',
      '.chakra-modal',
      '[role="dialog"]',
      '.fixed',
      '.absolute'
    ];
    
    altSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
        elements.forEach((el, index) => {
          console.log(`  ${index + 1}. ID: ${el.id || 'none'}`);
          console.log(`     Classes: ${el.className}`);
          console.log(`     Text length: ${el.textContent?.length || 0}`);
        });
      }
    });
  }
}

console.log('\n✅ Chakra modal debug complete!');
