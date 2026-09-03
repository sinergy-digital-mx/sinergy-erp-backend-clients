import { InventoryTransferService } from './services/inventory-transfer.service';
import { InventoryTransferPdfService } from './services/inventory-transfer-pdf.service';
import { CreateInventoryTransferDto } from './dto/create-inventory-transfer.dto';
import { QueryInventoryTransferDto } from './dto/query-inventory-transfer.dto';
import { TransferContextQueryDto } from './dto/transfer-context-query.dto';
import { InventoryTransferListResponseDto, InventoryTransferResponseDto } from './dto/inventory-transfer-response.dto';
import { TransferContextResponseDto } from './dto/transfer-context-response.dto';
export declare class InventoryTransferController {
    private readonly transferService;
    private readonly transferPdfService;
    constructor(transferService: InventoryTransferService, transferPdfService: InventoryTransferPdfService);
    getContext(query: TransferContextQueryDto, req: any): Promise<TransferContextResponseDto>;
    findAll(filters: QueryInventoryTransferDto, req: any): Promise<InventoryTransferListResponseDto>;
    downloadPdf(id: string, req: any, res: any): Promise<void>;
    findOne(id: string, req: any): Promise<InventoryTransferResponseDto>;
    create(dto: CreateInventoryTransferDto, req: any): Promise<InventoryTransferResponseDto>;
}
