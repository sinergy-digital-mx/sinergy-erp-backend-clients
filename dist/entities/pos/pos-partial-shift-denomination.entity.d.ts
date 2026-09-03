import { PosPartialShift } from './pos-partial-shift.entity';
export declare class PosPartialShiftDenomination {
    id: string;
    partial_shift_id: string;
    partial_shift: PosPartialShift;
    currency: 'MXN' | 'USD';
    denomination: number;
    bill_count: number;
    amount: number;
}
