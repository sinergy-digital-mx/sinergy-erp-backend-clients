import { AppDataSource } from '../data-source';

/**
 * Script para limpiar y reestructurar permisos
 * Asigna módulos a permisos existentes y crea estructura estándar
 */
async function cleanupAndRestructurePermissions() {
  try {
    // Inicializar DataSource
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔄 Iniciando limpieza y reestructuración de permisos...\n');

    // 1. Ver permisos sin módulo
    console.log('📋 Permisos sin módulo asignado:');
    const permissionsWithoutModule = await AppDataSource.query(`
      SELECT id, entity_type, action, description 
      FROM rbac_permissions 
      WHERE module_id IS NULL
      ORDER BY entity_type, action
    `);
    console.log(`Encontrados: ${permissionsWithoutModule.length} permisos sin módulo\n`);

    // 2. Asignar módulos a permisos existentes
    console.log('🔗 Asignando módulos a permisos existentes...');

    const modules = ['leads', 'customers', 'activities'];
    for (const moduleCode of modules) {
      const result = await AppDataSource.query(`
        UPDATE rbac_permissions 
        SET module_id = (SELECT id FROM modules WHERE code = ?)
        WHERE entity_type = ? AND module_id IS NULL
      `, [moduleCode, moduleCode]);
      console.log(`  ✅ ${moduleCode}: ${result.affectedRows} permisos actualizados`);
    }

    console.log('\n');

    // 3. Crear estructura estándar
    console.log('📐 Creando estructura estándar de permisos...\n');

    const standardPermissions = [
      { module: 'leads', actions: ['Read', 'Create', 'Edit', 'Delete', 'Download', 'Export'] },
      { module: 'customers', actions: ['Read', 'Create', 'Edit', 'Delete', 'Download', 'Export'] },
      { module: 'activities', actions: ['Read', 'Create', 'Edit', 'Delete'] },
    ];

    for (const moduleConfig of standardPermissions) {
      console.log(`  📦 Módulo: ${moduleConfig.module}`);
      
      for (const action of moduleConfig.actions) {
        const exists = await AppDataSource.query(`
          SELECT id FROM rbac_permissions 
          WHERE module_id = (SELECT id FROM modules WHERE code = ?)
          AND action = ?
        `, [moduleConfig.module, action]);

        if (exists.length === 0) {
          const description = `${action} ${moduleConfig.module}`;
          await AppDataSource.query(`
            INSERT INTO rbac_permissions (id, module_id, entity_type, action, description, is_system_permission, created_at, updated_at)
            SELECT UUID(), m.id, ?, ?, ?, true, NOW(), NOW()
            FROM modules m
            WHERE m.code = ?
          `, [moduleConfig.module, action, description, moduleConfig.module]);
          console.log(`    ✅ ${action}`);
        } else {
          console.log(`    ⏭️  ${action} (ya existe)`);
        }
      }
      console.log('');
    }

    // 4. Ver estructura final
    console.log('📊 Estructura final de permisos:\n');
    const finalStructure = await AppDataSource.query(`
      SELECT 
        m.name as module,
        p.action,
        p.description,
        COUNT(*) as count
      FROM rbac_permissions p
      LEFT JOIN modules m ON p.module_id = m.id
      WHERE m.id IS NOT NULL
      GROUP BY m.id, m.name, p.action, p.description
      ORDER BY m.name, p.action
    `);

    let currentModule = '';
    for (const row of finalStructure) {
      if (row.module !== currentModule) {
        if (currentModule !== '') console.log('');
        console.log(`📦 ${row.module}`);
        currentModule = row.module;
      }
      console.log(`  ✅ ${row.action.padEnd(10)} - ${row.description}`);
    }

    console.log('\n');

    // 5. Estadísticas finales
    console.log('📈 Estadísticas finales:\n');
    const stats = await AppDataSource.query(`
      SELECT 
        COUNT(DISTINCT m.id) as total_modules,
        COUNT(DISTINCT p.id) as total_permissions,
        COUNT(DISTINCT CASE WHEN p.module_id IS NOT NULL THEN p.id END) as permissions_with_module,
        COUNT(DISTINCT CASE WHEN p.module_id IS NULL THEN p.id END) as permissions_without_module
      FROM modules m
      LEFT JOIN rbac_permissions p ON m.id = p.module_id
    `);

    const stat = stats[0];
    console.log(`  📦 Módulos totales: ${stat.total_modules}`);
    console.log(`  🔐 Permisos totales: ${stat.total_permissions}`);
    console.log(`  ✅ Permisos con módulo: ${stat.permissions_with_module}`);
    console.log(`  ❌ Permisos sin módulo: ${stat.permissions_without_module}`);

    console.log('\n✨ ¡Limpieza y reestructuración completada!\n');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Ejecutar script
cleanupAndRestructurePermissions().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
