import { VendorType } from '../../../entities/vendor/vendor-type.enum';
import { VendorBankingDto } from './vendor-banking.dto';
export declare class CreateVendorDto extends VendorBankingDto {
    vendor_type: VendorType;
    name: string;
    company_name?: string;
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    rfc?: string;
    razon_social?: string;
    persona_type?: string;
    tax_id?: string;
    legal_name?: string;
    status?: string;
    credit_days?: number;
    credit_limit?: string;
}
