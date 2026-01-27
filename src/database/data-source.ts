import { DataSource } from 'typeorm';
import { typeOrmOptions } from './typeorm.options';

export const AppDataSource = new DataSource(typeOrmOptions);