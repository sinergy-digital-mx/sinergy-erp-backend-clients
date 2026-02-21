const axios = require('axios');

async function testDirectEndpoint() {
  console.log('🧪 Testing Direct Endpoint\n');

  // Test without authentication first to see if endpoint exists
  const BASE_URL = 'http://localhost:3000';
  
  try {
    console.log('📋 Testing GET /tenant/roles (without auth)');
    const response = await axios.get(`${BASE_URL}/tenant/roles`);
    console.log('✅ Endpoint exists and responded');
  } catch (error) {
    if (error.response) {
      console.log(`📊 Endpoint exists - Status: ${error.response.status}`);
      console.log(`📋 Error: ${error.response.data.message || 'Unknown error'}`);
      
      if (error.response.status === 401) {
        console.log('✅ This is expected - endpoint exists but needs authentication');
      } else if (error.response.status === 404) {
        console.log('❌ Endpoint not found - server might not be running or routes not loaded');
      }
    } else {
      console.log('❌ Network error - server might not be running');
      console.log('Error:', error.message);
    }
  }

  try {
    console.log('\n📊 Testing GET /tenant/roles/summary/counts (without auth)');
    const response = await axios.get(`${BASE_URL}/tenant/roles/summary/counts`);
    console.log('✅ Summary endpoint exists and responded');
  } catch (error) {
    if (error.response) {
      console.log(`📊 Summary endpoint - Status: ${error.response.status}`);
      console.log(`📋 Error: ${error.response.data.message || 'Unknown error'}`);
      
      if (error.response.status === 401) {
        console.log('✅ This is expected - endpoint exists but needs authentication');
      } else if (error.response.status === 404) {
        console.log('❌ Summary endpoint not found');
        console.log('💡 This suggests the server needs to be restarted');
      }
    } else {
      console.log('❌ Network error - server might not be running');
      console.log('Error:', error.message);
    }
  }

  // Test a simple endpoint to verify server is running
  try {
    console.log('\n🏥 Testing server health');
    const response = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is running');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ Server is running (404 is normal for root path)');
    } else {
      console.log('❌ Server might not be running');
      console.log('Error:', error.message);
    }
  }
}

testDirectEndpoint();