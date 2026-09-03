import { Repository } from 'typeorm';
import { InventoryAuditLine } from '../../../entities/inventory/inventory-audit-line.entity';
import { InventoryTransferLine } from '../../../entities/inventory/inventory-transfer-line.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { SalesOrderBatchAllocation } from '../../../entities/sales-orders/sales-order-batch-allocation.entity';
import { User } from '../../../entities/users/user.entity';
import { InventoryBatchMovementDto } from '../dto/inventory-batch-movement.dto';
export declare class InventoryBatchMovementsService {
    private readonly batchRepo;
    private readonly transferLineRepo;
    private readonly auditLineRepo;
    private readonly allocationRepo;
    private readonly userRepo;
    constructor(batchRepo: Repository<InventoryBatch>, transferLineRepo: Repository<InventoryTransferLine>, auditLineRepo: Repository<InventoryAuditLine>, allocationRepo: Repository<SalesOrderBatchAllocation>, userRepo: Repository<User>);
    list(batchId: string, tenantId: string): Promise<{
        data: InventoryBatchMovementDto[];
        total: number;
    }>;
    listForLoadedBatch(batch: InventoryBatch): Promise<InventoryBatchMovementDto[]>;
    private buildOriginMovement;
    private movement;
}
