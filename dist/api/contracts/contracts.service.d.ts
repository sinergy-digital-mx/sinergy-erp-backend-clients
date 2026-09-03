import { Repository } from 'typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
import { ContractListFilters } from './contract-list-filters.util';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
export declare class ContractsService {
    private contractRepo;
    constructor(contractRepo: Repository<Contract>);
    create(tenantId: string, dto: CreateContractDto): Promise<Contract>;
    private computeFinancing;
    private generateContractNumber;
    findAll(tenantId: string, filters?: ContractListFilters, page?: number, limit?: number): Promise<any>;
    findOne(tenantId: string, id: string): Promise<any>;
    findByContractNumber(tenantId: string, contractNumber: string): Promise<any>;
    private enrichContractWithPaymentData;
    private fetchMonthlyPaidTotalsByContract;
    update(tenantId: string, id: string, dto: UpdateContractDto): Promise<Contract>;
    remove(tenantId: string, id: string): Promise<void>;
    getContractStats(tenantId: string, filters?: ContractListFilters): Promise<any>;
    private buildDownPaymentConfig;
}
