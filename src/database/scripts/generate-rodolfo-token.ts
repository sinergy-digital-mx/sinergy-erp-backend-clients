import * as jwt from 'jsonwebtoken';

function generateRodolfoToken() {
  const payload = {
    sub: '763b6ebe-fb57-11f0-a52e-06e7ea787385', // Rodolfo's user ID
    email: 'rodolfo.rodriguez@test.com',
    tenant_id: '54481b63-5516-458d-9bb3-d4e5cb028864',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour from now
  };

  // Use a simple secret for testing (in production this should be from env)
  const secret = 'your-secret-key'; // You might need to check what secret the app uses
  
  const token = jwt.sign(payload, secret);
  
  console.log('🎫 Generated token for Rodolfo Rodriguez:');
  console.log(token);
  console.log('\n📋 Token payload:');
  console.log(JSON.stringify(payload, null, 2));
  
  return token;
}

generateRodolfoToken();