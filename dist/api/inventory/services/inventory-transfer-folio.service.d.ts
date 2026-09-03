import { Repository } from 'typeorm';
import { InventoryTransfer } from '../../../entities/inventory/inventory-transfer.entity';
export declare class InventoryTransferFolioService {
    private readonly transferRepo;
    constructor(transferRepo: Repository<InventoryTransfer>);
    generateFolio(tenantId: string): Promise<string>;
}
