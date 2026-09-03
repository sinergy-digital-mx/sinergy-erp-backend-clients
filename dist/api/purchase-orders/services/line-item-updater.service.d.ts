import { Repository } from 'typeorm';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';
export declare class LineItemUpdaterService {
    private readonly lineItemRepository;
    constructor(lineItemRepository: Repository<PurchaseOrderBatchDetail>);
    updateLineItemWithReceivedData(lineItemId: string, receivedItem: ReceivedItemDto, convertedQuantity: number, baseUomId: string, userId: string): Promise<void>;
}
