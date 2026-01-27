// src/database/seeds/seed-tenants.ts
import 'dotenv/config';
import { AppDataSource } from '../data-source';
import { Tenant } from '../../entities/tenant/tenant.entity';

async function seed() {
    await AppDataSource.initialize();

    const repo = AppDataSource.getRepository(Tenant);

    await repo.save([
        {
            code: 'papito-test',
            name: 'Papito Test',
            is_active: true,
        },
        {
            code: 'valdetierra',
            name: 'Valdetierra',
            is_active: true,
        },
    ]);

    await AppDataSource.destroy();
}

seed();
