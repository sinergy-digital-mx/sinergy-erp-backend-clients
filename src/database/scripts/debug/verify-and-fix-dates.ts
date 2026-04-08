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
  'Fecha de Inicio': number; // Excel date serial
  'Numero de pagos totales': string | number;
  'Meses pagados': string | number;
}

function excelDateToJSDate(serial: number): Date {
  const excelEpoch = new Date(1899, 11, 30);
  const days = Math.floor(serial);
  return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
}

function normalizePropertyCode(lote: string | number, manzana: number): string[] {
  const loteStr = String(lote).trim();
  if (loteStr.includes('y')) {
    const lots = loteStr.split('y').map(l => l.trim());
    return lots.map(lot => `LOT-${manzana}-${lot.padStart(2, '0')}`);
  }
  return [`LOT-${manzana}-${loteStr.padStart(2, '0')}`];
}

async function verifyAndFixDates() {
  await AppDataSource.initialize();
  console.log('✅ Database connected\n');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // Read Excel file
    const workbook = XLSX.readFile('DATOS_PROPIETARIOS_DIVINO_con_pagos.xlsx');
    const sheet = workbook.Sheets['Hoja2'];
    const data: ExcelRow[] = XLSX.utils.sheet_to_json(sheet, { range: 1, defval: null });

    console.log('🔍 VERIFICANDO FECHAS DE CONTRATOS Y PAGOS\n');

    let checkedCount = 0;
    let fixedCount = 0;

    for (const row of data) {
      const ownerName = row['PROPIETARIOS ']?.trim();
      if (!ownerName) continue;

      // Skip fully paid
      if (row['Numero de pagos totales'] === 'TOTALMENTE PAGADO') continue;

      const propertyCodes = normalizePropertyCode(row['Lote '], row['Mnz']);
      const expectedStartDate = excelDateToJSDate(row['Fecha de Inicio']);
      const expectedDateStr = expectedStartDate.toISOString().split('T')[0];

      for (const propertyCode of propertyCodes) {
        try {
          // Get contract info
          const contracts = await queryRunner.query(
            `SELECT c.*, p.code as property_code, p.name as property_name 
             FROM contracts c
             INNER JOIN properties p ON c.property_id = p.id
             WHERE p.code = ? AND c.tenant_id = ?`,
            [propertyCode, TENANT_ID]
          );

          if (contracts.length === 0) continue;
          const contract = contracts[0];

          // Get first payment date
          const firstPayment = await queryRunner.query(
            `SELECT payment_date FROM contract_payments 
             WHERE contract_id = ? 
             ORDER BY payment_number ASC 
             LIMIT 1`,
            [contract.id]
          );

          if (firstPayment.length === 0) continue;

          const currentContractDate = contract.contract_date ? new Date(contract.contract_date).toISOString().split('T')[0] : 'NULL';
          const currentFirstPaymentDate = firstPayment[0].payment_date;

          console.log(`\n👤 ${ownerName}`);
          console.log(`🏠 ${propertyCode}`);
          console.log(`📅 Fecha Contrato Actual: ${currentContractDate}`);
          console.log(`📅 Fecha Contrato Esperada: ${expectedDateStr}`);
          console.log(`💰 Fecha Primer Pago Actual: ${currentFirstPaymentDate}`);
          console.log(`💰 Fecha Primer Pago Esperada: ${expectedDateStr}`);

          let needsUpdate = false;

          // Check if contract date needs update
          if (currentContractDate !== expectedDateStr) {
            console.log(`⚠️  Fecha de contrato incorrecta: ${currentContractDate} → ${expectedDateStr}`);
            needsUpdate = true;
          }

          // Check if first payment date needs update
          if (currentFirstPaymentDate !== expectedDateStr) {
            console.log(`⚠️  Fecha primer pago incorrecta: ${currentFirstPaymentDate} → ${expectedDateStr}`);
            needsUpdate = true;
          }

          if (needsUpdate) {
            console.log(`🔧 ACTUALIZANDO...`);

            // Update contract date
            await queryRunner.query(
              `UPDATE contracts SET contract_date = ? WHERE id = ?`,
              [expectedDateStr, contract.id]
            );

            // Update all payment dates (recalculate from start date)
            const totalPayments = parseInt(String(row['Numero de pagos totales']));
            const paidMonths = parseInt(String(row['Meses pagados']));

            for (let i = 0; i < totalPayments; i++) {
              const paymentDate = new Date(expectedStartDate.getFullYear(), expectedStartDate.getMonth() + i, expectedStartDate.getDate());
              const paymentDateStr = paymentDate.toISOString().split('T')[0];

              await queryRunner.query(
                `UPDATE contract_payments 
                 SET payment_date = ? 
                 WHERE contract_id = ? AND payment_number = ?`,
                [paymentDateStr, contract.id, `${i + 1}`]
              );
            }

            console.log(`✅ Actualizado: contrato y ${totalPayments} pagos`);
            fixedCount++;
          } else {
            console.log(`✅ Fechas correctas`);
          }

          checkedCount++;

        } catch (error) {
          console.error(`❌ Error con ${ownerName} - ${propertyCode}:`, error.message);
        }
      }
    }

    console.log('\n=== RESUMEN ===');
    console.log(`🔍 Contratos verificados: ${checkedCount}`);
    console.log(`🔧 Contratos corregidos: ${fixedCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

verifyAndFixDates()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });