const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';

// You'll need to get a valid JWT token first
const JWT_TOKEN = 'your-jwt-token-here';

const headers = {
  'Authorization': `Bearer ${JWT_TOKEN}`,
  'Content-Type': 'application/json',
  'x-tenant-id': TENANT_ID
};

async function testRolesEndpoints() {
  console.log('🧪 Testing Roles Endpoints with Permission Counts\n');

  try {
    // Test 1: Get roles summary
    console.log('📊 Testing GET /tenant/roles/summary/counts');
    try {
      const summaryResponse = await axios.get(`${BASE_URL}/tenant/roles/summary/counts`, { headers });
      console.log('✅ Summary endpoint successful');
      console.log('📋 Summary:', JSON.stringify(summaryResponse.data.summary, null, 2));
      console.log('🏆 Top 3 roles by permission count:');
      summaryResponse.data.roles.slice(0, 3).forEach((role, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        console.log(`   ${medal} ${role.name}: ${role.permission_count} permissions, ${role.user_count} users`);
      });
    } catch (error) {
      console.log('❌ Summary endpoint failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Get all roles
    console.log('📋 Testing GET /tenant/roles');
    try {
      const rolesResponse = await axios.get(`${BASE_URL}/tenant/roles`, { headers });
      console.log('✅ Roles list endpoint successful');
      console.log(`📊 Found ${rolesResponse.data.roles.length} roles`);
      
      console.log('\n📋 Roles with permission counts:');
      rolesResponse.data.roles
        .sort((a, b) => b.permission_count - a.permission_count)
        .forEach(role => {
          const permissionText = role.permission_count === 1 ? 'permission' : 'permissions';
          const userText = role.user_count === 1 ? 'user' : 'users';
          console.log(`   • ${role.name}: ${role.permission_count} ${permissionText}, ${role.user_count} ${userText}`);
        });
    } catch (error) {
      console.log('❌ Roles list endpoint failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 3: Get specific role details (Admin role)
    console.log('🔍 Testing GET /tenant/roles/:roleId (Admin role)');
    try {
      const rolesResponse = await axios.get(`${BASE_URL}/tenant/roles`, { headers });
      const adminRole = rolesResponse.data.roles.find(r => r.name === 'Admin');
      
      if (adminRole) {
        const roleResponse = await axios.get(`${BASE_URL}/tenant/roles/${adminRole.id}`, { headers });
        console.log('✅ Role details endpoint successful');
        console.log(`📋 Role: ${roleResponse.data.role.name}`);
        console.log(`📊 Permission count: ${roleResponse.data.role.permission_count}`);
        console.log(`👥 User count: ${roleResponse.data.role.user_count}`);
        console.log(`🔧 System role: ${roleResponse.data.role.is_system_role}`);
        
        if (roleResponse.data.permissions.length > 0) {
          console.log('\n📋 First 5 permissions:');
          roleResponse.data.permissions.slice(0, 5).forEach((perm, index) => {
            console.log(`   ${index + 1}. ${perm.module}.${perm.action} - ${perm.description || 'No description'}`);
          });
          if (roleResponse.data.permissions.length > 5) {
            console.log(`   ... and ${roleResponse.data.permissions.length - 5} more permissions`);
          }
        }
      } else {
        console.log('❌ Admin role not found');
      }
    } catch (error) {
      console.log('❌ Role details endpoint failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Instructions for running the test
console.log('🚀 Roles Endpoints Test Script');
console.log('='.repeat(50));
console.log('');
console.log('📝 Instructions:');
console.log('1. Make sure your NestJS server is running on http://localhost:3000');
console.log('2. Get a valid JWT token by logging in');
console.log('3. Replace "your-jwt-token-here" with your actual JWT token');
console.log('4. Run: node test-roles-endpoints.js');
console.log('');
console.log('🔑 To get a JWT token, you can:');
console.log('   - Use Postman to login via POST /auth/login');
console.log('   - Check browser dev tools after logging in');
console.log('   - Use the debug-auth.js script if available');
console.log('');

if (JWT_TOKEN === 'your-jwt-token-here') {
  console.log('⚠️  Please set a valid JWT token before running the test');
  console.log('   Edit this file and replace JWT_TOKEN with your actual token');
} else {
  testRolesEndpoints();
}