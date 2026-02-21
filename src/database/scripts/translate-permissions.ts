import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';

async function translatePermissions() {
  const dataSource = new DataSource(typeOrmOptions);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Translation map
    const translations = {
      'Create': 'Crear',
      'Read': 'Leer',
      'Update': 'Actualizar',
      'Edit': 'Editar',
      'Delete': 'Eliminar',
    };

    // Get all permissions
    console.log('\n🔍 Getting all permissions...');
    const permissions = await dataSource.query(`
      SELECT p.*, er.code as entity_code, m.code as module_code
      FROM rbac_permissions p
      LEFT JOIN entity_registry er ON p.entity_registry_id = er.id
      LEFT JOIN modules m ON p.module_id = m.id
      ORDER BY m.code, er.code, p.action
    `);

    console.log(`📊 Found ${permissions.length} permissions`);

    // Find permissions from "Activities" module that should be deleted
    const activitiesModule = await dataSource.query(`
      SELECT id FROM modules WHERE code = 'activities'
    `);

    if (activitiesModule.length > 0) {
      const activitiesModuleId = activitiesModule[0].id;
      
      console.log('\n🗑️  Deleting permissions from "Activities" module...');
      
      // Delete role-permission associations first
      await dataSource.query(`
        DELETE rp FROM rbac_role_permissions rp
        JOIN rbac_permissions p ON rp.permission_id = p.id
        WHERE p.module_id = ?
      `, [activitiesModuleId]);

      // Delete permissions
      const deleteResult = await dataSource.query(`
        DELETE FROM rbac_permissions WHERE module_id = ?
      `, [activitiesModuleId]);

      console.log(`✅ Deleted permissions from Activities module`);
    }

    // Translate descriptions
    console.log('\n🌐 Translating permission descriptions...');
    
    const translationMap = {
      'Create new activities': 'Crear nuevas actividades',
      'Create customer activities': 'Crear actividades de cliente',
      'Create leads': 'Crear leads',
      'Create customers': 'Crear clientes',
      'Create transactions': 'Crear transacciones',
      'Create payments': 'Crear pagos',
      'Delete activities': 'Eliminar actividades',
      'Delete customer activities': 'Eliminar actividades de cliente',
      'Delete leads': 'Eliminar leads',
      'Delete customers': 'Eliminar clientes',
      'Delete transactions': 'Eliminar transacciones',
      'Delete payments': 'Eliminar pagos',
      'Edit activities': 'Editar actividades',
      'Edit leads': 'Editar leads',
      'Edit customers': 'Editar clientes',
      'Edit transactions': 'Editar transacciones',
      'Edit payments': 'Editar pagos',
      'Read customer activities': 'Leer actividades de cliente',
      'Read activities': 'Leer actividades',
      'Read leads': 'Leer leads',
      'Read customers': 'Leer clientes',
      'Read transactions': 'Leer transacciones',
      'Read payments': 'Leer pagos',
      'Update activities': 'Actualizar actividades',
      'Update customer activities': 'Actualizar actividades de cliente',
      'Update leads': 'Actualizar leads',
      'Update customers': 'Actualizar clientes',
      'Update transactions': 'Actualizar transacciones',
      'Update payments': 'Actualizar pagos',
      'View activities': 'Ver actividades',
      'View customer activities': 'Ver actividades de cliente',
      'View leads': 'Ver leads',
      'View customers': 'Ver clientes',
      'View transactions': 'Ver transacciones',
      'View payments': 'Ver pagos',
    };

    let updatedCount = 0;

    for (const [english, spanish] of Object.entries(translationMap)) {
      const result = await dataSource.query(`
        UPDATE rbac_permissions SET description = ? WHERE description = ?
      `, [spanish, english]);

      if (result.affectedRows > 0) {
        updatedCount += result.affectedRows;
        console.log(`   ✅ "${english}" → "${spanish}"`);
      }
    }

    console.log(`\n📊 Updated ${updatedCount} permission descriptions`);

    // Translate actions
    console.log('\n🔄 Translating action names...');
    
    let actionUpdatedCount = 0;

    for (const [english, spanish] of Object.entries(translations)) {
      const result = await dataSource.query(`
        UPDATE rbac_permissions SET action = ? WHERE action = ?
      `, [spanish, english]);

      if (result.affectedRows > 0) {
        actionUpdatedCount += result.affectedRows;
        console.log(`   ✅ "${english}" → "${spanish}" (${result.affectedRows} permissions)`);
      }
    }

    console.log(`\n📊 Updated ${actionUpdatedCount} action names`);

    // Show final result
    console.log('\n📋 Final permissions:');
    const finalPermissions = await dataSource.query(`
      SELECT p.*, er.code as entity_code, m.code as module_code, m.name as module_name
      FROM rbac_permissions p
      LEFT JOIN entity_registry er ON p.entity_registry_id = er.id
      LEFT JOIN modules m ON p.module_id = m.id
      ORDER BY m.code, er.code, p.action
    `);

    console.log(`✅ Total permissions: ${finalPermissions.length}`);
    
    // Group by module
    const byModule = {};
    finalPermissions.forEach(p => {
      if (!byModule[p.module_name]) {
        byModule[p.module_name] = [];
      }
      byModule[p.module_name].push(`${p.entity_code}:${p.action}`);
    });

    Object.entries(byModule).forEach(([module, perms]: [string, any]) => {
      console.log(`\n📦 ${module}: ${perms.length} permisos`);
      perms.forEach((p: string) => console.log(`   • ${p}`));
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

translatePermissions();