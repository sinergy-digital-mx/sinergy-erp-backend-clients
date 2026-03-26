import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function testEndpoint() {
  console.log('🧪 Testing the endpoint by making a direct HTTP request...');
  
  try {
    // Use node's built-in fetch (Node 18+) or http module
    const response = await fetch('http://localhost:3001/api/tenant/roles/permissions/available', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNzJkNzJkYy1hNzE5LTQ5YzMtYjU4Zi1hNzE5ZjU4ZjU4ZjUiLCJ1c2VybmFtZSI6ImNocmlzdG9waGVyIiwidGVuYW50X2lkIjoiNTQ0ODFiNjMtNTUxNi00NThkLTliYjMtZDRlNWNiMDI4ODY0IiwiaWF0IjoxNzM5OTI5NzI4LCJleHAiOjE3Mzk5MzMzMjh9.Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7E',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Status:', response.status);
      console.log('📄 Response:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      console.log('❌ HTTP Error:', response.status);
      console.log('📄 Error response:', errorData);
    }
    
  } catch (error) {
    console.log('❌ Network/Fetch Error:', error.message);
  }
}

testEndpoint();