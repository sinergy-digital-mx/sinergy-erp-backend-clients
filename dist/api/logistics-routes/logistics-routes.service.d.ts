import { Repository } from 'typeorm';
import { LogisticsRoute } from '../../entities/logistics/logistics-route.entity';
import { Module } from '../../entities/rbac/module.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { UpsertLogisticsRouteDto } from './dto/logistics-route.dto';
export declare class LogisticsRoutesService {
    private readonly routes;
    private readonly modules;
    private readonly tenantModules;
    constructor(routes: Repository<LogisticsRoute>, modules: Repository<Module>, tenantModules: Repository<TenantModule>);
    isEnabled(tenantId: string): Promise<boolean>;
    setEnabled(tenantId: string, enabled: boolean): Promise<boolean>;
    list(tenantId: string, activeOnly?: boolean): Promise<LogisticsRoute[]>;
    create(tenantId: string, dto: UpsertLogisticsRouteDto): Promise<LogisticsRoute>;
    update(tenantId: string, id: string, dto: UpsertLogisticsRouteDto): Promise<LogisticsRoute>;
    deactivate(tenantId: string, id: string): Promise<LogisticsRoute>;
    assertActive(tenantId: string, routeId: string | null | undefined): Promise<void>;
    private assertEnabled;
    private isMissingTable;
    private isDuplicate;
}
