const XLSX = require('xlsx');

// Read Excel file to debug date values
const workbook = XLSX.readFile('DATOS_PROPIETARIOS_DIVINO_con_pagos.xlsx');
const sheet = workbook.Sheets['Hoja2'];
const data = XLSX.utils.sheet_to_json(sheet, { range: 1, defval: null });

// Find Jason Gomez LOT-1-01 entry
const jasonEntry = data.find(row => 
  row['PROPIETARIOS ']?.includes('Jason Gomez') && 
  String(row['Lote ']).trim() === '1'
);

if (jasonEntry) {
  console.log('Jason Gomez LOT-1-01 data:');
  console.log('Raw Excel date serial:', jasonEntry['Fecha de Inicio']);
  console.log('Expected date: 9/1/2024');
  
  // Test different date conversion methods
  const serial = jasonEntry['Fecha de Inicio'];
  
  // Method 1: Current (wrong)
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  const method1 = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
  console.log('Method 1 (current):', method1.toLocaleDateString());
  
  // Method 2: Excel epoch correction
  const excelEpoch = new Date(1899, 11, 30);
  const days = Math.floor(serial);
  const method2 = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
  console.log('Method 2 (Excel epoch):', method2.toLocaleDateString());
  
  // Method 3: Direct Excel date conversion
  const method3 = new Date((serial - 25569) * 86400 * 1000);
  console.log('Method 3 (direct):', method3.toLocaleDateString());
  
  // Method 4: XLSX built-in date conversion
  const method4 = XLSX.SSF.parse_date_code(serial);
  console.log('Method 4 (XLSX built-in):', method4);
  
} else {
  console.log('Jason Gomez LOT-1-01 not found');
  console.log('Available entries:');
  data.slice(0, 5).forEach((row, i) => {
    console.log(`${i}: ${row['PROPIETARIOS ']} - Lote ${row['Lote ']} - Date: ${row['Fecha de Inicio']}`);
  });
}