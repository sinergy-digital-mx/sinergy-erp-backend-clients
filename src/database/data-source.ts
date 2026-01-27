// // src/database/data-source.ts
// import 'reflect-metadata';
// import { DataSource } from 'typeorm';
// import { Tenant } from '../entities/tenant/tenant.entity';
// import { EntityRegistry } from '../entities/entity-registry/entity-registry.entity';
// import { User } from '../entities/users/user.entity';
// import { UserStatus } from '../entities/users/user-status.entity';
// import { Lead } from '../entities/leads/lead.entity';
// import { LeadStatus } from '../entities/leads/lead-status.entity';
// import { Customer } from '../entities/customers/customer.entity';
// import { CustomerStatus } from '../entities/customers/customer-status.entity';
// import 'dotenv/config';
// import 'reflect-metadata';


// export const AppDataSource = new DataSource({
//     type: 'mysql',
//     host: process.env.DB_HOST,
//     port: Number(process.env.DB_PORT),
//     username: process.env.DB_USER,
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME,
//     synchronize: false,
//     logging: true,
//     entities: [__dirname + '/../entities/**/*.entity.{ts,js}'],
//     migrations: [__dirname + '/migrations/*.{ts,js}'],
// });

// src/database/data-source.ts
import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { typeOrmOptions } from './typeorm.options';

export const AppDataSource = new DataSource(typeOrmOptions);
