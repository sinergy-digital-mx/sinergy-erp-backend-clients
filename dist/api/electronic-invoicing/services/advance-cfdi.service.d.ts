import { Repository } from 'typeorm';
import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { ElectronicInvoiceService } from './electronic-invoice.service';
import { AdvanceInvoiceRole, AdvanceParty, MerchandiseLineInput } from '../utils/advance-cfdi.util';
import { StampAdvanceInvoiceDto } from '../dto/stamp-advance-invoice.dto';
export interface AdvanceDocumentContext {
    sourceModule: 'quotations' | 'sales_orders';
    sourceId: string;
    folio: string;
    subtotal: number;
    discountTotal: number;
    globalDiscount: number;
    ivaTotal: number;
    fiscalConfigurationId: string;
    series?: string | null;
    emisor: AdvanceParty;
    receptor: AdvanceParty;
    lines?: MerchandiseLineInput[];
}
export interface AdvanceInvoiceSummary {
    id: string;
    uuid: string | null;
    folio: string | null;
    subtotal: number;
    total: number;
    stamp_status: string;
    sat_status: string | null;
    invoice_role: AdvanceInvoiceRole;
    applied: boolean;
    merchandise_invoice_id: string | null;
    application_invoice_id: string | null;
}
export declare class AdvanceCfdiService {
    private readonly invoiceRepo;
    private readonly electronicInvoiceService;
    constructor(invoiceRepo: Repository<ElectronicInvoice>, electronicInvoiceService: ElectronicInvoiceService);
    findVigenteAdvance(tenantId: string, sourceModule: 'quotations' | 'sales_orders', sourceId: string): Promise<ElectronicInvoice | null>;
    summarize(tenantId: string, invoice: ElectronicInvoice | null): Promise<AdvanceInvoiceSummary | null>;
    stampAdvance(tenantId: string, userId: string, document: AdvanceDocumentContext, dto: StampAdvanceInvoiceDto): Promise<ElectronicInvoice>;
    applyToSalesOrder(tenantId: string, userId: string, document: AdvanceDocumentContext & {
        lines: MerchandiseLineInput[];
    }, advance: ElectronicInvoice, dto: {
        uso_cfdi?: string;
        uso_cfdi_aplicacion?: string;
        forma_pago?: string;
        metodo_pago?: 'PUE' | 'PPD';
        regimen_fiscal_receptor: string;
        series?: string;
        environment?: 'demo' | 'production';
    }): Promise<{
        merchandise: ElectronicInvoice;
        application: ElectronicInvoice;
    }>;
    assertAdvanceCancellable(tenantId: string, invoice: ElectronicInvoice): Promise<void>;
    private rateFromInvoice;
}
