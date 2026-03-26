import { AppDataSource } from '../data-source';

async function addUoMModule() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🌱 Adding UoM Module Permissions...\n');

    // Get or create the UoM module
    const moduleResult = await AppDataSource.query(
      `SELECT id FROM rbac_modules WHERE name = 'UoM'`
    );

    let moduleId: string;

    if (moduleResult.length === 0) {
      // Create the module
      moduleId = require('uuid').v4();
      await AppDataSource.query(
        `INSERT INTO rbac_modules (id, name, description, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [moduleId, 'UoM', 'Units of Measure Management']
      );
      console.log('✅ Created UoM module');
    } else {
      moduleId = moduleResult[0].id;
      console.log('✅ UoM module already exists');
    }

    // Define actions and entities
    const actions = ['Create', 'Read', 'Update', 'Delete'];
    const entities = ['UoM', 'UoMRelationship'];

    let permissionsCreated = 0;

    // Create permissions for each action and entity
    for (const action of actions) {
      for (const entity of entities) {
        const permissionName = `${entity}:${action}`;

        // Check if permission already exists
        const existingPermission = await AppDataSource.query(
          `SELECT id FROM rbac_permissions 
           WHERE module_id = ? AND action = ? AND entity_type = ?`,
          [moduleId, action, entity]
        );

        if (existingPermission.length === 0) {
          const permissionId = require('uuid').v4();
          await AppDataSource.query(
            `INSERT INTO rbac_permissions (id, module_id, entity_type, action, description, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              permissionId,
              moduleId,
              entity,
              action,
              `${action} ${entity}`,
            ]
          );
          permissionsCreated++;
          console.log(`✅ Created permission: ${permissionName}`);
        } else {
          console.log(`⏭️  Permission already exists: ${permissionName}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ UoM Module setup completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   - Module: UoM`);
    console.log(`   - Entities: ${entities.join(', ')}`);
    console.log(`   - Actions: ${actions.join(', ')}`);
    console.log(`   - Permissions created: ${permissionsCreated}`);
    console.log(`   - Total permissions: ${actions.length * entities.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

addUoMModule()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
