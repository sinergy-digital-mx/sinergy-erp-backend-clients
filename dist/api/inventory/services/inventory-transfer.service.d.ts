import { DataSource, Repository } from 'typeorm';
import { InventoryTransfer } from '../../../entities/inventory/inventory-transfer.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
import { BatchNumberGeneratorService } from '../../purchase-orders/services/batch-number-generator.service';
import { InventoryTransferFolioService } from './inventory-transfer-folio.service';
import { InventoryService } from '../inventory.service';
import { CreateInventoryTransferDto } from '../dto/create-inventory-transfer.dto';
import { QueryInventoryTransferDto } from '../dto/query-inventory-transfer.dto';
import { InventoryTransferListResponseDto, InventoryTransferResponseDto } from '../dto/inventory-transfer-response.dto';
import { TransferContextResponseDto } from '../dto/transfer-context-response.dto';
export declare class InventoryTransferService {
    private readonly transferRepo;
    private readonly batchRepo;
    private readonly warehouseRepo;
    private readonly folioService;
    private readonly batchNumberGenerator;
    private readonly inventoryService;
    private readonly dataSource;
    private readonly logger;
    constructor(transferRepo: Repository<InventoryTransfer>, batchRepo: Repository<InventoryBatch>, warehouseRepo: Repository<Warehouse>, folioService: InventoryTransferFolioService, batchNumberGenerator: BatchNumberGeneratorService, inventoryService: InventoryService, dataSource: DataSource);
    getTransferContext(tenantId: string, productId: string, warehouseId: string): Promise<TransferContextResponseDto>;
    create(dto: CreateInventoryTransferDto, tenantId: string, userId: string): Promise<InventoryTransferResponseDto>;
    findAll(tenantId: string, filters: QueryInventoryTransferDto): Promise<InventoryTransferListResponseDto>;
    findById(id: string, tenantId: string): Promise<InventoryTransferResponseDto>;
    private mapToResponseDto;
    private filterDestinationTree;
    private mapWarehouseSummary;
}
