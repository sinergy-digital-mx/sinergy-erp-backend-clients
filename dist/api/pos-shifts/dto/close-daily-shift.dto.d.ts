import { PartialShiftDenominationDto } from './create-partial-shift.dto';
export declare class CloseDailyShiftDto {
    closing_cash_mxn: number;
    closing_cash_usd?: number;
    denominations?: PartialShiftDenominationDto[];
    notes?: string;
}
