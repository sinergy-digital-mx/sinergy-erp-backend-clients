import { AppDataSource } from '../data-source';
import { v4 as uuidv4 } from 'uuid';

/**
 * Script para agregar el permiso Ver_Menu a todos los módulos existentes
 * Este permiso controla la visibilidad del sidebar para cada módulo
 */
async function addVerMenuPermission() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🔧 Agregando permiso Ver_Menu a todos los módulos...\n');

    // Paso 1: Asegurar que todos los módulos tengan entradas en entity_registry
    console.log('📋 Verificando entradas en entity_registry...');
    
    const modulesWithoutRegistry = await AppDataSource.query(
      `SELECT m.id, m.code, m.name
       FROM modules m
       WHERE NOT EXISTS (
         SELECT 1 FROM entity_registry er WHERE er.code = m.code
       )`
    );

    if (modulesWithoutRegistry.length > 0) {
      console.log(`⚠️  Se encontraron ${modulesWithoutRegistry.length} módulo(s) sin entradas en entity_registry`);
      
      for (const module of modulesWithoutRegistry) {
        const result = await AppDataSource.query(
          `INSERT INTO entity_registry (code, name) VALUES (?, ?)`,
          [module.code, `${module.name} Management`]
        );
        console.log(`  ✅ Entity registry creado para: ${module.name} (ID: ${result.insertId})`);
      }
    } else {
      console.log('✅ Todos los módulos tienen entradas en entity_registry\n');
    }

    // Paso 2: Obtener todos los módulos con sus entity_registry_id
    const modules = await AppDataSource.query(
      `SELECT m.id, m.name, m.code, er.id as entity_registry_id
       FROM modules m
       INNER JOIN entity_registry er ON er.code = m.code`
    );

    console.log(`📋 Se encontraron ${modules.length} módulo(s) con entity_registry\n`);

    if (modules.length === 0) {
      console.log('⚠️  No se encontraron módulos. Por favor ejecute el seeding de módulos primero.');
      return;
    }

    // Paso 3: Agregar permiso Ver_Menu para cada módulo
    console.log('📝 Creando permisos Ver_Menu...');
    let permissionsCreated = 0;

    for (const module of modules) {
      // Verificar si el permiso Ver_Menu ya existe
      const existing = await AppDataSource.query(
        `SELECT id FROM rbac_permissions 
         WHERE module_id = ? AND action = 'Ver_Menu'`,
        [module.id]
      );

      if (existing.length) {
        console.log(`  ⏭️  El permiso Ver_Menu ya existe para el módulo: ${module.name}`);
        continue;
      }

      if (!module.entity_registry_id) {
        console.log(`  ❌ ERROR: No hay entity_registry_id para el módulo: ${module.name} (${module.code})`);
        console.log(`     Esto no debería ocurrir después del Paso 1. Omitiendo...`);
        continue;
      }

      // Crear permiso Ver_Menu
      await AppDataSource.query(
        `INSERT INTO rbac_permissions (id, module_id, entity_registry_id, action, description, is_system_permission, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          uuidv4(),
          module.id,
          module.entity_registry_id,
          'Ver_Menu',
          `Ver menú de ${module.name} en el sidebar`,
          true
        ]
      );

      console.log(`  ✅ Permiso Ver_Menu agregado para el módulo: ${module.name}`);
      permissionsCreated++;
    }

    console.log(`\n✅ Se crearon ${permissionsCreated} nuevo(s) permiso(s) Ver_Menu`);

    // Paso 4: Asignar permisos Ver_Menu a todos los roles Admin
    console.log('\n🔑 Asignando permisos Ver_Menu a roles Admin...');
    
    const adminRoles = await AppDataSource.query(
      `SELECT r.id, r.name, t.name as tenant_name
       FROM rbac_roles r
       JOIN rbac_tenants t ON r.tenant_id = t.id
       WHERE r.is_admin = true`
    );

    console.log(`📋 Se encontraron ${adminRoles.length} rol(es) Admin\n`);

    let assignmentsCreated = 0;

    for (const role of adminRoles) {
      // Obtener todos los permisos Ver_Menu
      const verMenuPermissions = await AppDataSource.query(
        `SELECT id FROM rbac_permissions WHERE action = 'Ver_Menu'`
      );

      for (const permission of verMenuPermissions) {
        // Verificar si ya está asignado
        const existing = await AppDataSource.query(
          `SELECT id FROM rbac_role_permissions 
           WHERE role_id = ? AND permission_id = ?`,
          [role.id, permission.id]
        );

        if (!existing.length) {
          await AppDataSource.query(
            `INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
             VALUES (?, ?, ?, NOW())`,
            [uuidv4(), role.id, permission.id]
          );
          assignmentsCreated++;
        }
      }

      console.log(`  ✅ Permisos Ver_Menu asignados al rol Admin: ${role.name} (${role.tenant_name})`);
    }

    console.log(`\n✅ Se crearon ${assignmentsCreated} nueva(s) asignación(es) de permisos`);

    // Paso 5: Verificación
    console.log('\n📊 Reporte de Verificación:');
    console.log('═'.repeat(60));

    const verificationResults = await AppDataSource.query(
      `SELECT 
        m.name as module_name,
        m.code as module_code,
        p.action,
        p.description,
        COUNT(DISTINCT rp.role_id) as roles_with_permission
       FROM modules m
       LEFT JOIN rbac_permissions p ON p.module_id = m.id AND p.action = 'Ver_Menu'
       LEFT JOIN rbac_role_permissions rp ON rp.permission_id = p.id
       GROUP BY m.id, m.name, m.code, p.action, p.description
       ORDER BY m.name`
    );

    console.log('\nPermisos Ver_Menu por Módulo:');
    verificationResults.forEach((result: any) => {
      console.log(`  • ${result.module_name} (${result.module_code})`);
      console.log(`    - Roles con permiso: ${result.roles_with_permission || 0}`);
    });

    console.log('\n✅ ¡Configuración del permiso Ver_Menu completada exitosamente!');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Actualizar el frontend para verificar el permiso Ver_Menu antes de mostrar items del sidebar');
    console.log('   2. Asignar permisos Ver_Menu a roles no-admin según sea necesario');
    console.log('   3. Probar la visibilidad del sidebar con diferentes roles de usuario');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

addVerMenuPermission()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
