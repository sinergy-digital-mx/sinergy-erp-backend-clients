// src/database/typeorm.options.ts
import { DataSourceOptions } from 'typeorm';
import 'dotenv/config';

export const typeOrmOptions: DataSourceOptions = {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    synchronize: false,
    migrationsRun: true,
    logging: true,
    timezone: 'Z', // Force UTC timezone
    entities: [__dirname + '/../entities/**/*.entity.{ts,js}'],
    migrations: [__dirname + '/migrations/*.{ts,js}'],
};
