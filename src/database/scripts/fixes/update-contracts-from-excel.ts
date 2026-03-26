import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';

dotenv.config();

const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
});

interface ExcelRow {
  'PROPIETARIOS ': string;
  'Lote ': string | number;
  'Mnz': number;
  ' Enganche ': number | null;
  'Fecha de Inicio': number;
  'Dias limite de pago': number;
  'Numero de pagos totales': string | number;
  'Meses pagados': string | number;
  'Moneda': string;
  ' Monto mensual ': string | number;
  '% Interes moratorio': number;
}

function normalizePropertyCode(lote: string | number, manzana: number): string[] {
  const loteStr = String(lote).trim();
  
  if (loteStr.includes('y')) {
    const lots = loteStr.split('y').map(l => l.trim());
    return lots.map(lot => `LOT-${manzana}-${lot.padStart(2, '0')}`);
  }
  
  return [`LOT-${manzana}-${loteStr.padStart(2, '0')}`];
}

async function updateContracts() {
  await AppDataSource.initialize();
  console.log('✅ Database connected\n');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // Read Excel file
    const workbook = XLSX.readFile('DATOS_PROPIETARIOS_DIVINO_con_pagos.xlsx');
    const sheet = workbook.Sheets['Hoja2'];
    const data: ExcelRow[] = XLSX.utils.sheet_to_json(sheet, { range: 1, defval: null });

    console.log(`📊 Found ${data.length} records in Excel\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const row of data) {
      const ownerName = row['PROPIETARIOS ']?.trim();
      if (!ownerName) continue;

      const propertyCodes = normalizePropertyCode(row['Lote '], row['Mnz']);
      const enganche = row[' Enganche '];
      const numeroPagosTotales = row['Numero de pagos totales'];
      const montoMensual = row[' Monto mensual '];

      // Skip if fully paid
      if (numeroPagosTotales === 'TOTALMENTE PAGADO') {
        skippedCount++;
        continue;
      }

      const totalPayments = parseInt(String(numeroPagosTotales));
      const monthlyAmount = parseFloat(String(montoMensual));
      const downPayment = enganche ? parseFloat(String(enganche)) : 0;

      // Process each property code
      for (const propertyCode of propertyCodes) {
        try {
          // Find contract by property code
          const contracts = await queryRunner.query(
            `SELECT c.id, c.total_price FROM contracts c
             INNER JOIN properties p ON c.property_id = p.id
             WHERE p.code = ? AND c.tenant_id = ?`,
            [propertyCode, TENANT_ID]
          );

          if (contracts.length === 0) {
            console.log(`⚠️  ${ownerName} - ${propertyCode}: Contract not found`);
            errorCount++;
            continue;
          }

          const contract = contracts[0];

          // Update contract with payment data
          await queryRunner.query(
            `UPDATE contracts 
             SET down_payment = ?,
                 monthly_payment = ?,
                 payment_months = ?,
                 remaining_balance = total_price - down_payment
             WHERE id = ?`,
            [downPayment, monthlyAmount, totalPayments, contract.id]
          );

          console.log(`✅ ${ownerName} - ${propertyCode}: Updated (Enganche: $${downPayment}, Mensual: $${monthlyAmount}, Meses: ${totalPayments})`);
          updatedCount++;

        } catch (error) {
          console.error(`❌ ${ownerName} - ${propertyCode}: Error -`, error.message);
          errorCount++;
        }
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

updateContracts()
  .then(() => {
    console.log('\n✅ Update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });
