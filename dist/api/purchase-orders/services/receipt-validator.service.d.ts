import { Repository } from 'typeorm';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';
export declare class ReceiptValidatorService {
    private readonly purchaseOrderDetailRepository;
    constructor(purchaseOrderDetailRepository: Repository<PurchaseOrderBatchDetail>);
    validateReceivedItems(items: ReceivedItemDto[]): Promise<void>;
    private assertValidMeasure;
}
