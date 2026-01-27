// src/database/seeds/seed-users.ts
import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { User } from '../../entities/users/user.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { UserStatus } from '../../entities/users/user-status.entity';

async function seed() {
    await AppDataSource.initialize();

    const userRepo = AppDataSource.getRepository(User);
    const tenantRepo = AppDataSource.getRepository(RBACTenant);
    const statusRepo = AppDataSource.getRepository(UserStatus);

    let activeStatus = await statusRepo.findOne({ where: { code: 'active' } });
    if (!activeStatus) {
        activeStatus = await statusRepo.save({ code: 'active', name: 'Active' });
    }

    const tenant = await tenantRepo.findOneByOrFail({ subdomain: 'demo' });

    await userRepo.save([
        {
            email: 'rodolfo.rodriguez@test.com',
            password: 'password',
            tenant,
            tenant_id: tenant.id,
            status: activeStatus,
        },
        {
            email: 'christopher.sandoval@test.com',
            password: 'password',
            tenant,
            tenant_id: tenant.id,
            status: activeStatus,
        },
    ]);

    await AppDataSource.destroy();
}

seed();
