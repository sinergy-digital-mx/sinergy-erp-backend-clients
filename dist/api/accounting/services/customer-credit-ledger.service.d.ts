import { Repository } from 'typeorm';
import { CustomerCreditLedger } from '../../../entities/accounting/customer-credit-ledger.entity';
export declare class CustomerCreditLedgerService {
    private readonly ledgerRepo;
    constructor(ledgerRepo: Repository<CustomerCreditLedger>);
    recordCredit(input: {
        tenantId: string;
        customerId: number;
        fiscalConfigurationId: string;
        currency: string;
        amount: number;
        salesOrderId: string;
        electronicInvoiceId: string;
        notes?: string | null;
        userId: string | null;
    }): Promise<void>;
    reverseCredit(input: {
        tenantId: string;
        electronicInvoiceId: string;
        userId: string | null;
    }): Promise<void>;
    private currency;
}
