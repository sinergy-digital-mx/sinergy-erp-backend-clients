import { VendorView } from './vendor-view.dto';
export declare class PaginatedVendorDto {
    data: VendorView[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
