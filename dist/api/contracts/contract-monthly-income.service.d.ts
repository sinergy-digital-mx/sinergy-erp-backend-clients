import { Repository } from 'typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
import { QueryMonthlyIncomeDto } from './dto/query-monthly-income.dto';
export declare class ContractMonthlyIncomeService {
    private readonly contractRepo;
    constructor(contractRepo: Repository<Contract>);
    getMonthlyIncome(tenantId: string, query: QueryMonthlyIncomeDto): Promise<import("./utils/contract-monthly-income.util").MonthlyIncomeAnalysis>;
    private monthRange;
    private loadPayments;
    private loadUnscheduled;
}
