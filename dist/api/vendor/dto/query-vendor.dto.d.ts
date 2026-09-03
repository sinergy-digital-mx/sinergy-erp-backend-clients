import { VendorType } from '../../../entities/vendor/vendor-type.enum';
export declare class QueryVendorDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    state?: string;
    country?: string;
    vendor_type?: VendorType;
}
