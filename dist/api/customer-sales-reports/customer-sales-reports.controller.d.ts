import { QueryCustomerSalesReportDto } from './dto/query-customer-sales-report.dto';
import { CustomerSalesReportsService } from './customer-sales-reports.service';
export declare class CustomerSalesReportsController {
    private readonly customerSalesReportsService;
    constructor(customerSalesReportsService: CustomerSalesReportsService);
    getTopCustomers(query: QueryCustomerSalesReportDto, req: any): Promise<import("./customer-sales-reports.service").CustomerSalesReportResponse>;
    exportTopCustomersExcel(query: QueryCustomerSalesReportDto, req: any, res: any): Promise<void>;
}
