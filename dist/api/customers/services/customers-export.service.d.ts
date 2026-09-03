import { Repository } from 'typeorm';
import { Customer } from '../../../entities/customers/customer.entity';
import { CustomerCredit } from '../../../entities/customers/customer-credit.entity';
import { QueryCustomersExportDto } from '../dto/query-customers-export.dto';
export declare class CustomersExportService {
    private readonly customerRepo;
    private readonly creditRepo;
    private readonly columns;
    constructor(customerRepo: Repository<Customer>, creditRepo: Repository<CustomerCredit>);
    exportCustomers(tenantId: string, filters: QueryCustomersExportDto): Promise<Buffer>;
    getFilename(): string;
    private loadCreditSummaries;
    private fetchCustomers;
    private formatPhone;
    private describeFilters;
}
