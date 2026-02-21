const XLSX = require('xlsx');

const workbook = XLSX.readFile('DATOS_PROPIETARIOS_DIVINO_con_pagos.xlsx');
const sheet = workbook.Sheets['Hoja2'];

// Read with proper headers
const data = XLSX.utils.sheet_to_json(sheet, { range: 1, defval: null });

console.log('Total registros:', data.length);
console.log('\nColumnas:', Object.keys(data[0]));

console.log('\n=== Primeros 5 registros ===');
data.slice(0, 5).forEach((row, i) => {
  console.log(`\n--- Registro ${i + 1}: ${row['PROPIETARIOS ']} ---`);
  Object.entries(row).forEach(([key, value]) => {
    if (value !== null && value !== '') {
      console.log(`  ${key}: ${value}`);
    }
  });
});

console.log('\n=== Registro con pagos (Jessica Ruiz) ===');
const jessica = data.find(r => r['PROPIETARIOS '] && r['PROPIETARIOS '].includes('Jessica'));
if (jessica) {
  Object.entries(jessica).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
}
