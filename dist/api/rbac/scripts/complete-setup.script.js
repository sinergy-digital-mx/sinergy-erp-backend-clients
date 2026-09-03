#!/usr/bin/env ts-node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteRBACSetup = void 0;
require("reflect-metadata");
const data_source_1 = require("../../../database/data-source");
const permission_entity_1 = require("../../../entities/rbac/permission.entity");
const entity_registry_entity_1 = require("../../../entities/entity-registry/entity-registry.entity");
const tenant_entity_1 = require("../../../entities/rbac/tenant.entity");
const role_entity_1 = require("../../../entities/rbac/role.entity");
const user_entity_1 = require("../../../entities/users/user.entity");
const user_role_entity_1 = require("../../../entities/rbac/user-role.entity");
const role_permission_entity_1 = require("../../../entities/rbac/role-permission.entity");
const enhanced_role_templates_1 = require("../templates/enhanced-role-templates");
const bcrypt = __importStar(require("bcrypt"));
class CompleteRBACSetup {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async run(options = {}) {
        const { tenantName = 'Demo Company', tenantSubdomain = 'demo', skipPermissions = false, skipTenant = false, skipRoles = false, skipUsers = false, verbose = true, } = options;
        if (verbose) {
            console.log('🚀 Starting Complete RBAC Setup...\n');
        }
        try {
            if (!skipPermissions) {
                if (verbose)
                    console.log('📋 Step 1: Setting up permissions...');
                await this.setupPermissions(verbose);
            }
            let tenantId;
            if (!skipTenant) {
                if (verbose)
                    console.log(`\n🏢 Step 2: Creating tenant "${tenantName}"...`);
                tenantId = await this.createTenant(tenantName, tenantSubdomain, verbose);
            }
            else {
                const tenantRepo = this.dataSource.getRepository(tenant_entity_1.RBACTenant);
                const tenant = await tenantRepo.findOne({ where: { subdomain: tenantSubdomain } });
                if (!tenant) {
                    throw new Error(`Tenant with subdomain "${tenantSubdomain}" not found`);
                }
                tenantId = tenant.id;
                if (verbose)
                    console.log(`\n🏢 Using existing tenant: ${tenant.name} (${tenantId})`);
            }
            if (!skipRoles) {
                if (verbose)
                    console.log('\n👥 Step 3: Creating roles from templates...');
                await this.createRolesFromTemplates(tenantId, verbose);
            }
            if (!skipUsers) {
                if (verbose)
                    console.log('\n👤 Step 4: Creating sample users...');
                await this.createSampleUsers(tenantId, verbose);
            }
            if (verbose) {
                console.log('\n✅ Complete RBAC Setup finished successfully!');
                console.log('\n📊 Summary:');
                console.log(`   🏢 Tenant: ${tenantName} (${tenantSubdomain})`);
                console.log(`   🆔 Tenant ID: ${tenantId}`);
                console.log('\n🎯 Your RBAC system is now ready to use!');
            }
        }
        catch (error) {
            console.error('❌ Setup failed:', error);
            throw error;
        }
    }
    async setupPermissions(verbose) {
        const permissionRepository = this.dataSource.getRepository(permission_entity_1.Permission);
        const entityRegistryRepository = this.dataSource.getRepository(entity_registry_entity_1.EntityRegistry);
        const entities = [
            { code: 'Customer', name: 'Customer Management' },
            { code: 'Lead', name: 'Lead Management' },
            { code: 'User', name: 'User Management' },
            { code: 'Role', name: 'Role Management' },
            { code: 'Permission', name: 'Permission Management' },
            { code: 'Tenant', name: 'Tenant Management' },
            { code: 'Report', name: 'Report Management' },
            { code: 'AuditLog', name: 'Audit Log Management' },
        ];
        for (const entity of entities) {
            const existing = await entityRegistryRepository.findOne({
                where: { code: entity.code }
            });
            if (!existing) {
                const newEntity = entityRegistryRepository.create(entity);
                await entityRegistryRepository.save(newEntity);
                if (verbose)
                    console.log(`   ✅ Created entity: ${entity.code}`);
            }
        }
        const permissionsToCreate = [
            { entity_type: 'Customer', action: 'Create', description: 'Create new customers', is_system_permission: true },
            { entity_type: 'Customer', action: 'Read', description: 'View customer information', is_system_permission: true },
            { entity_type: 'Customer', action: 'Update', description: 'Edit customer information', is_system_permission: true },
            { entity_type: 'Customer', action: 'Delete', description: 'Delete customers', is_system_permission: true },
            { entity_type: 'Customer', action: 'Export', description: 'Export customer data', is_system_permission: true },
            { entity_type: 'Customer', action: 'Import', description: 'Import customer data', is_system_permission: true },
            { entity_type: 'Customer', action: 'Bulk_Update', description: 'Update multiple customers at once', is_system_permission: true },
            { entity_type: 'Customer', action: 'Download_Report', description: 'Download customer reports', is_system_permission: true },
            { entity_type: 'Lead', action: 'Create', description: 'Create new leads', is_system_permission: true },
            { entity_type: 'Lead', action: 'Read', description: 'View lead information', is_system_permission: true },
            { entity_type: 'Lead', action: 'Update', description: 'Edit lead information', is_system_permission: true },
            { entity_type: 'Lead', action: 'Delete', description: 'Delete leads', is_system_permission: true },
            { entity_type: 'Lead', action: 'Export', description: 'Export lead data', is_system_permission: true },
            { entity_type: 'Lead', action: 'Import', description: 'Import lead data', is_system_permission: true },
            { entity_type: 'Lead', action: 'Convert', description: 'Convert leads to customers', is_system_permission: true },
            { entity_type: 'Lead', action: 'Assign', description: 'Assign leads to users', is_system_permission: true },
            { entity_type: 'Lead', action: 'Download_Report', description: 'Download lead reports', is_system_permission: true },
            { entity_type: 'User', action: 'Create', description: 'Create new users', is_system_permission: true },
            { entity_type: 'User', action: 'Read', description: 'View user information', is_system_permission: true },
            { entity_type: 'User', action: 'Update', description: 'Edit user information', is_system_permission: true },
            { entity_type: 'User', action: 'Delete', description: 'Delete users', is_system_permission: true },
            { entity_type: 'User', action: 'Activate', description: 'Activate user accounts', is_system_permission: true },
            { entity_type: 'User', action: 'Deactivate', description: 'Deactivate user accounts', is_system_permission: true },
            { entity_type: 'User', action: 'Reset_Password', description: 'Reset user passwords', is_system_permission: true },
            { entity_type: 'Role', action: 'Create', description: 'Create new roles', is_system_permission: true },
            { entity_type: 'Role', action: 'Read', description: 'View role information', is_system_permission: true },
            { entity_type: 'Role', action: 'Update', description: 'Edit role information', is_system_permission: true },
            { entity_type: 'Role', action: 'Delete', description: 'Delete roles', is_system_permission: true },
            { entity_type: 'Role', action: 'Assign', description: 'Assign roles to users', is_system_permission: true },
            { entity_type: 'Role', action: 'Revoke', description: 'Revoke roles from users', is_system_permission: true },
            { entity_type: 'Permission', action: 'Read', description: 'View permission information', is_system_permission: true },
            { entity_type: 'Permission', action: 'Assign', description: 'Assign permissions to roles', is_system_permission: true },
            { entity_type: 'Permission', action: 'Revoke', description: 'Revoke permissions from roles', is_system_permission: true },
            { entity_type: 'Tenant', action: 'Create', description: 'Create new tenants', is_system_permission: true },
            { entity_type: 'Tenant', action: 'Read', description: 'View tenant information', is_system_permission: true },
            { entity_type: 'Tenant', action: 'Update', description: 'Edit tenant information', is_system_permission: true },
            { entity_type: 'Tenant', action: 'Delete', description: 'Delete tenants', is_system_permission: true },
            { entity_type: 'Tenant', action: 'Configure', description: 'Configure tenant settings', is_system_permission: true },
            { entity_type: 'Report', action: 'Create', description: 'Create custom reports', is_system_permission: true },
            { entity_type: 'Report', action: 'Read', description: 'View reports', is_system_permission: true },
            { entity_type: 'Report', action: 'Update', description: 'Edit reports', is_system_permission: true },
            { entity_type: 'Report', action: 'Delete', description: 'Delete reports', is_system_permission: true },
            { entity_type: 'Report', action: 'Export', description: 'Export reports', is_system_permission: true },
            { entity_type: 'Report', action: 'Schedule', description: 'Schedule automated reports', is_system_permission: true },
            { entity_type: 'AuditLog', action: 'Read', description: 'View audit logs', is_system_permission: true },
            { entity_type: 'AuditLog', action: 'Export', description: 'Export audit logs', is_system_permission: true },
            { entity_type: 'AuditLog', action: 'Delete', description: 'Delete old audit logs', is_system_permission: true },
        ];
        let createdCount = 0;
        for (const permissionData of permissionsToCreate) {
            const existing = await permissionRepository.findOne({
                where: {
                    entity_type: permissionData.entity_type,
                    action: permissionData.action,
                }
            });
            if (!existing) {
                const permission = permissionRepository.create(permissionData);
                await permissionRepository.save(permission);
                createdCount++;
            }
        }
        if (verbose) {
            console.log(`   ✅ Permissions ready: ${createdCount} created, ${permissionsToCreate.length - createdCount} existed`);
        }
    }
    async createTenant(name, subdomain, verbose) {
        const tenantRepo = this.dataSource.getRepository(tenant_entity_1.RBACTenant);
        const existingTenant = await tenantRepo.findOne({ where: { subdomain } });
        if (existingTenant) {
            if (verbose) {
                console.log(`   ⏭️  Tenant "${name}" already exists`);
                console.log(`   🆔 Tenant ID: ${existingTenant.id}`);
            }
            return existingTenant.id;
        }
        const newTenant = tenantRepo.create({
            name,
            subdomain,
            is_active: true,
        });
        const savedTenant = await tenantRepo.save(newTenant);
        if (verbose) {
            console.log(`   ✅ Created tenant: ${name}`);
            console.log(`   🆔 Tenant ID: ${savedTenant.id}`);
        }
        return savedTenant.id;
    }
    async createRolesFromTemplates(tenantId, verbose) {
        const roleRepo = this.dataSource.getRepository(role_entity_1.Role);
        const permissionRepo = this.dataSource.getRepository(permission_entity_1.Permission);
        const rolePermissionRepo = this.dataSource.getRepository(role_permission_entity_1.RolePermission);
        const templates = (0, enhanced_role_templates_1.getAllRoleTemplates)();
        let createdCount = 0;
        let skippedCount = 0;
        for (const template of templates) {
            const existingRole = await roleRepo.findOne({
                where: { name: template.name, tenant_id: tenantId }
            });
            if (existingRole) {
                skippedCount++;
                if (verbose) {
                    console.log(`   ⏭️  Role "${template.name}" already exists`);
                }
                continue;
            }
            const newRole = roleRepo.create({
                name: template.name,
                description: template.description,
                tenant_id: tenantId,
                is_system_role: false,
            });
            const savedRole = await roleRepo.save(newRole);
            createdCount++;
            if (verbose) {
                console.log(`   ✅ Created role: ${template.name}`);
            }
            let permissionCount = 0;
            for (const permissionGroup of template.permissions) {
                for (const action of permissionGroup.actions) {
                    const permission = await permissionRepo.findOne({
                        where: {
                            entity_type: permissionGroup.entityType,
                            action: action,
                        }
                    });
                    if (permission) {
                        const existingRolePermission = await rolePermissionRepo.findOne({
                            where: {
                                role_id: savedRole.id,
                                permission_id: permission.id,
                            }
                        });
                        if (!existingRolePermission) {
                            const rolePermission = rolePermissionRepo.create({
                                role_id: savedRole.id,
                                permission_id: permission.id,
                            });
                            await rolePermissionRepo.save(rolePermission);
                            permissionCount++;
                        }
                    }
                }
            }
            if (verbose) {
                console.log(`     📋 Assigned ${permissionCount} permissions`);
            }
        }
        if (verbose) {
            console.log(`   📊 Roles summary: ${createdCount} created, ${skippedCount} existed`);
        }
    }
    async createSampleUsers(tenantId, verbose) {
        const userRepo = this.dataSource.getRepository(user_entity_1.User);
        const roleRepo = this.dataSource.getRepository(role_entity_1.Role);
        const userRoleRepo = this.dataSource.getRepository(user_role_entity_1.UserRole);
        const sampleUsers = [
            {
                email: 'admin@demo.com',
                password: 'admin123',
                roles: ['System Administrator']
            },
            {
                email: 'sales.manager@demo.com',
                password: 'sales123',
                roles: ['Sales Manager']
            },
            {
                email: 'sales.rep@demo.com',
                password: 'sales123',
                roles: ['Sales Representative']
            },
            {
                email: 'marketing@demo.com',
                password: 'marketing123',
                roles: ['Marketing Specialist']
            },
            {
                email: 'support@demo.com',
                password: 'support123',
                roles: ['Customer Support']
            },
            {
                email: 'analyst@demo.com',
                password: 'analyst123',
                roles: ['Data Analyst']
            },
            {
                email: 'hr@demo.com',
                password: 'hr123',
                roles: ['HR Manager']
            },
            {
                email: 'auditor@demo.com',
                password: 'auditor123',
                roles: ['Read Only Auditor']
            }
        ];
        let createdCount = 0;
        let skippedCount = 0;
        for (const userData of sampleUsers) {
            const existingUser = await userRepo.findOne({
                where: { email: userData.email }
            });
            if (existingUser) {
                skippedCount++;
                if (verbose) {
                    console.log(`   ⏭️  User ${userData.email} already exists`);
                }
                continue;
            }
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const tenant = await this.dataSource.getRepository(tenant_entity_1.RBACTenant).findOne({ where: { id: tenantId } });
            if (!tenant) {
                throw new Error(`Tenant with ID ${tenantId} not found`);
            }
            const newUser = userRepo.create({
                email: userData.email,
                password: hashedPassword,
                tenant: tenant,
            });
            const savedUser = await userRepo.save(newUser);
            createdCount++;
            if (verbose) {
                console.log(`   ✅ Created user: ${userData.email}`);
            }
            for (const roleName of userData.roles) {
                const role = await roleRepo.findOne({
                    where: { name: roleName, tenant_id: tenantId }
                });
                if (role) {
                    const existingUserRole = await userRoleRepo.findOne({
                        where: {
                            user_id: savedUser.id,
                            role_id: role.id,
                        }
                    });
                    if (!existingUserRole) {
                        const userRole = userRoleRepo.create({
                            user_id: savedUser.id,
                            role_id: role.id,
                        });
                        await userRoleRepo.save(userRole);
                        if (verbose) {
                            console.log(`     👥 Assigned role: ${roleName}`);
                        }
                    }
                }
                else {
                    if (verbose) {
                        console.log(`     ⚠️  Role "${roleName}" not found for user ${userData.email}`);
                    }
                }
            }
        }
        if (verbose) {
            console.log(`   📊 Users summary: ${createdCount} created, ${skippedCount} existed`);
        }
    }
    async displayStatus() {
        const tenantRepo = this.dataSource.getRepository(tenant_entity_1.RBACTenant);
        const roleRepo = this.dataSource.getRepository(role_entity_1.Role);
        const userRepo = this.dataSource.getRepository(user_entity_1.User);
        const permissionRepo = this.dataSource.getRepository(permission_entity_1.Permission);
        const tenantCount = await tenantRepo.count();
        const roleCount = await roleRepo.count();
        const userCount = await userRepo.count();
        const permissionCount = await permissionRepo.count();
        console.log('\n📊 RBAC System Status:');
        console.log('======================');
        console.log(`🏢 Tenants: ${tenantCount}`);
        console.log(`👥 Roles: ${roleCount}`);
        console.log(`👤 Users: ${userCount}`);
        console.log(`🔐 Permissions: ${permissionCount}`);
        const tenants = await tenantRepo.find();
        for (const tenant of tenants) {
            console.log(`\n🏢 Tenant: ${tenant.name} (${tenant.subdomain})`);
            const tenantRoles = await roleRepo.find({ where: { tenant_id: tenant.id } });
            const tenantUsers = await userRepo.find({
                relations: ['tenant'],
                where: {
                    tenant: { id: tenant.id }
                }
            });
            console.log(`   👥 Roles (${tenantRoles.length}):`);
            tenantRoles.forEach(role => {
                console.log(`     • ${role.name}`);
            });
            console.log(`   👤 Users (${tenantUsers.length}):`);
            tenantUsers.forEach(user => {
                console.log(`     • ${user.email}`);
            });
        }
    }
}
exports.CompleteRBACSetup = CompleteRBACSetup;
async function main() {
    const command = process.argv[2] || 'setup';
    const tenantName = process.argv[3] || 'Demo Company';
    const tenantSubdomain = process.argv[4] || 'demo';
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
            console.log('✅ Database connection established');
        }
        const setup = new CompleteRBACSetup(data_source_1.AppDataSource);
        switch (command) {
            case 'setup':
                await setup.run({
                    tenantName,
                    tenantSubdomain,
                    verbose: true,
                });
                break;
            case 'status':
                await setup.displayStatus();
                break;
            case 'permissions-only':
                await setup.run({
                    tenantName,
                    tenantSubdomain,
                    skipTenant: true,
                    skipRoles: true,
                    skipUsers: true,
                    verbose: true,
                });
                break;
            case 'tenant-only':
                await setup.run({
                    tenantName,
                    tenantSubdomain,
                    skipPermissions: true,
                    skipRoles: true,
                    skipUsers: true,
                    verbose: true,
                });
                break;
            case 'roles-only':
                await setup.run({
                    tenantName,
                    tenantSubdomain,
                    skipPermissions: true,
                    skipTenant: true,
                    skipUsers: true,
                    verbose: true,
                });
                break;
            case 'users-only':
                await setup.run({
                    tenantName,
                    tenantSubdomain,
                    skipPermissions: true,
                    skipTenant: true,
                    skipRoles: true,
                    verbose: true,
                });
                break;
            default:
                console.log('Complete RBAC Setup Script');
                console.log('===========================');
                console.log('Usage:');
                console.log('  npm run rbac:complete setup [tenant-name] [subdomain]  - Full setup');
                console.log('  npm run rbac:complete status                           - Show system status');
                console.log('  npm run rbac:complete permissions-only                 - Setup permissions only');
                console.log('  npm run rbac:complete tenant-only [name] [subdomain]   - Create tenant only');
                console.log('  npm run rbac:complete roles-only [name] [subdomain]    - Create roles only');
                console.log('  npm run rbac:complete users-only [name] [subdomain]    - Create users only');
                break;
        }
    }
    catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
    finally {
        if (data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.destroy();
        }
    }
}
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=complete-setup.script.js.map