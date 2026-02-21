import * as XLSX from 'xlsx';
import * as path from 'path';

async function readExcelStructure() {
  try {
    const filePath = path.join(process.cwd(), 'DATOS_PROPIETARIOS_DIVINO.xlsx');
    console.log('📂 Reading file:', filePath);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    console.log('📄 Sheet name:', sheetName);

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('\n📊 First 10 rows:');
    data.slice(0, 10).forEach((row: any, index: number) => {
      console.log(`Row ${index}:`, JSON.stringify(row));
    });

    console.log('\n📋 Column headers (Row 1):');
    const headers = data[1] as any[];
    headers.forEach((header, index) => {
      if (header) {
        console.log(`  Column ${index} (${String.fromCharCode(65 + index)}): "${header}"`);
      }
    });

    console.log('\n📈 Total rows:', data.length);

    console.log('\n🔍 Sample data rows (2-5):');
    for (let i = 2; i <= 5; i++) {
      const row = data[i] as any[];
      console.log(`\nRow ${i}:`);
      headers.forEach((header, index) => {
        if (header && row[index] !== undefined) {
          console.log(`  ${header}: "${row[index]}"`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

readExcelStructure();
