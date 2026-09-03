import { TenantContextService } from '../rbac/services/tenant-context.service';
import { ContractsService } from './contracts.service';
import { ContractsExportService } from './contracts-export.service';
import { ContractPdfService } from './contract-pdf.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { QueryContractsDto } from './dto/query-contracts.dto';
export declare class ContractsController {
    private contractsService;
    private contractsExportService;
    private contractPdfService;
    private tenantContext;
    constructor(contractsService: ContractsService, contractsExportService: ContractsExportService, contractPdfService: ContractPdfService, tenantContext: TenantContextService);
    create(req: any, dto: CreateContractDto): Promise<import("../../entities/contracts/contract.entity").Contract>;
    findAll(req: any, query: QueryContractsDto): Promise<any>;
    getStats(req: any, query: QueryContractsDto): Promise<any>;
    findByNumber(contractNumber: string, req: any): Promise<any>;
    generatePdf(id: string, req: any, res: any): Promise<void>;
    findOne(id: string, req: any): Promise<any>;
    update(id: string, dto: UpdateContractDto, req: any): Promise<import("../../entities/contracts/contract.entity").Contract>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    exportToExcel(req: any, res: any, query: QueryContractsDto): Promise<void>;
    private toContractFilters;
}
