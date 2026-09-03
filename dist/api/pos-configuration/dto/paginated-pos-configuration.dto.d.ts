import { PosConfiguration } from '../../../entities/billing/pos-configuration.entity';
export declare class PaginatedPosConfigurationDto {
    data: PosConfiguration[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
