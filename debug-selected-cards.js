// Debug script to identify the truly selected job card
console.log('🔍 DEBUG: Analyzing job card selection...');

// Find all job cards
const allJobCards = document.querySelectorAll('.member-job-card-container, .clickable-member-job-card, [action="job-card"]');
console.log('🔍 Total job cards found:', allJobCards.length);

// Look for cards with the selected-card class specifically
const selectedCards = document.querySelectorAll('.selected-card');
console.log('🔍 Cards with selected-card class:', selectedCards.length);

selectedCards.forEach((card, index) => {
  const jobLink = card.querySelector('a[href*="/job/"]');
  const jobTitle = card.querySelector('.job-card-title');
  const companyName = card.querySelector('.job-card-company-name');
  
  console.log(`🔍 Selected card ${index}:`, {
    element: card,
    classes: card.className,
    jobTitle: jobTitle?.textContent?.trim(),
    company: companyName?.textContent?.trim(),
    jobUrl: jobLink?.href
  });
});

// Also check for clickable-member-job-card.selected-card specifically
const specificSelectedCards = document.querySelectorAll('.clickable-member-job-card.selected-card');
console.log('🔍 Cards with .clickable-member-job-card.selected-card:', specificSelectedCards.length);

specificSelectedCards.forEach((card, index) => {
  const jobLink = card.querySelector('a[href*="/job/"]');
  const jobTitle = card.querySelector('.job-card-title');
  const companyName = card.querySelector('.job-card-company-name');
  
  console.log(`🔍 Specific selected card ${index}:`, {
    element: card,
    classes: card.className,
    jobTitle: jobTitle?.textContent?.trim(),
    company: companyName?.textContent?.trim(),
    jobUrl: jobLink?.href
  });
});

// Check what job is currently displayed in the main panel
const mainJobTitle = document.querySelector('.sticky-job-title');
const mainCompanyName = document.querySelector('.member-company-name');
console.log('🔍 Currently displayed job in main panel:', {
  title: mainJobTitle?.textContent?.trim(),
  company: mainCompanyName?.textContent?.trim()
});

// Find the URL that should match
const currentUrl = window.location.href;
console.log('🔍 Current page URL:', currentUrl);

// Look for any job cards that might have a different selection indicator
console.log('🔍 Checking for other selection indicators...');

// Check for cards with background styles
const cardsWithBackgrounds = document.querySelectorAll('[action="job-card"][style*="background"]');
console.log('🔍 Cards with background styles:', cardsWithBackgrounds.length);
cardsWithBackgrounds.forEach((card, index) => {
  console.log(`🔍 Background card ${index}:`, {
    element: card,
    style: card.getAttribute('style'),
    classes: card.className,
    jobUrl: card.querySelector('a[href*="/job/"]')?.href
  });
});

// Check for cards with border styles (like the blue border mentioned)
const cardsWithBorders = Array.from(allJobCards).filter(card => {
  const style = window.getComputedStyle(card);
  return style.border && style.border !== 'none' && style.border !== '0px';
});

console.log('🔍 Cards with borders:', cardsWithBorders.length);
cardsWithBorders.forEach((card, index) => {
  const style = window.getComputedStyle(card);
  console.log(`🔍 Border card ${index}:`, {
    element: card,
    border: style.border,
    borderColor: style.borderColor,
    classes: card.className,
    jobUrl: card.querySelector('a[href*="/job/"]')?.href
  });
});

console.log('🔍 DEBUG: Analysis complete');
