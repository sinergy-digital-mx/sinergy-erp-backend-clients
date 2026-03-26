import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';
import { v4 as uuidv4 } from 'uuid';

async function seedCustomer2Data() {
  const dataSource = new DataSource(typeOrmOptions as any);
  await dataSource.initialize();

  try {
    const queryRunner = dataSource.createQueryRunner();

    // Get customer 2 tenant_id
    const customer = await queryRunner.query(
      'SELECT tenant_id FROM customers WHERE id = 2'
    );

    if (!customer || customer.length === 0) {
      console.log('Customer 2 not found');
      return;
    }

    const tenantId = customer[0].tenant_id;

    // Insert 3 activities with UUIDs
    const activities = [
      ['call', 'Llamada de seguimiento', 'Cliente interesado en productos', 'Muy interesado en la propuesta'],
      ['email', 'Email enviado', 'Propuesta comercial', 'Enviado con cotización'],
      ['meeting', 'Reunión presencial', 'Presentación de servicios', 'Cliente confirmó interés'],
    ];

    for (const [type, title, description, notes] of activities) {
      const id = uuidv4();
      await queryRunner.query(
        `INSERT INTO customer_activities (id, customer_id, tenant_id, type, status, title, description, activity_date, notes, created_at, updated_at)
         VALUES (?, 2, ?, ?, 'completed', ?, ?, NOW(), ?, NOW(), NOW())`,
        [id, tenantId, type, title, description, notes]
      );
    }
    console.log('✓ 3 Activities created');

    console.log('\n✓ Seed completed successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await dataSource.destroy();
  }
}

seedCustomer2Data();
