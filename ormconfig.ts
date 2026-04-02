import { DataSource } from 'typeorm';
import 'dotenv/config';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: true,
  timezone: 'local',
  dateStrings: true,
  entities: ['src/entities/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
