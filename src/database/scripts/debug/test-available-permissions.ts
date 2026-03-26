import axios from 'axios';

async function testAvailablePermissions() {
  try {
    console.log('🧪 Testing /api/tenant/roles/permissions/available endpoint...');
    
    const response = await axios.get('http://localhost:3001/api/tenant/roles/permissions/available', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNzJkNzJkYy1hNzE5LTQ5YzMtYjU4Zi1hNzE5ZjU4ZjU4ZjUiLCJ1c2VybmFtZSI6ImNocmlzdG9waGVyIiwidGVuYW50X2lkIjoiNTQ0ODFiNjMtNTUxNi00NThkLTliYjMtZDRlNWNiMDI4ODY0IiwiaWF0IjoxNzM5OTI5NzI4LCJleHAiOjE3Mzk5MzMzMjh9.Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7E',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success! Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ HTTP Error:', error.response.status);
      console.log('📄 Response data:', JSON.stringify(error.response.data, null, 2));
      console.log('📋 Headers:', error.response.headers);
    } else if (error.request) {
      console.log('❌ Network Error:', error.message);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testAvailablePermissions();