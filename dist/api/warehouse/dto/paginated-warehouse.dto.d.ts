import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
export declare class PaginatedWarehouseDto {
    data: Warehouse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
