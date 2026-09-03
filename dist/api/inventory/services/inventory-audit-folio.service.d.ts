import { Repository } from 'typeorm';
import { InventoryAudit } from '../../../entities/inventory/inventory-audit.entity';
export declare class InventoryAuditFolioService {
    private readonly auditRepo;
    constructor(auditRepo: Repository<InventoryAudit>);
    generateFolio(tenantId: string): Promise<string>;
}
