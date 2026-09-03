"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeOrmModuleOptions = exports.typeOrmOptions = void 0;
require("dotenv/config");
exports.typeOrmOptions = {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    synchronize: false,
    migrationsRun: false,
    logging: process.env.TYPEORM_LOGGING === 'true',
    timezone: 'local',
    dateStrings: true,
    entities: [__dirname + '/../entities/**/*.entity.ts', __dirname + '/../entities/**/*.entity.js'],
    migrations: [__dirname + '/migrations/*.{ts,js}'],
};
exports.typeOrmModuleOptions = {
    ...exports.typeOrmOptions,
    autoLoadEntities: true,
};
//# sourceMappingURL=typeorm.options.js.map