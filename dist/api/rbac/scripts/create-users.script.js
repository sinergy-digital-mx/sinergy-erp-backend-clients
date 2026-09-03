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
exports.UserCreationScript = void 0;
require("reflect-metadata");
const data_source_1 = require("../../../database/data-source");
const user_entity_1 = require("../../../entities/users/user.entity");
const user_status_entity_1 = require("../../../entities/users/user-status.entity");
const tenant_entity_1 = require("../../../entities/rbac/tenant.entity");
const role_entity_1 = require("../../../entities/rbac/role.entity");
const user_role_entity_1 = require("../../../entities/rbac/user-role.entity");
const bcrypt = __importStar(require("bcrypt"));
class UserCreationScript {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async createUsers(tenantSubdomain = 'demo') {
        console.log('👤 Starting User Creation...\n');
        try {
            const rbacTenantRepo = this.dataSource.getRepository(tenant_entity_1.RBACTenant);
            const rbacTenant = await rbacTenantRepo.findOne({ where: { subdomain: tenantSubdomain } });
            if (!rbacTenant) {
                throw new Error(`RBAC Tenant with subdomain "${tenantSubdomain}" not found. Run the RBAC setup first.`);
            }
            console.log(`🏢 Using tenant: ${rbacTenant.name} (${rbacTenant.subdomain})`);
            const userStatusRepo = this.dataSource.getRepository(user_status_entity_1.UserStatus);
            let activeStatus = await userStatusRepo.findOne({ where: { code: 'active' } });
            if (!activeStatus) {
                activeStatus = userStatusRepo.create({
                    code: 'active',
                    name: 'Active',
                });
                await userStatusRepo.save(activeStatus);
                console.log(`✅ Created user status: Active`);
            }
            const sampleUsers = [
                {
                    email: 'admin@demo.com',
                    password: 'admin123',
                    roles: ['System Administrator'],
                    description: 'System Administrator with full access'
                },
                {
                    email: 'sales.manager@demo.com',
                    password: 'sales123',
                    roles: ['Sales Manager'],
                    description: 'Sales Manager overseeing the sales team'
                },
                {
                    email: 'sales.rep@demo.com',
                    password: 'sales123',
                    roles: ['Sales Representative'],
                    description: 'Sales Representative handling leads and customers'
                },
                {
                    email: 'marketing@demo.com',
                    password: 'marketing123',
                    roles: ['Marketing Specialist'],
                    description: 'Marketing Specialist managing campaigns'
                },
                {
                    email: 'support@demo.com',
                    password: 'support123',
                    roles: ['Customer Support'],
                    description: 'Customer Support representative'
                },
                {
                    email: 'analyst@demo.com',
                    password: 'analyst123',
                    roles: ['Data Analyst'],
                    description: 'Data Analyst with reporting capabilities'
                },
                {
                    email: 'hr@demo.com',
                    password: 'hr123',
                    roles: ['HR Manager'],
                    description: 'HR Manager handling user management'
                },
                {
                    email: 'auditor@demo.com',
                    password: 'auditor123',
                    roles: ['Read Only Auditor'],
                    description: 'Auditor with read-only access for compliance'
                }
            ];
            const userRepo = this.dataSource.getRepository(user_entity_1.User);
            const roleRepo = this.dataSource.getRepository(role_entity_1.Role);
            const userRoleRepo = this.dataSource.getRepository(user_role_entity_1.UserRole);
            let createdCount = 0;
            let skippedCount = 0;
            for (const userData of sampleUsers) {
                const existingUser = await userRepo.findOne({
                    where: { email: userData.email }
                });
                if (existingUser) {
                    skippedCount++;
                    console.log(`   ⏭️  User ${userData.email} already exists`);
                    continue;
                }
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                const newUser = userRepo.create({
                    email: userData.email,
                    password: hashedPassword,
                    tenant: rbacTenant,
                    tenant_id: rbacTenant.id,
                    status: activeStatus,
                });
                const savedUser = await userRepo.save(newUser);
                createdCount++;
                console.log(`   ✅ Created user: ${userData.email}`);
                console.log(`     📝 Description: ${userData.description}`);
                let assignedRoles = 0;
                for (const roleName of userData.roles) {
                    const role = await roleRepo.findOne({
                        where: { name: roleName, tenant_id: rbacTenant.id }
                    });
                    if (role) {
                        const existingUserRole = await userRoleRepo.findOne({
                            where: {
                                user_id: savedUser.id,
                                role_id: role.id,
                                tenant_id: rbacTenant.id,
                            }
                        });
                        if (!existingUserRole) {
                            const userRole = userRoleRepo.create({
                                user_id: savedUser.id,
                                role_id: role.id,
                                tenant_id: rbacTenant.id,
                            });
                            await userRoleRepo.save(userRole);
                            assignedRoles++;
                            console.log(`     👥 Assigned role: ${roleName}`);
                        }
                    }
                    else {
                        console.log(`     ⚠️  Role "${roleName}" not found`);
                    }
                }
                if (assignedRoles === 0) {
                    console.log(`     ⚠️  No roles assigned to ${userData.email}`);
                }
            }
            console.log(`\n📊 User creation summary:`);
            console.log(`✅ Created: ${createdCount} users`);
            console.log(`⏭️  Skipped: ${skippedCount} users (already exist)`);
            console.log(`📋 Total: ${sampleUsers.length} users processed`);
            console.log('\n🎯 Users created successfully!');
            console.log('\n📖 Login credentials:');
            sampleUsers.forEach(user => {
                console.log(`   • ${user.email} / ${user.password} (${user.roles.join(', ')})`);
            });
        }
        catch (error) {
            console.error('❌ User creation failed:', error);
            throw error;
        }
    }
    async listUsers() {
        console.log('\n👤 Current Users:');
        console.log('================');
        const userRepo = this.dataSource.getRepository(user_entity_1.User);
        const userRoleRepo = this.dataSource.getRepository(user_role_entity_1.UserRole);
        const roleRepo = this.dataSource.getRepository(role_entity_1.Role);
        const users = await userRepo.find({
            relations: ['tenant', 'status']
        });
        if (users.length === 0) {
            console.log('No users found. Run the user creation script first.');
            return;
        }
        for (const user of users) {
            console.log(`\n📧 ${user.email}`);
            console.log(`   🏢 Tenant: ${user.tenant?.name || 'N/A'}`);
            console.log(`   📊 Status: ${user.status?.name || 'N/A'}`);
            console.log(`   📅 Created: ${user.created_at.toLocaleDateString()}`);
            const userRoles = await userRoleRepo.find({
                where: { user_id: user.id },
                relations: ['role']
            });
            if (userRoles.length > 0) {
                console.log(`   👥 Roles:`);
                for (const userRole of userRoles) {
                    const role = await roleRepo.findOne({ where: { id: userRole.role_id } });
                    if (role) {
                        console.log(`     • ${role.name} - ${role.description}`);
                    }
                }
            }
            else {
                console.log(`   👥 Roles: None assigned`);
            }
        }
        console.log(`\n📊 Total users: ${users.length}`);
    }
    async assignRole(userEmail, roleName, tenantSubdomain = 'demo') {
        console.log(`👥 Assigning role "${roleName}" to user "${userEmail}"...`);
        const userRepo = this.dataSource.getRepository(user_entity_1.User);
        const roleRepo = this.dataSource.getRepository(role_entity_1.Role);
        const userRoleRepo = this.dataSource.getRepository(user_role_entity_1.UserRole);
        const rbacTenantRepo = this.dataSource.getRepository(tenant_entity_1.RBACTenant);
        const user = await userRepo.findOne({ where: { email: userEmail } });
        if (!user) {
            throw new Error(`User with email "${userEmail}" not found`);
        }
        const rbacTenant = await rbacTenantRepo.findOne({ where: { subdomain: tenantSubdomain } });
        if (!rbacTenant) {
            throw new Error(`RBAC Tenant with subdomain "${tenantSubdomain}" not found`);
        }
        const role = await roleRepo.findOne({
            where: { name: roleName, tenant_id: rbacTenant.id }
        });
        if (!role) {
            throw new Error(`Role "${roleName}" not found in tenant "${tenantSubdomain}"`);
        }
        const existingUserRole = await userRoleRepo.findOne({
            where: {
                user_id: user.id,
                role_id: role.id,
                tenant_id: rbacTenant.id,
            }
        });
        if (existingUserRole) {
            console.log(`⏭️  User "${userEmail}" already has role "${roleName}"`);
            return;
        }
        const userRole = userRoleRepo.create({
            user_id: user.id,
            role_id: role.id,
            tenant_id: rbacTenant.id,
        });
        await userRoleRepo.save(userRole);
        console.log(`✅ Successfully assigned role "${roleName}" to user "${userEmail}"`);
    }
}
exports.UserCreationScript = UserCreationScript;
async function main() {
    const command = process.argv[2] || 'create';
    const tenantSubdomain = process.argv[3] || 'demo';
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
            console.log('✅ Database connection established');
        }
        const userScript = new UserCreationScript(data_source_1.AppDataSource);
        switch (command) {
            case 'create':
                await userScript.createUsers(tenantSubdomain);
                break;
            case 'list':
                await userScript.listUsers();
                break;
            case 'assign':
                const userEmail = process.argv[4];
                const roleName = process.argv[5];
                if (!userEmail || !roleName) {
                    console.log('Usage: npm run rbac:users assign [tenant-subdomain] [user-email] [role-name]');
                    process.exit(1);
                }
                await userScript.assignRole(userEmail, roleName, tenantSubdomain);
                break;
            default:
                console.log('User Management Script');
                console.log('======================');
                console.log('Usage:');
                console.log('  npm run rbac:users create [tenant-subdomain]           - Create sample users');
                console.log('  npm run rbac:users list                                - List all users');
                console.log('  npm run rbac:users assign [tenant] [email] [role]     - Assign role to user');
                console.log('');
                console.log('Examples:');
                console.log('  npm run rbac:users create demo');
                console.log('  npm run rbac:users assign demo john@demo.com "Sales Manager"');
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
//# sourceMappingURL=create-users.script.js.map