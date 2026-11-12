import { Repository } from 'typeorm';
import { SalesOrderCreationSettings } from '../../../entities/sales-orders/sales-order-creation-settings.entity';
import { SalesOrderCreationFields } from '../utils/sales-order-creation-settings.util';
export declare class SalesOrderCreationSettingsService {
    private readonly repo;
    constructor(repo: Repository<SalesOrderCreationSettings>);
    get(tenantId: string): Promise<{
        fields: SalesOrderCreationFields;
    }>;
    update(tenantId: string, userId: string, rawFields: unknown): Promise<{
        fields: SalesOrderCreationFields;
    }>;
    private isMissingTable;
}
