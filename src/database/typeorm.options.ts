// src/database/typeorm.options.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
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
    logging: process.env.TYPEORM_LOGGING === 'true',
    timezone: 'local', // Use local timezone
    dateStrings: true, // Return dates as strings to avoid timezone conversion
    // Keep glob for scripts/CLI usage; autoLoadEntities ensures Nest modules
    // registered with TypeOrmModule.forFeature() are always attached too.
    entities: [__dirname + '/../entities/**/*.entity.ts', __dirname + '/../entities/**/*.entity.js'],
    migrations: [__dirname + '/migrations/*.{ts,js}'],
};

export const typeOrmModuleOptions: TypeOrmModuleOptions = {
    ...typeOrmOptions,
    autoLoadEntities: true,
};
