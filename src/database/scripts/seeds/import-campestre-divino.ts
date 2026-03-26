import * as XLSX from 'xlsx';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';
import { v4 as uuidv4 } from 'uuid';

const TENANT_ID = '54481b63-5516-458d-9bb3-d4e5cb028864';
const GROUP_ID = '550e8400-e29b-41d4-a716-446655440100'; // Campestre Divino
const MEASUREMENT_UNIT_ID = '550e8400-e29b-41d4-a716-446655440001'; // m²

interface ExcelRow {
  index: number;
  nombre: string;
  lote: string;
  manzana: string;
  m2: number;
  precioM2: number;
  valorTotal: number;
  pais: string;
  telefono: string;
  email: string;
}

async function importCampestreDivino() {
  const dataSource = new DataSource(typeOrmOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // 1. LIMPIAR DATOS DE PRUEBA
    console.log('🧹 Cleaning test data...');
    await dataSource.query('DELETE FROM payments WHERE tenant_id = ?', [TENANT_ID]);
    console.log('  ✓ Payments deleted');
    
    await dataSource.query('DELETE FROM contracts WHERE tenant_id = ?', [TENANT_ID]);
    console.log('  ✓ Contracts deleted');
    
    await dataSource.query('DELETE FROM properties WHERE tenant_id = ?', [TENANT_ID]);
    console.log('  ✓ Properties deleted');
    
    await dataSource.query('DELETE FROM customers WHERE tenant_id = ?', [TENANT_ID]);
    console.log('  ✓ Customers deleted\n');

    // 2. LEER EXCEL
    console.log('📂 Reading Excel file...');
    const filePath = path.join(process.cwd(), 'DATOS_PROPIETARIOS_DIVINO.xlsx');
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // 3. PROCESAR DATOS
    console.log('📊 Processing data...\n');
    const rows: ExcelRow[] = [];
    
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row[1] || !row[2]) continue; // Skip empty rows

      rows.push({
        index: row[0],
        nombre: (row[1] as string).trim(),
        lote: String(row[2]).trim(),
        manzana: String(row[3]).trim(),
        m2: Number(row[4]),
        precioM2: Number(row[5]),
        valorTotal: Number(row[6]),
        pais: row[7] === 'MEX' ? 'Mexico' : 'USA',
        telefono: String(row[8]).trim(),
        email: row[10] ? String(row[10]).trim() : '',
      });
    }

    console.log(`📈 Found ${rows.length} records\n`);

    // 4. IMPORTAR CUSTOMERS Y PROPERTIES
    let customersCreated = 0;
    let propertiesCreated = 0;

    for (const row of rows) {
      try {
        // Parsear nombre (primer palabra = nombre, resto = apellido)
        const nameParts = row.nombre.split(' ').filter(p => p.length > 0);
        const firstName = nameParts[0] || 'Sin';
        const lastName = nameParts.slice(1).join(' ') || 'Nombre';

        // Phone code
        const phoneCode = row.pais === 'Mexico' ? '+52' : '+1';
        const phoneCountry = row.pais === 'Mexico' ? 'MX' : 'US';

        // Crear customer
        const customerResult = await dataSource.query(
          `INSERT INTO customers (tenant_id, name, lastname, email, phone, phone_country, phone_code, country, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [TENANT_ID, firstName, lastName, row.email || null, row.telefono, phoneCountry, phoneCode, row.pais]
        );
        const customerId = customerResult.insertId;
        customersCreated++;

        // Parsear lotes (puede ser "1", "5", "1y 2", etc.)
        const lotes = row.lote.toLowerCase().includes('y') 
          ? row.lote.split('y').map(l => l.trim())
          : [row.lote];

        // Crear property por cada lote
        for (const loteNum of lotes) {
          const propertyId = uuidv4();
          const code = `LOT-${row.manzana}-${loteNum.padStart(2, '0')}`;
          const name = `Lote ${loteNum} Manzana ${row.manzana}`;
          
          // Calcular área proporcional si tiene múltiples lotes
          const areaPropiedad = lotes.length > 1 ? row.m2 / lotes.length : row.m2;
          const precioPropiedad = lotes.length > 1 ? row.valorTotal / lotes.length : row.valorTotal;

          await dataSource.query(
            `INSERT INTO properties (id, tenant_id, group_id, code, block, name, total_area, measurement_unit_id, total_price, currency, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [propertyId, TENANT_ID, GROUP_ID, code, row.manzana, name, areaPropiedad, MEASUREMENT_UNIT_ID, precioPropiedad, 'USD', 'vendido']
          );
          propertiesCreated++;

          // Crear contrato relacionando customer con property
          const contractNumber = `CONT-${row.manzana}-${loteNum.padStart(2, '0')}`;
          const contractDate = new Date('2024-01-01'); // Fecha de ejemplo
          const firstPaymentDate = new Date('2024-02-01'); // Fecha de ejemplo
          
          await dataSource.query(
            `INSERT INTO contracts (id, tenant_id, customer_id, property_id, contract_number, contract_date, total_price, down_payment, remaining_balance, payment_months, monthly_payment, first_payment_date, currency, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              uuidv4(), 
              TENANT_ID, 
              customerId, 
              propertyId, 
              contractNumber,
              contractDate,
              precioPropiedad,
              0, // down_payment - será definido después
              precioPropiedad, // remaining_balance
              0, // payment_months - será definido después
              0, // monthly_payment - será definido después
              firstPaymentDate,
              'USD',
              'activo'
            ]
          );
        }

        console.log(`✓ ${firstName} ${lastName} - ${lotes.length} lote(s)`);

      } catch (error) {
        console.error(`❌ Error processing row ${row.index}:`, error.message);
      }
    }

    // 5. ACTUALIZAR ESTADÍSTICAS DEL GRUPO
    console.log('\n📊 Updating group statistics...');
    const stats = await dataSource.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'disponible' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'vendido' THEN 1 ELSE 0 END) as sold
       FROM properties WHERE tenant_id = ? AND group_id = ?`,
      [TENANT_ID, GROUP_ID]
    );

    await dataSource.query(
      `UPDATE property_groups 
       SET total_properties = ?, available_properties = ?, sold_properties = ?
       WHERE id = ? AND tenant_id = ?`,
      [stats[0].total, stats[0].available, stats[0].sold, GROUP_ID, TENANT_ID]
    );

    console.log('\n✅ Import completed successfully!');
    console.log(`   Customers created: ${customersCreated}`);
    console.log(`   Properties created: ${propertiesCreated}`);
    console.log(`   Contracts created: ${customersCreated}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

importCampestreDivino();
