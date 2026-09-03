import { Repository } from 'typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
import { ContractListFilters } from './contract-list-filters.util';
export declare class ContractsExportService {
    private contractRepo;
    constructor(contractRepo: Repository<Contract>);
    exportToExcel(tenantId: string, filters?: ContractListFilters): Promise<Buffer>;
    private formatDate;
    private addStatRow;
    private addStatRowWithDetails;
    private calculateFilteredStats;
}
