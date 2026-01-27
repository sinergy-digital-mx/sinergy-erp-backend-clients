// src/database/seeds/seed-tenants.ts
import 'dotenv/config';
import { AppDataSource } from '../data-source';
import { RBACTenant } from '../../entities/rbac/tenant.entity';

async function seed() {
    await AppDataSource.initialize();

    const repo = AppDataSource.getRepository(RBACTenant);

    await repo.save([
        {
            subdomain: 'papito-test',
            name: 'Papito Test',
            is_active: true,
        },
        {
            subdomain: 'valdetierra',
            name: 'Valdetierra',
            is_active: true,
        },
    ]);

    await AppDataSource.destroy();
}

seed();
