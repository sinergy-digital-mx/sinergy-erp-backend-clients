require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('xlsx');
const path = require('path');

async function fixContractsFromExcel() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    console.log('\n🔄 Leyendo Excel...\n');

    // Read Excel file - HOJA 2
    const workbook = XLSX.readFile('DATOS_PROPIETARIOS_DIVINO_con_pagos.xlsx');
    const sheetName = workbook.SheetNames[1]; // Hoja 2
    const worksheet = workbook.Sheets[sheetName];
    
    // Get the range
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(`📊 Rango del Excel: ${worksheet['!ref']}`);
    
    // Read all data as array of arrays to see structure
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('\n📋 Primeras 5 filas del Excel:');
    rawData.slice(0, 5).forEach((row, idx) => {
      console.log(`Fila ${idx + 1}:`, row);
    });
    
    // Find header row (look for "PROPIETARIOS")
    let headerRowIndex = -1;
    for (let i = 0; i < rawData.length; i++) {
      if (rawData[i].some(cell => cell && cell.toString().includes('PROPIETARIOS'))) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      console.error('❌ No se encontró la fila de encabezados');
      return;
    }
    
    console.log(`\n✅ Encabezados encontrados en fila ${headerRowIndex + 1}`);
    console.log('Columnas:', rawData[headerRowIndex]);
    
    // Read data starting from header row
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      range: headerRowIndex,
      defval: '' 
    });

    console.log(`📦 ${data.length} registros encontrados en Excel\n`);

    // Debug: show first row to see column names
    if (data.length > 0) {
      console.log('📋 Columnas del Excel:', Object.keys(data[0]));
      console.log('📋 Primera fila:', data[0]);
      console.log('\n');
    }

    let matchedCount = 0;
    let updatedCount = 0;

    for (const row of data) {
      const nombre = row['PROPIETARIOS']?.toString().trim() || row['PROPIETARIOS ']?.toString().trim();
      const lote = row['Lote']?.toString().trim() || row['Lote ']?.toString().trim();
      const manzana = row['Mnz']?.toString().trim();
      const fechaInicio = row['Fecha de Inicio'];
      const mesesPagados = parseInt(row['Meses pagados']) || 0;
      const diasLimite = parseInt(row['Dias limite de pago']) || 5;
      const totalmentePagado = row['Numero de pagos totales']?.toString().includes('TOTALMENTE') || 
                               row['Meses pagados']?.toString().includes('TOTALMENTE');

      console.log(`\n📄 Procesando: ${nombre} - Lote ${lote} Mz ${manzana}`);

      if (!nombre || !lote || !manzana) {
        console.log('   ⚠️  Datos incompletos, saltando...');
        continue;
      }

      // Parse date from Excel
      let contractDate = null;
      if (fechaInicio) {
        if (typeof fechaInicio === 'number') {
          // Excel date serial number
          const excelEpoch = new Date(1899, 11, 30);
          contractDate = new Date(excelEpoch.getTime() + fechaInicio * 86400000);
        } else if (typeof fechaInicio === 'string') {
          contractDate = new Date(fechaInicio);
        }
      }

      if (!contractDate || isNaN(contractDate.getTime())) {
        console.log(`⚠️  Fecha inválida para ${nombre} - Lote ${lote} Mz ${manzana}`);
        continue;
      }

      const formattedDate = contractDate.toISOString().split('T')[0];

      // Find matching contract by property code
      // Find matching contract by customer name + property (lote/manzana)
      // Handle cases like "1y2" -> need to match both lots
      const loteParts = lote.includes('y') ? lote.split('y').map(l => l.trim()) : [lote];
      
      for (const lotePart of loteParts) {
        console.log(`🔍 Buscando: ${nombre} - Lote ${lotePart} Mz ${manzana}`);

        // Search by customer name (first name or last name) AND property code
        const [contracts] = await connection.query(`
          SELECT c.id, c.contract_number, c.contract_date, c.payment_months, c.monthly_payment, 
                 p.code as property_code, p.block, p.name as property_name,
                 cu.name as customer_name, cu.lastname as customer_lastname
          FROM contracts c
          JOIN properties p ON p.id = c.property_id
          JOIN customers cu ON cu.id = c.customer_id
          WHERE p.block = ? 
          AND (p.code LIKE ? OR p.name LIKE ?)
          AND (cu.name LIKE ? OR cu.lastname LIKE ? OR CONCAT(cu.name, ' ', cu.lastname) LIKE ?)
        `, [
          manzana,
          `%${lotePart}%`,
          `%${lotePart}%`,
          `%${nombre.split(' ')[0]}%`,
          `%${nombre.split(' ').pop()}%`,
          `%${nombre}%`
        ]);

        console.log(`   Encontrados: ${contracts.length} contratos`);
        
        if (contracts.length > 0) {
          contracts.forEach(c => {
            console.log(`   - ${c.contract_number}: ${c.customer_name} ${c.customer_lastname} - ${c.property_code}`);
          });
        }

        if (contracts.length > 0) {
          const contract = contracts[0];
          matchedCount++;

          console.log(`✅ Match: ${nombre} - Lote ${lotePart} Mz ${manzana}`);
          console.log(`   Contract: ${contract.contract_number}`);
          console.log(`   Property: ${contract.property_code}`);
          console.log(`   Old date: ${contract.contract_date}`);
          console.log(`   New date: ${formattedDate}`);
          console.log(`   Meses pagados: ${mesesPagados}`);
          console.log(`   Totalmente pagado: ${totalmentePagado ? 'SÍ' : 'NO'}`);

          // Update contract date and payment_due_day
          const contractFirstPaymentDate = new Date(contractDate);
          contractFirstPaymentDate.setMonth(contractFirstPaymentDate.getMonth() + 1);
          contractFirstPaymentDate.setDate(diasLimite);
          const firstPaymentDateStr = contractFirstPaymentDate.toISOString().split('T')[0];
          
          await connection.query(
            'UPDATE contracts SET contract_date = ?, payment_due_day = ?, first_payment_date = ? WHERE id = ?',
            [formattedDate, diasLimite, firstPaymentDateStr, contract.id]
          );

          // Delete existing payments
          await connection.query(
            'DELETE FROM payments WHERE contract_id = ?',
            [contract.id]
          );

          // If TOTALMENTE PAGADO, mark as completed and don't generate payments
          if (totalmentePagado) {
            await connection.query(
              'UPDATE contracts SET status = ?, remaining_balance = 0 WHERE id = ?',
              ['completado', contract.id]
            );
            console.log(`   ✅ Marcado como COMPLETADO (sin pagos)\n`);
            updatedCount++;
            continue;
          }

          // Generate payments with correct dates
          const paymentMonths = contract.payment_months;
          const monthlyPayment = Number(contract.monthly_payment);
          const firstPaymentDate = new Date(contractDate);
          firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
          firstPaymentDate.setDate(diasLimite); // Set to payment due day (e.g., 5th)

          const tenantId = (await connection.query('SELECT tenant_id FROM contracts WHERE id = ?', [contract.id]))[0][0].tenant_id;

          for (let i = 1; i <= paymentMonths; i++) {
            const dueDate = new Date(firstPaymentDate);
            dueDate.setMonth(dueDate.getMonth() + (i - 1));
            const dueDateStr = dueDate.toISOString().split('T')[0];

            // Determine status based on mesesPagados
            let status = 'pendiente';
            let amountPaid = 0;
            let paidDate = null;

            if (i <= mesesPagados) {
              status = 'pagado';
              amountPaid = monthlyPayment;
              paidDate = dueDateStr;
            } else {
              // Check if overdue
              const today = new Date();
              if (dueDate < today) {
                status = 'vencido';
              }
            }

            await connection.query(`
              INSERT INTO payments (
                id, tenant_id, contract_id, payment_number, amount, amount_paid, 
                amount_pending, due_date, paid_date, status, created_at, updated_at
              ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
              tenantId,
              contract.id,
              i,
              monthlyPayment,
              amountPaid,
              monthlyPayment - amountPaid,
              dueDateStr,
              paidDate,
              status
            ]);
          }

          // Recalculate contract balance
          const totalPaid = mesesPagados * monthlyPayment;
          const totalPrice = Number((await connection.query('SELECT total_price, down_payment FROM contracts WHERE id = ?', [contract.id]))[0][0].total_price);
          const downPayment = Number((await connection.query('SELECT total_price, down_payment FROM contracts WHERE id = ?', [contract.id]))[0][0].down_payment);
          const remainingBalance = totalPrice - downPayment - totalPaid;

          await connection.query(
            'UPDATE contracts SET remaining_balance = ? WHERE id = ?',
            [Math.max(0, remainingBalance), contract.id]
          );

          console.log(`   ✅ ${paymentMonths} pagos generados (${mesesPagados} pagados, ${paymentMonths - mesesPagados} pendientes)\n`);
          updatedCount++;
        }
      }
    }

    console.log(`\n✅ Proceso completado:`);
    console.log(`   Matched: ${matchedCount} contratos`);
    console.log(`   Updated: ${updatedCount} contratos`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await connection.end();
  }
}

fixContractsFromExcel();
