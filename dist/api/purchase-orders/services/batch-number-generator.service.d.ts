import { EntityManager, Repository } from 'typeorm';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
type LotSeries = {
    series: string;
    fiscalPrefix: string;
    branchPrefix: string;
    warehousePrefix: string;
};
export declare class BatchNumberGeneratorService {
    private readonly warehouseRepository;
    private readonly inventoryBatchRepository;
    constructor(warehouseRepository: Repository<Warehouse>, inventoryBatchRepository: Repository<InventoryBatch>);
    resolveLotSeries(warehouseId: string, organizationId: string, manager?: EntityManager): Promise<LotSeries>;
    getNextSequentialNumber(warehouseId: string, tenantId: string, manager?: EntityManager): Promise<number>;
    generateBatchNumber(warehouseId: string, tenantId: string, manager?: EntityManager): Promise<string>;
    private asLotSegment;
}
export {};
