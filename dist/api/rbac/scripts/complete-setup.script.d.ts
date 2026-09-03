#!/usr/bin/env ts-node
import 'reflect-metadata';
import { DataSource } from 'typeorm';
interface SetupOptions {
    tenantName?: string;
    tenantSubdomain?: string;
    skipPermissions?: boolean;
    skipTenant?: boolean;
    skipRoles?: boolean;
    skipUsers?: boolean;
    verbose?: boolean;
}
declare class CompleteRBACSetup {
    private dataSource;
    constructor(dataSource: DataSource);
    run(options?: SetupOptions): Promise<void>;
    private setupPermissions;
    private createTenant;
    private createRolesFromTemplates;
    private createSampleUsers;
    displayStatus(): Promise<void>;
}
export { CompleteRBACSetup };
