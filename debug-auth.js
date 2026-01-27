const axios = require('axios');

async function debugAuth() {
    const baseURL = 'http://localhost:3001';
    
    try {
        console.log('🔐 Step 1: Logging in...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            email: 'christopher.sandoval@test.com',
            password: 'password'
        });
        
        const token = loginResponse.data.access_token;
        console.log('✅ Login successful');
        console.log('🎫 Token preview:', token.substring(0, 50) + '...');
        
        // Test the debug endpoint first
        console.log('\n🧪 Step 2: Testing JWT auth with debug endpoint...');
        const debugResponse = await axios.get(`${baseURL}/leads/debug`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Debug endpoint successful!');
        console.log('👤 User info:', JSON.stringify(debugResponse.data.user, null, 2));
        
        // Now test the actual leads endpoint
        console.log('\n🧪 Step 3: Testing leads endpoint...');
        const leadsResponse = await axios.get(`${baseURL}/leads`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Leads endpoint successful!');
        console.log('📊 Response:', JSON.stringify(leadsResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error at step:', error.config?.url);
        console.error('📝 Status:', error.response?.status);
        console.error('📝 Status Text:', error.response?.statusText);
        console.error('📝 Error Data:', JSON.stringify(error.response?.data, null, 2));
        
        // Check headers being sent
        if (error.config?.headers) {
            console.log('\n📋 Headers sent:');
            console.log('   Authorization:', error.config.headers.Authorization?.substring(0, 50) + '...');
            console.log('   Content-Type:', error.config.headers['Content-Type']);
        }
    }
}

debugAuth();