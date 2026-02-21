import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function fixCustomerActivitiesPermissions() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Get Customer Activities module
    const customerActivitiesModule = await dataSource.query(`
      SELECT id FROM modules WHERE code = 'customer_activities'
    `);

    if (customerActivitiesModule.length === 0) {
      console.log('❌ Customer Activities module not found');
      return;
    }

    const moduleId = customerActivitiesModule[0].id;
    console.log(`\n🔍 Found Customer Activities module: ${moduleId}`);

    // Get current permissions for this module
    console.log('\n📋 Current permissions:');
    const currentPermissions = await dataSource.query(`
      SELECT id, action, description FROM rbac_permissions 
      WHERE module_id = ?
      ORDER BY action
    `, [moduleId]);

    currentPermissions.forEach((p: any) => {
      console.log(`   • ${p.action}: ${p.description}`);
    });

    // Translation map for Customer Activities
    const actionTranslations = {
      'Activity:Create': 'Crear',
      'Activity:Read': 'Leer',
      'Activity:Update': 'Actualizar',
      'Activity:Delete': 'Eliminar',
    };

    const descriptionTranslations = {
      'Create customer activities': 'Crear actividades de cliente',
      'Read customer activities': 'Leer actividades de cliente',
      'Update customer activities': 'Actualizar actividades de cliente',
      'Delete customer activities': 'Eliminar actividades de cliente',
    };

    console.log('\n🔄 Updating permissions...');

    for (const [oldAction, newAction] of Object.entries(actionTranslations)) {
      const result = await dataSource.query(`
        UPDATE rbac_permissions SET action = ? WHERE module_id = ? AND action = ?
      `, [newAction, moduleId, oldAction]);

      if (result.affectedRows > 0) {
        console.log(`   ✅ "${oldAction}" → "${newAction}"`);
      }
    }

    for (const [oldDesc, newDesc] of Object.entries(descriptionTranslations)) {
      const result = await dataSource.query(`
        UPDATE rbac_permissions SET description = ? WHERE module_id = ? AND description = ?
      `, [newDesc, moduleId, oldDesc]);

      if (result.affectedRows > 0) {
        console.log(`   ✅ "${oldDesc}" → "${newDesc}"`);
      }
    }

    // Show final result
    console.log('\n📋 Final permissions:');
    const finalPermissions = await dataSource.query(`
      SELECT id, action, description FROM rbac_permissions 
      WHERE module_id = ?
      ORDER BY action
    `, [moduleId]);

    finalPermissions.forEach((p: any) => {
      console.log(`   • ${p.action}: ${p.description}`);
    });

    console.log('\n✅ Customer Activities permissions updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

fixCustomerActivitiesPermissions();