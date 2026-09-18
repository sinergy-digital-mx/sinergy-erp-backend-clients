import { Vendor } from '../../../entities/vendor/vendor.entity';
import { VendorSimilarMatch } from '../utils/vendor-profile.util';
export type VendorView = Vendor & {
    profile_completeness: number;
    looks_similar: boolean;
    similar_vendors: VendorSimilarMatch[];
};
export declare class DeleteVendorResultDto {
    action: 'deleted' | 'merged' | 'deactivated';
    vendor_id: string;
    merged_into?: {
        id: string;
        name: string;
    };
    purchase_orders_reassigned: number;
    message: string;
}
