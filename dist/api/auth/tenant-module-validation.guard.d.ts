import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TenantModule, Module } from '../../entities/rbac';
export declare class TenantModuleValidationGuard implements CanActivate {
    private readonly tenantModuleRepository;
    private readonly moduleRepository;
    constructor(tenantModuleRepository: Repository<TenantModule>, moduleRepository: Repository<Module>);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getModuleCodeFromRoute;
}
