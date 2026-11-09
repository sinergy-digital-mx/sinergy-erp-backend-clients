import { Repository } from 'typeorm';
import { BillingBranch } from '../../../entities/billing/billing-branch.entity';
import { GlobalInvoice } from '../../../entities/accounting/global-invoice.entity';
import { GlobalInvoiceOrder } from '../../../entities/accounting/global-invoice-order.entity';
import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { PosSaleCollection } from '../../../entities/pos/pos-sale-collection.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderPayment } from '../../../entities/sales-orders/sales-order-payment.entity';
import { ElectronicInvoiceService } from '../../electronic-invoicing/services/electronic-invoice.service';
import { CreateGlobalInvoiceDto } from '../dto/query-global-invoice.dto';
import { PublicInvoicePolicyView } from '../utils/public-invoice-policy.util';
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
    process_folio: string | null;
}
export interface GlobalInvoiceBranchOption {
    id: string;
    label: string;
    fiscal_configuration_id: string;
}
export interface GlobalInvoicePage {
    month: string;
    period_label: string;
    branches: GlobalInvoiceBranchOption[];
    billing_branch_id: string | null;
    fiscal_configuration_id: string | null;
    invoice: GlobalInvoiceCard | null;
    cancelled_invoice: GlobalInvoiceCard | null;
    orders: GlobalInvoiceOrderRow[];
    orders_count: number;
    orders_total: number | null;
    currency: string | null;
    can_generate: boolean;
    blocked_reason: string | null;
    policy: PublicInvoicePolicyView | null;
}
export declare class GlobalInvoiceService {
    private readonly globalRepo;
    private readonly linkRepo;
    private readonly salesOrderRepo;
    private readonly paymentRepo;
    private readonly collectionRepo;
    private readonly branchRepo;
    private readonly invoiceRepo;
    private readonly electronicInvoiceService;
    private readonly logger;
    constructor(globalRepo: Repository<GlobalInvoice>, linkRepo: Repository<GlobalInvoiceOrder>, salesOrderRepo: Repository<SalesOrder>, paymentRepo: Repository<SalesOrderPayment>, collectionRepo: Repository<PosSaleCollection>, branchRepo: Repository<BillingBranch>, invoiceRepo: Repository<ElectronicInvoice>, electronicInvoiceService: ElectronicInvoiceService);
    get(tenantId: string, month: string, billingBranchId?: string): Promise<GlobalInvoicePage>;
    generate(tenantId: string, userId: string | null, dto: CreateGlobalInvoiceDto, options?: {
        processFolio?: string;
    }): Promise<GlobalInvoicePage>;
    stampAutomaticBranch(tenantId: string, billingBranchId: string, month: string, processFolio: string, environment: 'demo' | 'production'): Promise<'stamped' | 'empty' | 'already_open'>;
    cancel(id: string, tenantId: string, userId: string): Promise<GlobalInvoicePage>;
    private periodOrFail;
    private findOpen;
    private findLegacyOpen;
    private releaseStalePending;
    private settlePending;
    private loadUninvoicedOrders;
    private loadLinkedOrders;
    private loadOrderEntities;
    private toRows;
    private paymentSnapshots;
    private assertSelection;
    private singleCurrency;
    private exchangeRate;
    private lugarExpedicion;
    private nextFolio;
    private listBranches;
    private branchOptions;
    private branchLabel;
    private emptyPage;
    private branchIdOfInvoice;
    private conceptLines;
    private toCard;
    private appendProcessNote;
    private isDuplicate;
}
