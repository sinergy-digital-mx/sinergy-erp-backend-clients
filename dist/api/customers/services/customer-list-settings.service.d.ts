import { Repository } from 'typeorm';
import { CustomerListSettings as CustomerListSettingsRow } from '../../../entities/customers/customer-list-settings.entity';
import { CustomerListSettings } from '../utils/customer-list-settings.util';
export declare class CustomerListSettingsService {
    private readonly repo;
    constructor(repo: Repository<CustomerListSettingsRow>);
    get(tenantId: string): Promise<CustomerListSettings>;
    update(tenantId: string, userId: string, raw: unknown): Promise<CustomerListSettings>;
    private isMissingTable;
}
