import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

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
  'Fecha de Inicio': number; // Excel date serial
  'Dias limite de pago': number;
  'Numero de pagos totales': string | number;
  'Meses pagados': string | number;
  'Moneda': string;
  ' Monto mensual ': string | number;
  '% Interes moratorio': number;
}

function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
}

function normalizePropertyCode(lote: string | number, manzana: number): string[] {
  const loteStr = String(lote).trim();
  
  // Handle multiple lots like "1y 2" or "1 y 2"
  if (loteStr.includes('y')) {
    const lots = loteStr.split('y').map(l => l.trim());
    return lots.map(lot => `LOT-${manzana}-${lot.padStart(2, '0')}`);
  }
  
  return [`LOT-${manzana}-${loteStr.padStart(2, '0')}`];
}

async function importPayments() {
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

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const row of data) {
      const ownerName = row['PROPIETARIOS ']?.trim();
      if (!ownerName) continue;

      const propertyCodes = normalizePropertyCode(row['Lote '], row['Mnz']);
      const enganche = row[' Enganche '];
      const fechaInicio = row['Fecha de Inicio'];
      const diasLimite = row['Dias limite de pago'];
      const numeroPagosTotales = row['Numero de pagos totales'];
      const mesesPagados = row['Meses pagados'];
      const montoMensual = row[' Monto mensual '];
      const interesMoratorio = row['% Interes moratorio'];

      // Skip if fully paid
      if (numeroPagosTotales === 'TOTALMENTE PAGADO') {
        console.log(`⏭️  ${ownerName} - TOTALMENTE PAGADO, skipping`);
        skippedCount++;
        continue;
      }

      // Process each property code
      for (const propertyCode of propertyCodes) {
        try {
          // Find contract by property code
          const contracts = await queryRunner.query(
            `SELECT c.* FROM contracts c
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

          // Check if payments already exist
          const existingPayments = await queryRunner.query(
            `SELECT COUNT(*) as count FROM payments WHERE contract_id = ?`,
            [contract.id]
          );

          if (existingPayments[0].count > 0) {
            console.log(`ℹ️  ${ownerName} - ${propertyCode}: Payments already exist (${existingPayments[0].count}), skipping`);
            skippedCount++;
            continue;
          }

          // Update contract with interest fields
          await queryRunner.query(
            `UPDATE contracts 
             SET payment_due_day = ?, 
                 interest_rate = ?,
                 currency = ?
             WHERE id = ?`,
            [diasLimite, interesMoratorio, row['Moneda'], contract.id]
          );

          // Parse payment data
          const totalPayments = parseInt(String(numeroPagosTotales));
          const paidMonths = parseInt(String(mesesPagados));
          const monthlyAmount = parseFloat(String(montoMensual));
          const startDate = excelDateToJSDate(fechaInicio);

          // Generate all payments - each payment is due on the 5th of each month
          const payments: any[] = [];
          for (let i = 0; i < totalPayments; i++) {
            // Calculate due date: 5th of each month starting from contract start month
            const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 5);

            const isPaid = i < paidMonths;
            const status = isPaid ? 'pagado' : 'pendiente';
            const paidDate = isPaid ? dueDate : null;

            payments.push({
              tenant_id: TENANT_ID,
              contract_id: contract.id,
              payment_number: i + 1,
              amount: monthlyAmount,
              due_date: dueDate.toISOString().split('T')[0],
              paid_date: paidDate ? paidDate.toISOString().split('T')[0] : null,
              status: status,
              payment_method: isPaid ? 'efectivo' : null,
              reference_number: null,
              notes: isPaid ? 'Pago histórico importado' : null,
            });
          }

          // Insert payments
          for (const payment of payments) {
            await queryRunner.query(
              `INSERT INTO payments 
               (id, tenant_id, contract_id, payment_number, amount, due_date, paid_date, status, payment_method, reference_number, notes, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                uuidv4(),
                payment.tenant_id,
                payment.contract_id,
                payment.payment_number,
                payment.amount,
                payment.due_date,
                payment.paid_date,
                payment.status,
                payment.payment_method,
                payment.reference_number,
                payment.notes,
              ]
            );
          }

          // Update contract remaining balance
          const totalPaid = paidMonths * monthlyAmount;
          const remainingBalance = contract.remaining_balance - totalPaid;
          
          await queryRunner.query(
            `UPDATE contracts 
             SET remaining_balance = ?
             WHERE id = ?`,
            [Math.max(0, remainingBalance), contract.id]
          );

          console.log(`✅ ${ownerName} - ${propertyCode}: Created ${totalPayments} payments (${paidMonths} paid, ${totalPayments - paidMonths} pending)`);
          processedCount++;

        } catch (error) {
          console.error(`❌ ${ownerName} - ${propertyCode}: Error -`, error.message);
          errorCount++;
        }
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`✅ Processed: ${processedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

importPayments()
  .then(() => {
    console.log('\n✅ Import completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
