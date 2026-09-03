#!/usr/bin/env ts-node
import 'reflect-metadata';
import { AppDataSource } from '../../../database/data-source';
declare class SimpleCompleteSetup {
    private dataSource;
    constructor(dataSource: typeof AppDataSource);
    run(): Promise<void>;
    private setupPermissions;
    private createTenant;
    private createRolesFromTemplates;
    displayStatus(): Promise<void>;
}
export { SimpleCompleteSetup };
