import { Repository } from 'typeorm';
import { BillingBranch } from '../../../entities/billing/billing-branch.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { GlobalInvoice } from '../../../entities/accounting/global-invoice.entity';
import { GlobalInvoiceOrder } from '../../../entities/accounting/global-invoice-order.entity';
import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { PosSaleCollection } from '../../../entities/pos/pos-sale-collection.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderPayment } from '../../../entities/sales-orders/sales-order-payment.entity';
import { ElectronicInvoiceService } from '../../electronic-invoicing/services/electronic-invoice.service';
import { CreateGlobalInvoiceDto } from '../dto/query-global-invoice.dto';
export interface GlobalInvoiceOrderRow {
    id: string;
    folio: string;
    created_at: string;
    customer_name: string;
    company_name: string | null;
    branch_label: string | null;
    general_status: string;
    payment_status: string;
    currency: string;
    subtotal: number;
    iva_total: number;
    ieps_total: number;
    discount_total: number;
    total: number;
    payment_method: string | null;
    payment_method_label: string | null;
    payment_breakdown_label: string | null;
    payment_lines: Array<{
        method: string;
        label: string;
        amount_mxn: number;
        amount_usd: number;
    }>;
}
export interface GlobalInvoiceCard {
    id: string;
    status: GlobalInvoice['status'];
    electronic_invoice_id: string | null;
    series: string | null;
    folio: string | null;
    uuid: string | null;
    subtotal: number;
    total: number;
    currency: string;
    stamp_status: string | null;
    sat_status: string | null;
    can_cancel: boolean;
}
export interface GlobalInvoicePage {
    month: string;
    period_label: string;
    fiscal_configurations: Array<{
        id: string;
        razon_social: string;
        rfc: string;
    }>;
    fiscal_configuration_id: string | null;
    invoice: GlobalInvoiceCard | null;
    cancelled_invoice: GlobalInvoiceCard | null;
    orders: GlobalInvoiceOrderRow[];
    orders_count: number;
    orders_total: number | null;
    currency: string | null;
    can_generate: boolean;
    blocked_reason: string | null;
}
export declare class GlobalInvoiceService {
    private readonly globalRepo;
    private readonly linkRepo;
    private readonly salesOrderRepo;
    private readonly paymentRepo;
    private readonly collectionRepo;
    private readonly fiscalRepo;
    private readonly branchRepo;
    private readonly invoiceRepo;
    private readonly electronicInvoiceService;
    constructor(globalRepo: Repository<GlobalInvoice>, linkRepo: Repository<GlobalInvoiceOrder>, salesOrderRepo: Repository<SalesOrder>, paymentRepo: Repository<SalesOrderPayment>, collectionRepo: Repository<PosSaleCollection>, fiscalRepo: Repository<FiscalConfiguration>, branchRepo: Repository<BillingBranch>, invoiceRepo: Repository<ElectronicInvoice>, electronicInvoiceService: ElectronicInvoiceService);
    get(tenantId: string, month: string, fiscalConfigurationId?: string): Promise<GlobalInvoicePage>;
    generate(tenantId: string, userId: string, dto: CreateGlobalInvoiceDto): Promise<GlobalInvoicePage>;
    cancel(id: string, tenantId: string, userId: string): Promise<GlobalInvoicePage>;
    private periodOrFail;
    private findOpen;
    private releaseStalePending;
    private loadUninvoicedOrders;
    private loadLinkedOrders;
    private loadOrderEntities;
    private toRows;
    private paymentSnapshots;
    private assertSelection;
    private singleCurrency;
    private exchangeRate;
    private lugarExpedicion;
    private conceptLines;
    private toCard;
    private isDuplicate;
}
