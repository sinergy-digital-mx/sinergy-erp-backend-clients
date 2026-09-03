import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';
export declare class TotalCalculatorService {
    private getEffectiveQuantity;
    calculateReceivedSubtotal(items: ReceivedItemDto[]): number;
    calculateReceivedIvaTotal(items: ReceivedItemDto[]): number;
    calculateReceivedIepsTotal(items: ReceivedItemDto[]): number;
    calculateReceivedTotal(items: ReceivedItemDto[]): number;
    private roundToCurrency;
}
