"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const permission_entity_1 = require("../../../entities/rbac/permission.entity");
const role_entity_1 = require("../../../entities/rbac/role.entity");
const role_permission_entity_1 = require("../../../entities/rbac/role-permission.entity");
const typeorm_options_1 = require("../../../database/typeorm.options");
async function addLeadActivityPermissions() {
    console.log('🚀 Starting Lead:Activity permissions setup...');
    const dataSource = new typeorm_1.DataSource(typeorm_options_1.typeOrmOptions);
    await dataSource.initialize();
    console.log('✅ Database connection established');
    try {
        const permissionRepo = dataSource.getRepository(permission_entity_1.Permission);
        const roleRepo = dataSource.getRepository(role_entity_1.Role);
        const rolePermissionRepo = dataSource.getRepository(role_permission_entity_1.RolePermission);
        const leadActivityPermissions = [
            { entityType: 'Lead:Activity', action: 'Create', description: 'Create lead activities' },
            { entityType: 'Lead:Activity', action: 'Read', description: 'Read lead activities' },
            { entityType: 'Lead:Activity', action: 'Update', description: 'Update lead activities' },
            { entityType: 'Lead:Activity', action: 'Delete', description: 'Delete lead activities' },
            { entityType: 'Lead:Activity', action: 'Export', description: 'Export lead activities' },
            { entityType: 'Lead:Activity', action: 'View_All', description: 'View all lead activities across the tenant' },
        ];
        console.log('📋 Creating Lead:Activity permissions...');
        const createdPermissions = [];
        for (const permData of leadActivityPermissions) {
            let permission = await permissionRepo.findOne({
                where: { entity_type: permData.entityType, action: permData.action }
            });
            if (!permission) {
                permission = permissionRepo.create({
                    entity_type: permData.entityType,
                    action: permData.action,
                    description: permData.description,
                    is_system_permission: false,
                });
                await permissionRepo.save(permission);
                console.log(`   ✅ Created permission: ${permData.entityType}:${permData.action}`);
            }
            else {
                console.log(`   ⏭️  Permission already exists: ${permData.entityType}:${permData.action}`);
            }
            createdPermissions.push(permission);
        }
        const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';
        const rolePermissionMappings = [
            {
                roleName: 'Sales Representative',
                permissions: ['Create', 'Read', 'Update', 'Delete']
            },
            {
                roleName: 'Sales Manager',
                permissions: ['Create', 'Read', 'Update', 'Delete', 'Export', 'View_All']
            },
            {
                roleName: 'Customer Support',
                permissions: ['Create', 'Read', 'Update']
            }
        ];
        console.log('👥 Assigning permissions to roles...');
        for (const mapping of rolePermissionMappings) {
            const role = await roleRepo.findOne({
                where: { name: mapping.roleName, tenant_id: tenantId }
            });
            if (!role) {
                console.log(`   ⚠️  Role not found: ${mapping.roleName}`);
                continue;
            }
            for (const action of mapping.permissions) {
                const permission = createdPermissions.find(p => p.action === action);
                if (!permission)
                    continue;
                const existingRolePermission = await rolePermissionRepo.findOne({
                    where: { role_id: role.id, permission_id: permission.id }
                });
                if (!existingRolePermission) {
                    const rolePermission = rolePermissionRepo.create({
                        role_id: role.id,
                        permission_id: permission.id,
                    });
                    await rolePermissionRepo.save(rolePermission);
                    console.log(`   ✅ Assigned ${permission.entity_type}:${permission.action} to ${role.name}`);
                }
                else {
                    console.log(`   ⏭️  Permission already assigned: ${permission.entity_type}:${permission.action} to ${role.name}`);
                }
            }
        }
        console.log('\n📊 Verification:');
        const allLeadActivityPermissions = await permissionRepo.find({
            where: { entity_type: 'Lead:Activity' }
        });
        console.log(`   📋 Total Lead:Activity permissions: ${allLeadActivityPermissions.length}`);
        for (const permission of allLeadActivityPermissions) {
            console.log(`      - ${permission.entity_type}:${permission.action}`);
        }
        const salesRepRole = await roleRepo.findOne({
            where: { name: 'Sales Representative', tenant_id: tenantId },
            relations: ['role_permissions', 'role_permissions.permission']
        });
        if (salesRepRole) {
            const leadActivityPerms = salesRepRole.role_permissions
                .filter(rp => rp.permission.entity_type === 'Lead:Activity')
                .map(rp => rp.permission.action);
            console.log(`   👤 Sales Representative Lead:Activity permissions: ${leadActivityPerms.join(', ')}`);
        }
        console.log('\n✅ Lead:Activity permissions setup completed successfully!');
    }
    catch (error) {
        console.error('❌ Error setting up Lead:Activity permissions:', error);
        throw error;
    }
    finally {
        await dataSource.destroy();
    }
}
addLeadActivityPermissions()
    .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
})
    .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
});
//# sourceMappingURL=add-lead-activity-permissions.script.js.map