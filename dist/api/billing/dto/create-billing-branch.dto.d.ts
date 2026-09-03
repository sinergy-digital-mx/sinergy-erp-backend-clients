import { BranchWarehouseDto } from './branch-warehouse.dto';
export declare class CreateBillingBranchDto {
    name?: string;
    code?: string;
    prefix?: string | null;
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    phone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    status?: number;
    warehouses?: BranchWarehouseDto[];
}
