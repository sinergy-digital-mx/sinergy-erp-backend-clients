// Script para probar si el backend está respondiendo correctamente con CORS
const https = require('https');

const options = {
  hostname: 'sapi.sinergydigital.mx',
  port: 443,
  path: '/api/auth/login',
  method: 'OPTIONS', // Preflight request
  headers: {
    'Origin': 'https://divino.sinergydigital.mx',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type,authorization'
  }
};

console.log('🔍 Probando CORS en el backend...\n');
console.log('URL:', `https://${options.hostname}${options.path}`);
console.log('Origin:', options.headers.Origin);
console.log('\n---\n');

const req = https.request(options, (res) => {
  console.log('✅ Respuesta recibida');
  console.log('Status Code:', res.statusCode);
  console.log('\n📋 Headers de respuesta:');
  console.log(JSON.stringify(res.headers, null, 2));
  
  console.log('\n---\n');
  
  // Verificar headers importantes
  const corsHeaders = {
    'access-control-allow-origin': res.headers['access-control-allow-origin'],
    'access-control-allow-methods': res.headers['access-control-allow-methods'],
    'access-control-allow-headers': res.headers['access-control-allow-headers'],
    'access-control-allow-credentials': res.headers['access-control-allow-credentials']
  };
  
  console.log('🔐 Headers CORS específicos:');
  console.log(JSON.stringify(corsHeaders, null, 2));
  
  console.log('\n---\n');
  
  if (!corsHeaders['access-control-allow-origin']) {
    console.log('❌ PROBLEMA: No hay header Access-Control-Allow-Origin');
    console.log('   El backend NO está enviando los headers de CORS');
    console.log('\n💡 Soluciones:');
    console.log('   1. Verifica que el backend esté corriendo: pm2 list');
    console.log('   2. Reinicia el backend: pm2 restart [nombre-proceso]');
    console.log('   3. Verifica los logs: pm2 logs [nombre-proceso]');
    console.log('   4. Si hay nginx/proxy, verifica su configuración');
  } else {
    console.log('✅ CORS configurado correctamente');
  }
});

req.on('error', (e) => {
  console.error('❌ Error al conectar con el backend:');
  console.error(e.message);
  console.log('\n💡 El backend puede no estar corriendo o no ser accesible');
});

req.end();
