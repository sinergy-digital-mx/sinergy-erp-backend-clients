const axios = require('axios');

async function testLeadsEndpoint() {
    const baseURL = 'http://localhost:3001';
    
    try {
        // First, login to get a token
        console.log('🔐 Logging in...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            email: 'christopher.sandoval@test.com',
            password: 'password123' // You might need to adjust this
        });
        
        const token = loginResponse.data.access_token;
        console.log('✅ Login successful, token received');
        
        // Now try to get leads
        console.log('\n📋 Fetching leads...');
        const leadsResponse = await axios.get(`${baseURL}/leads`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Leads fetched successfully!');
        console.log(`📊 Found ${leadsResponse.data.total || leadsResponse.data.length} leads`);
        
        if (leadsResponse.data.data) {
            console.log('📄 First few leads:');
            leadsResponse.data.data.slice(0, 3).forEach((lead, index) => {
                console.log(`   ${index + 1}. ${lead.name} ${lead.lastname} - ${lead.email}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.statusText);
        console.error('📝 Error details:', error.response?.data);
        
        if (error.response?.status === 401) {
            console.log('\n🔍 Debugging 401 Unauthorized:');
            console.log('   - Check if the token is being sent correctly');
            console.log('   - Verify the token format (Bearer <token>)');
            console.log('   - Check if the JWT secret is correct');
            console.log('   - Verify the token hasn\'t expired');
        }
        
        if (error.response?.status === 403) {
            console.log('\n🔍 Debugging 403 Forbidden:');
            console.log('   - User has valid token but lacks permissions');
            console.log('   - Check RBAC permissions for Lead:Read');
        }
    }
}

// Test with different scenarios
async function runTests() {
    console.log('🧪 Testing Leads Endpoint\n');
    
    // Test 1: Basic fetch
    await testLeadsEndpoint();
    
    // Test 2: With pagination
    console.log('\n\n🧪 Testing with pagination...');
    try {
        const loginResponse = await axios.post('http://localhost:3001/auth/login', {
            email: 'christopher.sandoval@test.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.access_token;
        
        const paginatedResponse = await axios.get('http://localhost:3001/leads?page=1&limit=5', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Paginated request successful!');
        console.log(`📊 Page 1 of ${paginatedResponse.data.totalPages}, showing ${paginatedResponse.data.data.length} of ${paginatedResponse.data.total} leads`);
        
    } catch (error) {
        console.error('❌ Pagination test failed:', error.response?.status, error.response?.data);
    }
}

runTests();