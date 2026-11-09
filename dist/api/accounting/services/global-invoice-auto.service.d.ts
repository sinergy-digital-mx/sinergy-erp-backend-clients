import { Repository } from 'typeorm';
import { BillingBranch } from '../../../entities/billing/billing-branch.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { GlobalInvoiceAutoRun } from '../../../entities/accounting/global-invoice-auto-run.entity';
import { GlobalInvoiceService } from './global-invoice.service';
export declare class GlobalInvoiceAutoService {
    private readonly fiscalRepo;
    private readonly branchRepo;
    private readonly runRepo;
    private readonly globalInvoiceService;
    private readonly logger;
    private running;
    constructor(fiscalRepo: Repository<FiscalConfiguration>, branchRepo: Repository<BillingBranch>, runRepo: Repository<GlobalInvoiceAutoRun>, globalInvoiceService: GlobalInvoiceService);
    handleAutomaticStamp(): Promise<void>;
    runDue(now?: Date): Promise<void>;
    private runBranch;
    private claim;
    private nextFolio;
    private isDuplicate;
}
