#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMigrationScript = void 0;
require("reflect-metadata");
const data_source_1 = require("../../../database/data-source");
const user_entity_1 = require("../../../entities/users/user.entity");
const tenant_entity_1 = require("../../../entities/rbac/tenant.entity");
class UserMigrationScript {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async migrateUsers() {
        console.log('🔄 Starting User Migration to RBAC Tenants...\n');
        try {
            const userRepo = this.dataSource.getRepository(user_entity_1.User);
            const rbacTenantRepo = this.dataSource.getRepository(tenant_entity_1.RBACTenant);
            const users = await userRepo.find();
            console.log(`📊 Found ${users.length} users to migrate`);
            const rbacTenants = await rbacTenantRepo.find();
            console.log(`🏢 Found ${rbacTenants.length} RBAC tenants`);
            let migratedCount = 0;
            let skippedCount = 0;
            for (const user of users) {
                console.log(`\n👤 Processing user: ${user.email}`);
                console.log(`   Current tenant_id: ${user.tenant_id}`);
                if (user.tenant_id && user.tenant_id.length === 36 && user.tenant_id.includes('-')) {
                    console.log(`   ✅ User already has RBAC tenant_id (UUID)`);
                    skippedCount++;
                    continue;
                }
                const demoTenant = rbacTenants.find(t => t.subdomain === 'demo');
                if (!demoTenant) {
                    console.log(`   ⚠️  Demo tenant not found, skipping user`);
                    skippedCount++;
                    continue;
                }
                await userRepo.update(user.id, {
                    tenant_id: demoTenant.id,
                });
                console.log(`   ✅ Migrated to tenant: ${demoTenant.name} (${demoTenant.id})`);
                migratedCount++;
            }
            console.log(`\n📊 Migration summary:`);
            console.log(`✅ Migrated: ${migratedCount} users`);
            console.log(`⏭️  Skipped: ${skippedCount} users (already migrated)`);
            console.log(`📋 Total: ${users.length} users processed`);
            console.log('\n🎯 User migration completed successfully!');
        }
        catch (error) {
            console.error('❌ User migration failed:', error);
            throw error;
        }
    }
    async verifyMigration() {
        console.log('\n🔍 Verifying Migration Results...');
        console.log('==================================');
        const userRepo = this.dataSource.getRepository(user_entity_1.User);
        const rbacTenantRepo = this.dataSource.getRepository(tenant_entity_1.RBACTenant);
        const users = await userRepo.find({
            relations: ['tenant']
        });
        console.log(`\n📊 Total users: ${users.length}`);
        let validCount = 0;
        let invalidCount = 0;
        for (const user of users) {
            if (user.tenant) {
                console.log(`✅ ${user.email} -> ${user.tenant.name} (${user.tenant.subdomain})`);
                validCount++;
            }
            else {
                console.log(`❌ ${user.email} -> No valid tenant`);
                invalidCount++;
            }
        }
        console.log(`\n📈 Migration Results:`);
        console.log(`✅ Valid: ${validCount} users`);
        console.log(`❌ Invalid: ${invalidCount} users`);
        if (invalidCount === 0) {
            console.log(`\n🎉 All users successfully migrated!`);
        }
        else {
            console.log(`\n⚠️  ${invalidCount} users still need migration`);
        }
    }
}
exports.UserMigrationScript = UserMigrationScript;
async function main() {
    const command = process.argv[2] || 'migrate';
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
            console.log('✅ Database connection established');
        }
        const migrationScript = new UserMigrationScript(data_source_1.AppDataSource);
        switch (command) {
            case 'migrate':
                await migrationScript.migrateUsers();
                break;
            case 'verify':
                await migrationScript.verifyMigration();
                break;
            default:
                console.log('User Migration Script');
                console.log('=====================');
                console.log('Usage:');
                console.log('  npm run rbac:migrate-users migrate    - Migrate users to RBAC tenants');
                console.log('  npm run rbac:migrate-users verify     - Verify migration results');
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
//# sourceMappingURL=migrate-users.script.js.map