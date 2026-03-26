import { AppDataSource } from '../data-source';
import { User } from '../../entities/users/user.entity';
import * as bcrypt from 'bcrypt';

async function manageUsers() {
    try {
        await AppDataSource.initialize();

        const userRepo = AppDataSource.getRepository(User);
        const tenantId = '54481b63-5516-458d-9bb3-d4e5cb028864';

        // Step 1: Create Ana Lorena user if doesn't exist
        const existingAna = await userRepo.findOne({
            where: { email: 'prueba_analo@gmail.com' },
        });

        if (!existingAna) {
            const hashedPassword = await bcrypt.hash('123', 10);
            const anaUser = userRepo.create({
                email: 'prueba_analo@gmail.com',
                password: hashedPassword,
                first_name: 'Ana',
                last_name: 'Lorena',
                tenant_id: tenantId,
            });
            await userRepo.save(anaUser);
            console.log('✓ Created user: Ana Lorena (prueba_analo@gmail.com)');
        } else {
            console.log('✓ Ana Lorena user already exists');
        }

        // Create Elena user if doesn't exist
        const existingElena = await userRepo.findOne({
            where: { email: 'prueba_elena@gmail.com' },
        });

        if (!existingElena) {
            const hashedPassword = await bcrypt.hash('123', 10);
            const elenaUser = userRepo.create({
                email: 'prueba_elena@gmail.com',
                password: hashedPassword,
                first_name: 'Elena',
                last_name: 'Test',
                tenant_id: tenantId,
            });
            await userRepo.save(elenaUser);
            console.log('✓ Created user: Elena (prueba_elena@gmail.com)');
        } else {
            console.log('✓ Elena user already exists');
        }

        // Create Mariana user if doesn't exist
        const existingMariana = await userRepo.findOne({
            where: { email: 'prueba_mariana@gmail.com' },
        });

        if (!existingMariana) {
            const hashedPassword = await bcrypt.hash('123', 10);
            const marianaUser = userRepo.create({
                email: 'prueba_mariana@gmail.com',
                password: hashedPassword,
                first_name: 'Mariana',
                last_name: 'Test',
                tenant_id: tenantId,
            });
            await userRepo.save(marianaUser);
            console.log('✓ Created user: Mariana (prueba_mariana@gmail.com)');
        } else {
            console.log('✓ Mariana user already exists');
        }

        // Step 2: Get all users for this tenant
        const allUsers = await userRepo.find({
            where: { tenant_id: tenantId },
        });

        console.log(`\nTotal users in tenant: ${allUsers.length}`);

        // Step 3: Delete all users except the 5 specified
        const usersToKeep = [
            'prueba_elena@gmail.com',
            'prueba_mariana@gmail.com',
            'prueba_analo@gmail.com',
            'christopher.sandoval@test.com',
            'rodolfo.rodriguez@test.com',
        ];

        const usersToDelete = allUsers.filter(user => !usersToKeep.includes(user.email));

        if (usersToDelete.length > 0) {
            console.log(`\nDeleting ${usersToDelete.length} users:`);
            for (const user of usersToDelete) {
                console.log(`  - Deleting: ${user.first_name} ${user.last_name} (${user.email})`);
                await userRepo.remove(user);
            }
            console.log('✓ Users deleted successfully');
        } else {
            console.log('\n✓ No users to delete');
        }

        // Step 4: Show remaining users
        const remainingUsers = await userRepo.find({
            where: { tenant_id: tenantId },
        });

        console.log(`\n✓ Remaining users (${remainingUsers.length}):`);
        for (const user of remainingUsers) {
            console.log(`  - ${user.first_name} ${user.last_name} (${user.email})`);
        }

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error managing users:', error);
        process.exit(1);
    }
}

manageUsers();
