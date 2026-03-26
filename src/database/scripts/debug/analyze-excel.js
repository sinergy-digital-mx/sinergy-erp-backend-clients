const XLSX = require('xlsx');

const wb = XLSX.readFile('DATOS_PROPIETARIOS_DIVINO_con_pagos.xlsx');
console.log('Hojas disponibles:', wb.SheetNames);

const ws = wb.Sheets[wb.SheetNames[1]]; // Hoja 2
const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: ''});

console.log('\n=== ANÁLISIS DEL EXCEL (HOJA 2) ===\n');
console.log('Total de columnas:', data[1].length);
console.log('\nTODOS los Headers (Fila 2):');
data[1].forEach((h, i) => {
  if (h) console.log(`  Col ${i}: "${h}"`);
});

console.log('\n\nPrimer dato completo (Fila 3):');
data[2].forEach((v, i) => {
  if (v !== '') console.log(`  Col ${i}: "${v}"`);
});
