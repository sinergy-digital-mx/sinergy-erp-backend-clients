import { Repository } from 'typeorm';
import { Customer } from '../../../entities/customers/customer.entity';
import { CustomerCredit } from '../../../entities/customers/customer-credit.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderPayment } from '../../../entities/sales-orders/sales-order-payment.entity';
import { UpsertCustomerCreditItemDto } from '../dto/upsert-customer-credit.dto';
import { CustomerCreditFiscalSnapshot, CustomerCreditSnapshot } from '../utils/customer-credit.util';
export declare class CustomerCreditService {
    private readonly creditRepo;
    private readonly fiscalRepo;
    private readonly salesOrderRepo;
    private readonly paymentRepo;
    constructor(creditRepo: Repository<CustomerCredit>, fiscalRepo: Repository<FiscalConfiguration>, salesOrderRepo: Repository<SalesOrder>, paymentRepo: Repository<SalesOrderPayment>);
    listForCustomer(customer: Customer): Promise<CustomerCreditFiscalSnapshot[]>;
    getSnapshotForFiscal(customer: Customer, fiscalConfigurationId: string): Promise<CustomerCreditSnapshot>;
    getUsedCredit(tenantId: string, customerId: number, fiscalConfigurationId: string): Promise<number>;
    getEnabledByFiscalMap(tenantId: string, pairs: Array<{
        customerId: number;
        fiscalConfigurationId: string;
    }>): Promise<Map<string, boolean>>;
    upsertForAllActiveFiscales(customer: Customer, patch: {
        credit_enabled: boolean;
        credit_days?: number | null;
        credit_amount?: number | null;
    }): Promise<CustomerCreditFiscalSnapshot[]>;
    upsertMany(customer: Customer, items: UpsertCustomerCreditItemDto[]): Promise<CustomerCreditFiscalSnapshot[]>;
    private assertCreditItem;
    private toFiscalSnapshot;
    private getUsedByFiscal;
}
