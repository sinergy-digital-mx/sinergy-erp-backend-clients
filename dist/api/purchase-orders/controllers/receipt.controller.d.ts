import { ReceiptService } from '../services/receipt.service';
import { ReceivePurchaseOrderDto } from '../dto';
export declare class ReceiptController {
    private readonly receiptService;
    constructor(receiptService: ReceiptService);
    receive(id: string, dto: ReceivePurchaseOrderDto, req: any): Promise<import("../../../entities/purchase-orders").PurchaseOrderBatch>;
}
