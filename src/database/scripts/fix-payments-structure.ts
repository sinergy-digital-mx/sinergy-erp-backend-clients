import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

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

async function fixPaymentsStructure() {
  await AppDataSource.initialize();
  console.log('✅ Database connected\n');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    console.log('🔧 AGREGANDO CAMPOS FALTANTES A LA TABLA PAYMENTS...\n');

    // 1. Agregar campos faltantes (sin IF NOT EXISTS)
    const alterQueries = [
      `ALTER TABLE payments ADD COLUMN amount DECIMAL(15,2) DEFAULT 0`,
      `ALTER TABLE payments ADD COLUMN amount_pending DECIMAL(15,2) DEFAULT 0`,
      `ALTER TABLE payments ADD COLUMN due_date DATE NULL`,
      `ALTER TABLE payments ADD COLUMN paid_date DATE NULL`,
      `ALTER TABLE payments ADD COLUMN first_partial_payment_date DATE NULL`,
      `ALTER TABLE payments MODIFY COLUMN status ENUM('pagado', 'pendiente', 'parcial', 'atrasado', 'cancelado') DEFAULT 'pendiente'`
    ];

    for (const query of alterQueries) {
      try {
        await queryRunner.query(query);
        console.log(`✅ ${query.split(' ')[5] || 'Campo'} agregado/modificado`);
      } catch (error) {
        if (error.message.includes('Duplicate column')) {
          console.log(`ℹ️  Campo ${query.split(' ')[5]} ya existe`);
        } else {
          console.log(`⚠️  ${query}: ${error.message}`);
        }
      }
    }

    console.log('\n🔧 ACTUALIZANDO DATOS DE PAGOS...\n');

    // 2. Obtener todos los contratos con pagos
    const contracts = await queryRunner.query(`
      SELECT DISTINCT c.id, c.tenant_id, c.contract_date, c.payment_due_day
      FROM contracts c
      INNER JOIN payments p ON c.id = p.contract_id
      WHERE c.tenant_id = ?
    `, [TENANT_ID]);

    let updatedCount = 0;

    for (const contract of contracts) {
      console.log(`📋 Procesando contrato: ${contract.id}`);

      // Obtener pagos del contrato ordenados correctamente (por número como entero)
      const payments = await queryRunner.query(`
        SELECT * FROM payments 
        WHERE contract_id = ? 
        ORDER BY CAST(payment_number AS UNSIGNED) ASC
      `, [contract.id]);

      const contractStartDate = new Date(contract.contract_date);
      const dueDay = contract.payment_due_day || 5; // Default día 5

      for (let i = 0; i < payments.length; i++) {
        const payment = payments[i];
        
        // Calcular fecha de vencimiento: día 5 del mes correspondiente
        const dueDate = new Date(contractStartDate.getFullYear(), contractStartDate.getMonth() + i, dueDay);
        
        // Si el pago está marcado como pagado, usar payment_date como paid_date
        const paidDate = payment.status === 'pagado' ? payment.payment_date : null;
        
        // amount = amount_paid (para mantener compatibilidad)
        const amount = payment.amount_paid;
        const amountPending = payment.status === 'pagado' ? 0 : payment.amount_paid;

        await queryRunner.query(`
          UPDATE payments 
          SET 
            amount = ?,
            amount_pending = ?,
            due_date = ?,
            paid_date = ?
          WHERE id = ?
        `, [amount, amountPending, dueDate.toISOString().split('T')[0], paidDate, payment.id]);

        updatedCount++;
      }

      console.log(`✅ Actualizados ${payments.length} pagos del contrato`);
    }

    console.log('\n🔧 CREANDO ÍNDICES PARA MEJOR RENDIMIENTO...\n');

    // 3. Crear índices para ordenamiento correcto
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_payment_number_int ON payments ((CAST(payment_number AS UNSIGNED)))`,
      `CREATE INDEX IF NOT EXISTS idx_due_date ON payments (due_date)`,
      `CREATE INDEX IF NOT EXISTS idx_paid_date ON payments (paid_date)`
    ];

    for (const query of indexQueries) {
      try {
        await queryRunner.query(query);
        console.log(`✅ Índice creado`);
      } catch (error) {
        console.log(`⚠️  ${error.message}`);
      }
    }

    console.log('\n=== RESUMEN ===');
    console.log(`✅ Contratos procesados: ${contracts.length}`);
    console.log(`✅ Pagos actualizados: ${updatedCount}`);
    console.log(`✅ Campos agregados: amount, amount_pending, due_date, paid_date, first_partial_payment_date`);
    console.log(`✅ Estado 'parcial' agregado`);
    console.log(`✅ Índices creados para mejor ordenamiento`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

fixPaymentsStructure()
  .then(() => {
    console.log('\n✅ Estructura de pagos corregida exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });