import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';
import { User } from '../../entities/users/user.entity';
import { Permission } from '../../entities/rbac/permission.entity';
import { UserRole } from '../../entities/rbac/user-role.entity';
import { Role } from '../../entities/rbac/role.entity';
import { RolePermission } from '../../entities/rbac/role-permission.entity';

class PermissionChecker {
    private dataSource: DataSource;

    constructor() {
        this.dataSource = new DataSource(typeOrmOptions);
    }

    async initialize() {
        await this.dataSource.initialize();
        console.log('✅ Database connection established');
    }

    async destroy() {
        await this.dataSource.destroy();
    }

    async checkUserPermissions(userEmail: string, tenantId?: string) {
        const userRepo = this.dataSource.getRepository(User);
        const userRoleRepo = this.dataSource.getRepository(UserRole);

        // Find user
        const user = await userRepo.findOne({
            where: { email: userEmail },
            relations: ['tenant', 'status']
        });

        if (!user) {
            console.log(`❌ User not found: ${userEmail}`);
            return;
        }

        console.log(`\n👤 User: ${user.email}`);
        console.log(`🏢 Tenant: ${user.tenant?.name || 'N/A'} (${user.tenant_id})`);
        console.log(`📧 Status: ${user.status?.name || 'N/A'}`);

        if (tenantId && user.tenant_id !== tenantId) {
            console.log(`⚠️  Warning: User belongs to different tenant (${user.tenant_id}) than requested (${tenantId})`);
        }

        // Find user roles
        const userRoles = await userRoleRepo.find({
            where: { 
                user_id: user.id,
                tenant_id: user.tenant_id 
            },
            relations: ['role', 'role.role_permissions', 'role.role_permissions.permission']
        });

        // Check roles and permissions
        console.log(`\n🔐 Roles and Permissions:`);
        
        if (!userRoles || userRoles.length === 0) {
            console.log(`❌ No roles assigned to user`);
            return;
        }

        const allPermissions = new Set<string>();

        for (const userRole of userRoles) {
            const role = userRole.role;
            console.log(`\n📋 Role: ${role.name} (${role.code})`);
            console.log(`   Status: ${role.is_system_role ? 'System Role' : 'Custom Role'}`);
            
            if (role.role_permissions && role.role_permissions.length > 0) {
                console.log(`   Permissions:`);
                for (const rolePermission of role.role_permissions) {
                    const permission = rolePermission.permission;
                    const permissionKey = `${permission.entity_type}:${permission.action}`;
                    allPermissions.add(permissionKey);
                    console.log(`     - ${permissionKey} (${permission.description})`);
                }
            } else {
                console.log(`     - No permissions assigned to this role`);
            }
        }

        // Check specifically for Lead:Read permission
        console.log(`\n🔍 Lead Permission Check:`);
        const hasLeadRead = allPermissions.has('Lead:Read');
        console.log(`   Lead:Read: ${hasLeadRead ? '✅ GRANTED' : '❌ DENIED'}`);

        // List all Lead permissions
        const leadPermissions = Array.from(allPermissions).filter(p => p.startsWith('Lead:'));
        if (leadPermissions.length > 0) {
            console.log(`   All Lead permissions:`);
            leadPermissions.forEach(p => console.log(`     - ${p}`));
        } else {
            console.log(`   No Lead permissions found`);
        }

        return {
            user,
            hasLeadRead,
            allPermissions: Array.from(allPermissions),
            leadPermissions
        };
    }

    async listAllLeadPermissions() {
        const permissionRepo = this.dataSource.getRepository(Permission);
        
        const leadPermissions = await permissionRepo.find({
            where: { entity_type: 'Lead' }
        });

        console.log(`\n📋 All available Lead permissions in database:`);
        leadPermissions.forEach(p => {
            console.log(`   - ${p.entity_type}:${p.action} - ${p.description}`);
        });

        return leadPermissions;
    }
}

async function main() {
    const checker = new PermissionChecker();
    
    try {
        await checker.initialize();
        
        // You can change this email to check different users
        const userEmail = process.argv[2] || 'admin@example.com';
        const tenantId = process.argv[3];
        
        console.log(`🔍 Checking permissions for user: ${userEmail}`);
        if (tenantId) {
            console.log(`🏢 For tenant: ${tenantId}`);
        }
        
        await checker.listAllLeadPermissions();
        await checker.checkUserPermissions(userEmail, tenantId);
        
    } catch (error) {
        console.error('💥 Error checking permissions:', error);
        process.exit(1);
    } finally {
        await checker.destroy();
    }
}

// Run the checker
if (require.main === module) {
    main();
}