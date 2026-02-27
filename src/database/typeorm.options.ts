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
    migrationsRun: false, // Disabled - run migrations manually
    logging: true,
    timezone: 'local', // Use local timezone
    dateStrings: true, // Return dates as strings to avoid timezone conversion
    entities: [__dirname + '/../entities/**/*.entity.{ts,js}'],
    migrations: [__dirname + '/migrations/*.{ts,js}'],
};
