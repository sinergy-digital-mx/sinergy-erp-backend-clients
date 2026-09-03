#!/usr/bin/env ts-node
import 'reflect-metadata';
import { AppDataSource } from '../../../database/data-source';
declare class UserCreationScript {
    private dataSource;
    constructor(dataSource: typeof AppDataSource);
    createUsers(tenantSubdomain?: string): Promise<void>;
    listUsers(): Promise<void>;
    assignRole(userEmail: string, roleName: string, tenantSubdomain?: string): Promise<void>;
}
export { UserCreationScript };
