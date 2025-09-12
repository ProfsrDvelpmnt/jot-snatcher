// Quick setup script for testing API endpoints
// Run this with: node quick-setup.js

const testEndpoints = async () => {
  const baseUrl = 'http://127.0.0.1:8080'; // Change to your webapp URL
  const userId = 'test-user-' + Date.now();
  
  console.log('🧪 Testing JOT Snatcher API Endpoints...\n');
  
  // Test 1: Health Check
  console.log('1️⃣ Testing /api/ext-health...');
  try {
    const healthResponse = await fetch(`${baseUrl}/api/ext-health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  // Test 2: Status Check
  console.log('\n2️⃣ Testing /api/ext-status...');
  try {
    const statusResponse = await fetch(`${baseUrl}/api/ext-status`, {
      headers: {
        'x-user-id': userId,
        'Content-Type': 'application/json'
      }
    });
    const statusData = await statusResponse.json();
    console.log('✅ Status check:', statusData);
  } catch (error) {
    console.log('❌ Status check failed:', error.message);
  }
  
  // Test 3: Submit Job
  console.log('\n3️⃣ Testing /api/ext-jobs...');
  try {
    const jobData = {
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'Remote',
      description: 'Great opportunity for a software engineer',
      url: 'https://example.com/job/123',
      status: 'interested',
      source: 'extension'
    };
    
    const jobResponse = await fetch(`${baseUrl}/api/ext-jobs`, {
      method: 'POST',
      headers: {
        'x-user-id': userId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jobData)
    });
    const jobResult = await jobResponse.json();
    console.log('✅ Job submission:', jobResult);
  } catch (error) {
    console.log('❌ Job submission failed:', error.message);
  }
  
  // Test 4: Usage Stats
  console.log('\n4️⃣ Testing /api/ext-usage...');
  try {
    const usageResponse = await fetch(`${baseUrl}/api/ext-usage`, {
      headers: {
        'x-user-id': userId,
        'Content-Type': 'application/json'
      }
    });
    const usageData = await usageResponse.json();
    console.log('✅ Usage stats:', usageData);
  } catch (error) {
    console.log('❌ Usage stats failed:', error.message);
  }
  
  console.log('\n🎉 Testing complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Implement the missing endpoints in your webapp');
  console.log('2. Set up the database tables in Supabase');
  console.log('3. Test the extension with your webapp');
  console.log('4. Check the API_ENDPOINTS_IMPLEMENTATION.md guide for detailed instructions');
};

// Run the tests
testEndpoints().catch(console.error);
