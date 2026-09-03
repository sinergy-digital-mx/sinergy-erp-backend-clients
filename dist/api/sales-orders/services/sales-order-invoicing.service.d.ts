import { Repository } from 'typeorm';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { Customer } from '../../../entities/customers/customer.entity';
import { ElectronicInvoiceService } from '../../electronic-invoicing/services/electronic-invoice.service';
import { CancelElectronicInvoiceDto } from '../../electronic-invoicing/dto/cancel-electronic-invoice.dto';
import { StampSalesOrderInvoiceDto } from '../dto/stamp-sales-order-invoice.dto';
export declare class SalesOrderInvoicingService {
    private readonly salesOrderRepo;
    private readonly customerRepo;
    private readonly electronicInvoiceService;
    constructor(salesOrderRepo: Repository<SalesOrder>, customerRepo: Repository<Customer>, electronicInvoiceService: ElectronicInvoiceService);
    listInvoices(salesOrderId: string, tenantId: string): Promise<import("../../../entities/electronic-invoicing").ElectronicInvoice[]>;
    stampInvoice(salesOrderId: string, tenantId: string, userId: string, dto: StampSalesOrderInvoiceDto): Promise<import("../../../entities/electronic-invoicing").ElectronicInvoice>;
    cancelInvoice(salesOrderId: string, invoiceId: string, tenantId: string, userId: string, dto: CancelElectronicInvoiceDto): Promise<import("../../../entities/electronic-invoicing").ElectronicInvoice>;
    syncInvoiceSat(salesOrderId: string, invoiceId: string, tenantId: string, userId: string): Promise<import("../../../entities/electronic-invoicing").ElectronicInvoice>;
    getInvoicePdf(salesOrderId: string, invoiceId: string, tenantId: string, regenerate?: boolean, preview?: boolean): Promise<import("../../electronic-invoicing/services/electronic-invoice-pdf.service").ElectronicInvoicePdfUploadResult>;
    getInvoiceXml(salesOrderId: string, invoiceId: string, tenantId: string): Promise<{
        xml: string;
        fileName: string;
    }>;
    private buildXmlPlaceholder;
    private getSalesOrderOrFail;
    private getSalesOrderWithRelations;
}
