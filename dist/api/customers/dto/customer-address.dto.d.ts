export declare class CreateCustomerAddressDto {
    type: string;
    street_address: string;
    street_address_2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    is_primary?: boolean;
    latitude?: number;
    longitude?: number;
    notes?: string;
    address_source?: string;
}
export declare class UpdateCustomerAddressDto {
    type?: string;
    street_address?: string;
    street_address_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    is_primary?: boolean;
    latitude?: number | null;
    longitude?: number | null;
    notes?: string;
    address_source?: string;
    status?: number;
}
