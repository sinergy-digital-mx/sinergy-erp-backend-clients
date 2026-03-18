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
  // Excel serial date starts from December 30, 1899 (Excel epoch)
  const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
  const days = Math.floor(serial);
  
  const result = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
  
  // Log for debugging
  console.log(`📅 Excel serial ${serial} -> ${result.toLocaleDateString()}`);
  
  return result;
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

async function importPaymentsOriginalStructure() {
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
          // Find contract by property code with better logging
          console.log(`🔍 Looking for contract with property code: ${propertyCode}`);
          
          const contracts = await queryRunner.query(
            `SELECT c.*, p.code as property_code, p.name as property_name 
             FROM contracts c
             INNER JOIN properties p ON c.property_id = p.id
             WHERE p.code = ? AND c.tenant_id = ?`,
            [propertyCode, TENANT_ID]
          );

          if (contracts.length === 0) {
            // Try alternative matching - look for similar property codes
            console.log(`⚠️  ${ownerName} - ${propertyCode}: Exact match not found, trying fuzzy match...`);
            
            const fuzzyContracts = await queryRunner.query(
              `SELECT c.*, p.code as property_code, p.name as property_name 
               FROM contracts c
               INNER JOIN properties p ON c.property_id = p.id
               WHERE p.code LIKE ? AND c.tenant_id = ?
               LIMIT 5`,
              [`%${propertyCode.split('-').pop()}%`, TENANT_ID]
            );
            
            if (fuzzyContracts.length > 0) {
              console.log(`🔍 Found similar properties:`, fuzzyContracts.map(c => c.property_code));
            }
            
            console.log(`❌ ${ownerName} - ${propertyCode}: Contract not found`);
            errorCount++;
            continue;
          }

          if (contracts.length > 1) {
            console.log(`⚠️  ${ownerName} - ${propertyCode}: Multiple contracts found (${contracts.length}), using first one`);
          }

          const contract = contracts[0];
          console.log(`✅ Found contract: ${contract.property_code} (${contract.property_name})`);

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

          // Parse payment data first
          const totalPayments = parseInt(String(numeroPagosTotales));
          const paidMonths = parseInt(String(mesesPagados));
          const monthlyAmount = parseFloat(String(montoMensual));
          const startDate = excelDateToJSDate(fechaInicio);
          
          console.log(`📊 Payment details: ${totalPayments} total, ${paidMonths} paid, $${monthlyAmount}/month, start: ${startDate.toLocaleDateString()}`);

          // Update contract with interest fields (skip start_date - column doesn't exist)
          await queryRunner.query(
            `UPDATE contracts 
             SET payment_due_day = ?, 
                 interest_rate = ?,
                 currency = ?
             WHERE id = ?`,
            [diasLimite, interesMoratorio, row['Moneda'], contract.id]
          );

          // Generate all payments - CORRECT STRUCTURE
          const payments: any[] = [];
          for (let i = 0; i < totalPayments; i++) {
            // Calculate due date: start from contract date, advance by months, set to day 5
            const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 5);

            const isPaid = i < paidMonths;
            const status = isPaid ? 'pagado' : 'pendiente';

            payments.push({
              tenant_id: TENANT_ID,
              contract_id: contract.id,
              payment_number: `${i + 1}`,
              due_date: dueDate.toISOString().split('T')[0], // VENCIMIENTO - día 5 de cada mes
              amount: monthlyAmount, // MONTO - total mensual a pagar
              amount_paid: isPaid ? monthlyAmount : 0, // PAGADO - si ya se pagó o no
              amount_pending: isPaid ? 0 : monthlyAmount, // PENDIENTE
              payment_method: isPaid ? 'efectivo' : 'transferencia',
              status: status,
              notes: isPaid ? 'Pago histórico importado' : null,
              paid_date: isPaid ? dueDate.toISOString().split('T')[0] : null, // FECHA PAGO si ya se pagó
            });
          }

          console.log(`📅 First payment due date: ${payments[0]?.due_date}, Last payment due date: ${payments[payments.length - 1]?.due_date}`);

          // Insert payments with CORRECT structure
          for (const payment of payments) {
            await queryRunner.query(
              `INSERT INTO payments 
               (id, tenant_id, contract_id, payment_number, due_date, amount, amount_paid, amount_pending, paid_date, payment_method, status, notes, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                uuidv4(),
                payment.tenant_id,
                payment.contract_id,
                payment.payment_number,
                payment.due_date,
                payment.amount,
                payment.amount_paid,
                payment.amount_pending,
                payment.paid_date,
                payment.payment_method,
                payment.status,
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

importPaymentsOriginalStructure()
  .then(() => {
    console.log('\n✅ Import completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });