#!/usr/bin/env ts-node
import 'reflect-metadata';
import { AppDataSource } from '../../../database/data-source';
declare class UserMigrationScript {
    private dataSource;
    constructor(dataSource: typeof AppDataSource);
    migrateUsers(): Promise<void>;
    verifyMigration(): Promise<void>;
}
export { UserMigrationScript };
