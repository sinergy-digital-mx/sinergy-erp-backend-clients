import * as XLSX from 'xlsx';
import * as path from 'path';

async function testExcelRead() {
    try {
        const excelFilePath = path.join(__dirname, '../excels/divino_full_leads.xlsx');
        console.log(`📁 Looking for Excel file at: ${excelFilePath}`);
        
        // Check if file exists
        const fs = require('fs');
        if (!fs.existsSync(excelFilePath)) {
            console.log('❌ Excel file not found. Available files in excels directory:');
            const files = fs.readdirSync(path.join(__dirname, '../excels'));
            files.forEach(file => console.log(`   - ${file}`));
            return;
        }

        // Read Excel file
        const workbook = XLSX.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Excel file read successfully`);
        console.log(`📊 Sheet name: ${sheetName}`);
        console.log(`📊 Total rows: ${data.length}`);
        
        if (data.length > 0) {
            const firstRow = data[0] as any;
            console.log(`📋 First row columns:`, Object.keys(firstRow));
            console.log(`📋 First row sample:`, JSON.stringify(firstRow, null, 2));
        }

    } catch (error) {
        console.error('❌ Error reading Excel file:', error);
    }
}

testExcelRead();