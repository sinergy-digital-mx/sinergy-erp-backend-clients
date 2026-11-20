import { TenantContextService } from '../rbac/services/tenant-context.service';
import { ContractsService } from './contracts.service';
import { ContractMonthlyIncomeService } from './contract-monthly-income.service';
import { ContractsExportService } from './contracts-export.service';
import { ContractPdfService } from './contract-pdf.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { QueryContractsDto } from './dto/query-contracts.dto';
import { QueryMonthlyIncomeDto } from './dto/query-monthly-income.dto';
export declare class ContractsController {
    private contractsService;
    private monthlyIncomeService;
    private contractsExportService;
    private contractPdfService;
    private tenantContext;
    constructor(contractsService: ContractsService, monthlyIncomeService: ContractMonthlyIncomeService, contractsExportService: ContractsExportService, contractPdfService: ContractPdfService, tenantContext: TenantContextService);
    create(req: any, dto: CreateContractDto): Promise<import("../../entities/contracts/contract.entity").Contract>;
    findAll(req: any, query: QueryContractsDto): Promise<any>;
    getStats(req: any, query: QueryContractsDto): Promise<any>;
    getMonthlyIncome(query: QueryMonthlyIncomeDto): Promise<import("./utils/contract-monthly-income.util").MonthlyIncomeAnalysis>;
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
