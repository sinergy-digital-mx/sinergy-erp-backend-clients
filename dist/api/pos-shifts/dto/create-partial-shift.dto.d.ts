export declare class PartialShiftDenominationDto {
    currency: 'MXN' | 'USD';
    denomination: number;
    bill_count: number;
}
export declare class CreatePartialShiftDto {
    denominations: PartialShiftDenominationDto[];
    notes?: string;
    performed_by_user_id?: string;
}
