// Debug script to test admin authentication
console.log('🔍 Admin Authentication Debug Script');
console.log('=====================================');

// Test admin emails
const adminEmails = ['sasenav74@gmail.com', 'admin@test.com'];
const adminPassword = 'admin123';

console.log('📧 Admin emails to test:', adminEmails);
console.log('🔑 Admin password:', adminPassword);

// Function to test if we can authenticate with Supabase
async function testAdminAuth() {
  console.log('\n🔍 Testing Supabase Authentication...');
  
  try {
    // Import Supabase client (this will work in the extension context)
    const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
    
    // You'll need to replace these with your actual Supabase credentials
    const supabaseUrl = 'YOUR_SUPABASE_URL';
    const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('✅ Supabase client created');
    
    // Test authentication for each admin email
    for (const email of adminEmails) {
      console.log(`\n🔍 Testing authentication for: ${email}`);
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: adminPassword
        });
        
        if (error) {
          console.error(`❌ Authentication failed for ${email}:`, error.message);
        } else {
          console.log(`✅ Authentication successful for ${email}:`, data.user);
        }
      } catch (err) {
        console.error(`❌ Error testing ${email}:`, err);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
  }
}

// Run the test
testAdminAuth();

console.log('\n📝 Instructions:');
console.log('1. Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY with actual values');
console.log('2. Run this script in the browser console on your extension');
console.log('3. Check if the admin users can authenticate with Supabase');
