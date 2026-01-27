import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';
import { User } from '../../entities/users/user.entity';
import { UserRole } from '../../entities/rbac/user-role.entity';
import { Role } from '../../entities/rbac/role.entity';

class RoleCopier {
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

    async copyUserRoles(sourceUserId: string, targetUserId: string) {
        const userRepo = this.dataSource.getRepository(User);
        const userRoleRepo = this.dataSource.getRepository(UserRole);
        const roleRepo = this.dataSource.getRepository(Role);

        // Verify both users exist
        const sourceUser = await userRepo.findOne({ 
            where: { id: sourceUserId },
            relations: ['tenant']
        });
        
        const targetUser = await userRepo.findOne({ 
            where: { id: targetUserId },
            relations: ['tenant']
        });

        if (!sourceUser) {
            throw new Error(`Source user not found: ${sourceUserId}`);
        }

        if (!targetUser) {
            throw new Error(`Target user not found: ${targetUserId}`);
        }

        console.log(`👤 Source User: ${sourceUser.email} (${sourceUser.tenant?.name})`);
        console.log(`👤 Target User: ${targetUser.email} (${targetUser.tenant?.name})`);

        // Get source user's roles
        const sourceUserRoles = await userRoleRepo.find({
            where: { 
                user_id: sourceUserId,
                tenant_id: sourceUser.tenant_id 
            },
            relations: ['role']
        });

        if (sourceUserRoles.length === 0) {
            console.log('⚠️  Source user has no roles assigned');
            return;
        }

        console.log(`\n📋 Found ${sourceUserRoles.length} roles to copy:`);
        sourceUserRoles.forEach(userRole => {
            console.log(`   - ${userRole.role.name} (${userRole.role.id})`);
        });

        // Check if target user already has roles
        const existingTargetRoles = await userRoleRepo.find({
            where: { 
                user_id: targetUserId,
                tenant_id: targetUser.tenant_id 
            },
            relations: ['role']
        });

        if (existingTargetRoles.length > 0) {
            console.log(`\n⚠️  Target user already has ${existingTargetRoles.length} roles:`);
            existingTargetRoles.forEach(userRole => {
                console.log(`   - ${userRole.role.name} (${userRole.role.id})`);
            });
            
            // Remove existing roles
            console.log('\n🗑️  Removing existing roles from target user...');
            await userRoleRepo.remove(existingTargetRoles);
        }

        // Copy roles to target user
        console.log('\n📋 Copying roles to target user...');
        const newUserRoles: UserRole[] = [];

        for (const sourceUserRole of sourceUserRoles) {
            const newUserRole = userRoleRepo.create({
                user_id: targetUserId,
                role_id: sourceUserRole.role_id,
                tenant_id: targetUser.tenant_id
            });
            
            newUserRoles.push(newUserRole);
        }

        await userRoleRepo.save(newUserRoles);

        console.log(`✅ Successfully copied ${newUserRoles.length} roles to target user`);
        
        // Verify the copy
        const verifyRoles = await userRoleRepo.find({
            where: { 
                user_id: targetUserId,
                tenant_id: targetUser.tenant_id 
            },
            relations: ['role']
        });

        console.log(`\n🔍 Verification - Target user now has ${verifyRoles.length} roles:`);
        verifyRoles.forEach(userRole => {
            console.log(`   ✅ ${userRole.role.name} (${userRole.role.id})`);
        });
    }
}

async function main() {
    const copier = new RoleCopier();
    
    try {
        await copier.initialize();
        
        // Christopher's user ID
        const sourceUserId = '763b6926-fb57-11f0-a52e-06e7ea787385';
        // Rodolfo's user ID  
        const targetUserId = '763b6ebe-fb57-11f0-a52e-06e7ea787385';
        
        console.log('🔄 Copying roles from Christopher to Rodolfo...\n');
        
        await copier.copyUserRoles(sourceUserId, targetUserId);
        
        console.log('\n🎉 Role copying completed successfully!');
        
    } catch (error) {
        console.error('💥 Error copying roles:', error.message);
        process.exit(1);
    } finally {
        await copier.destroy();
    }
}

// Run the copier
if (require.main === module) {
    main();
}