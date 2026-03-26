import { DataSource } from 'typeorm';
import { typeOrmOptions } from '../typeorm.options';
import { User } from '../../entities/users/user.entity';

class UserLister {
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

    async listUsers() {
        const userRepo = this.dataSource.getRepository(User);
        
        const users = await userRepo.find({
            relations: ['tenant', 'status'],
            order: { created_at: 'DESC' }
        });

        console.log(`\n👥 Found ${users.length} users in database:`);
        
        if (users.length === 0) {
            console.log('   No users found');
            return;
        }

        users.forEach((user, index) => {
            console.log(`\n${index + 1}. 👤 ${user.email}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Tenant: ${user.tenant?.name || 'N/A'} (${user.tenant_id})`);
            console.log(`   Status: ${user.status?.name || 'N/A'}`);
            console.log(`   Created: ${user.created_at}`);
            console.log(`   Last Login: ${user.last_login_at || 'Never'}`);
        });

        return users;
    }
}

async function main() {
    const lister = new UserLister();
    
    try {
        await lister.initialize();
        await lister.listUsers();
        
    } catch (error) {
        console.error('💥 Error listing users:', error);
        process.exit(1);
    } finally {
        await lister.destroy();
    }
}

// Run the lister
if (require.main === module) {
    main();
}