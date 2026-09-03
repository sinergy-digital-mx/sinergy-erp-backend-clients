import { AddInventoryAuditLineDto } from './dto/add-inventory-audit-line.dto';
import { AuthorizeInventoryAuditDto } from './dto/authorize-inventory-audit.dto';
import { CancelInventoryAuditDto } from './dto/cancel-inventory-audit.dto';
import { CreateInventoryAuditDto } from './dto/create-inventory-audit.dto';
import { InventoryAuditContextQueryDto } from './dto/inventory-audit-context-query.dto';
import { InventoryAuditContextResponseDto, InventoryAuditListResponseDto, InventoryAuditResponseDto } from './dto/inventory-audit-response.dto';
import { QueryInventoryAuditDto } from './dto/query-inventory-audit.dto';
import { RejectInventoryAuditDto } from './dto/reject-inventory-audit.dto';
import { UpdateInventoryAuditLinesDto } from './dto/update-inventory-audit-lines.dto';
import { InventoryAuditService } from './services/inventory-audit.service';
export declare class InventoryAuditController {
    private readonly auditService;
    constructor(auditService: InventoryAuditService);
    getContext(query: InventoryAuditContextQueryDto, req: any): Promise<InventoryAuditContextResponseDto>;
    findAll(filters: QueryInventoryAuditDto, req: any): Promise<InventoryAuditListResponseDto>;
    findOne(id: string, req: any): Promise<InventoryAuditResponseDto>;
    create(dto: CreateInventoryAuditDto, req: any): Promise<InventoryAuditResponseDto>;
    updateLines(id: string, dto: UpdateInventoryAuditLinesDto, req: any): Promise<InventoryAuditResponseDto>;
    addLine(id: string, dto: AddInventoryAuditLineDto, req: any): Promise<InventoryAuditResponseDto>;
    submit(id: string, req: any): Promise<InventoryAuditResponseDto>;
    authorize(id: string, dto: AuthorizeInventoryAuditDto, req: any): Promise<InventoryAuditResponseDto>;
    reject(id: string, dto: RejectInventoryAuditDto, req: any): Promise<InventoryAuditResponseDto>;
    cancel(id: string, dto: CancelInventoryAuditDto, req: any): Promise<InventoryAuditResponseDto>;
}
