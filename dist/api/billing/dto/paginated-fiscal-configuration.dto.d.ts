import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
export declare class PaginatedFiscalConfigurationDto {
    data: FiscalConfiguration[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
