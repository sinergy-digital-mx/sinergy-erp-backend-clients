const axios = require('axios');

// Test the roles API endpoints
async function testRolesAPI() {
  console.log('🧪 Testing Roles API Endpoints\n');

  // You need to replace this with a real JWT token
  const JWT_TOKEN = 'your-jwt-token-here';
  const BASE_URL = 'http://localhost:3000';
  const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';

  const headers = {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json',
    'x-tenant-id': TENANT_ID
  };

  try {
    // Test 1: Get roles summary
    console.log('📊 Testing GET /tenant/roles/summary/counts');
    const summaryResponse = await axios.get(`${BASE_URL}/tenant/roles/summary/counts`, { headers });
    console.log('✅ Summary endpoint successful');
    console.log('📋 Summary:', JSON.stringify(summaryResponse.data.summary, null, 2));
    console.log('🏆 Top 3 roles:');
    summaryResponse.data.roles.slice(0, 3).forEach((role, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      console.log(`   ${medal} ${role.name}: ${role.permission_count} permissions`);
    });

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Get all roles
    console.log('📋 Testing GET /tenant/roles');
    const rolesResponse = await axios.get(`${BASE_URL}/tenant/roles`, { headers });
    console.log('✅ Roles list endpoint successful');
    console.log(`📊 Found ${rolesResponse.data.roles.length} roles`);
    
    console.log('\n📋 Roles with permission counts:');
    rolesResponse.data.roles
      .sort((a, b) => b.permission_count - a.permission_count)
      .slice(0, 5)
      .forEach(role => {
        console.log(`   • ${role.name}: ${role.permission_count} permissions, ${role.user_count} users`);
      });

  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

// Instructions
console.log('🚀 Roles API Test Script');
console.log('='.repeat(50));
console.log('');
console.log('📝 To run this test:');
console.log('1. Make sure your NestJS server is running');
console.log('2. Get a JWT token by logging in as Christopher');
console.log('3. Replace "your-jwt-token-here" with the actual token');
console.log('4. Run: node test-roles-api.js');
console.log('');

// Only run if token is provided
const JWT_TOKEN = 'your-jwt-token-here';
if (JWT_TOKEN !== 'your-jwt-token-here') {
  testRolesAPI();
} else {
  console.log('⚠️  Please set a valid JWT token first');
}