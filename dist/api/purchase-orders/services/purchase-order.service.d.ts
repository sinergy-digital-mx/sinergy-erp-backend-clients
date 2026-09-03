import { Repository, DataSource } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderPayment } from '../../../entities/purchase-orders/purchase-order-payment.entity';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
import { Vendor } from '../../../entities/vendor/vendor.entity';
import { CreatePurchaseOrderDto, CreateLineItemDto } from '../dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from '../dto/receive-purchase-order.dto';
import { UpdateLineItemDto } from '../dto/update-line-item.dto';
import { QueryPurchaseOrderDto } from '../dto/query-purchase-order.dto';
import { CreatePurchaseOrderPaymentDto } from '../dto/create-purchase-order-payment.dto';
import { UpdatePurchaseOrderNotesDto } from '../dto/update-purchase-order-notes.dto';
import { UpdatePurchaseOrderPedimentoDto } from '../dto/update-purchase-order-pedimento.dto';
import { UpdatePurchaseOrderRealCostDto } from '../dto/update-purchase-order-real-cost.dto';
import { PurchaseOrderRealCostService } from './purchase-order-real-cost.service';
import { UnitConversionService } from './unit-conversion.service';
import { BatchNumberGeneratorService } from './batch-number-generator.service';
import { FolioGeneratorService } from './folio-generator.service';
import { PurchaseOrderPdfService } from './purchase-order-pdf.service';
import { PurchaseOrderDocumentsService } from './purchase-order-documents.service';
import { PurchaseOrderLotsService } from './purchase-order-lots.service';
import { PurchaseOrderActivityService } from './purchase-order-activity.service';
import { PurchaseOrderDocumentLanguage } from '../../../entities/purchase-orders/purchase-order-document-language.enum';
type PurchaseOrderStatBucket = {
    count: number;
    amount: number;
};
type PurchaseOrderCurrencyStats = {
    count: number;
    amount: number;
    by_status: {
        Creada: PurchaseOrderStatBucket;
        Recibida: PurchaseOrderStatBucket;
        Cancelada: PurchaseOrderStatBucket;
    };
    by_payment: {
        Pagado: PurchaseOrderStatBucket;
        Pendiente: PurchaseOrderStatBucket;
    };
};
export type PurchaseOrderListStats = {
    count: number;
    by_currency: {
        MXN: PurchaseOrderCurrencyStats;
        USD: PurchaseOrderCurrencyStats;
    };
};
export declare class PurchaseOrderService {
    private readonly purchaseOrderBatchRepository;
    private readonly purchaseOrderDetailRepository;
    private readonly inventoryBatchRepository;
    private readonly purchaseOrderPaymentRepository;
    private readonly warehouseRepository;
    private readonly vendorRepository;
    private readonly unitConversionService;
    private readonly batchNumberGenerator;
    private readonly folioGenerator;
    private readonly pdfService;
    private readonly documentsService;
    private readonly lotsService;
    private readonly activityService;
    private readonly realCostService;
    private readonly dataSource;
    private static readonly DOC_TYPE_DOCUMENTO_ORIGINAL;
    private static readonly DOC_TYPE_RECEPCION;
    constructor(purchaseOrderBatchRepository: Repository<PurchaseOrderBatch>, purchaseOrderDetailRepository: Repository<PurchaseOrderBatchDetail>, inventoryBatchRepository: Repository<InventoryBatch>, purchaseOrderPaymentRepository: Repository<PurchaseOrderPayment>, warehouseRepository: Repository<Warehouse>, vendorRepository: Repository<Vendor>, unitConversionService: UnitConversionService, batchNumberGenerator: BatchNumberGeneratorService, folioGenerator: FolioGeneratorService, pdfService: PurchaseOrderPdfService, documentsService: PurchaseOrderDocumentsService, lotsService: PurchaseOrderLotsService, activityService: PurchaseOrderActivityService, realCostService: PurchaseOrderRealCostService, dataSource: DataSource);
    private deleteDocumentsByType;
    private normalizeCurrency;
    private throwMixedCurrency;
    private throwLineCurrencyMismatch;
    private findVendorCost;
    private resolvePurchaseOrderCurrency;
    private ensureVendorCostFromPoLine;
    private insertLineItemsForPurchaseOrder;
    create(dto: CreatePurchaseOrderDto, tenantId: string, userId: string): Promise<PurchaseOrderBatch>;
    private generateAndUploadPdf;
    findAll(tenantId: string, filters: QueryPurchaseOrderDto): Promise<{
        data: PurchaseOrderBatch[];
        total: number;
        stats: PurchaseOrderListStats;
    }>;
    findOne(id: string, tenantId: string): Promise<any>;
    private assertWarehouseMatchesFiscal;
    private mapLineItemForUi;
    private mapPurchaseOrderLocation;
    private withLotTree;
    private recordActivity;
    private scheduleDocumentoOriginalRegen;
    private getVendorOrFail;
    private normalizePedimento;
    private endOfDay;
    private applyListFilters;
    private emptyCurrencyStats;
    private roundMoney;
    private getListStats;
    private resolvePedimentoForVendor;
    private buildPaymentSummary;
    getPayments(id: string, tenantId: string): Promise<{
        payments: PurchaseOrderPayment[];
        summary: {
            amount_paid: number;
            amount_pending: number;
            payment_status: string;
            currency: string;
        };
    }>;
    private getPaymentsForOrder;
    createPayment(purchaseOrderId: string, dto: CreatePurchaseOrderPaymentDto, tenantId: string, userId: string): Promise<{
        payment: PurchaseOrderPayment;
        summary: {
            amount_paid: number;
            amount_pending: number;
            payment_status: string;
            currency: string;
        };
    }>;
    deletePayment(purchaseOrderId: string, paymentId: string, tenantId: string, userId: string): Promise<{
        success: true;
        id: string;
        summary: {
            amount_paid: number;
            amount_pending: number;
            payment_status: string;
            currency: string;
        };
    }>;
    receive(id: string, dto: ReceivePurchaseOrderDto, tenantId: string, userId: string): Promise<PurchaseOrderBatch>;
    updateNotes(id: string, dto: UpdatePurchaseOrderNotesDto, tenantId: string, userId: string): Promise<PurchaseOrderBatch>;
    updatePedimento(id: string, dto: UpdatePurchaseOrderPedimentoDto, tenantId: string, userId: string): Promise<PurchaseOrderBatch>;
    updateRealCost(id: string, dto: UpdatePurchaseOrderRealCostDto, tenantId: string, userId: string): Promise<any>;
    cancel(id: string, tenantId: string, userId: string): Promise<PurchaseOrderBatch>;
    replacePurchaseOrder(id: string, dto: CreatePurchaseOrderDto, tenantId: string, userId: string): Promise<PurchaseOrderBatch>;
    addLineItem(orderId: string, dto: CreateLineItemDto, tenantId: string, userId: string): Promise<PurchaseOrderBatch>;
    private computeRequestedTotalsFromLineItems;
    private persistRequestedTotalsWithRunner;
    private applyLineTaxesFromPercentages;
    updateLineItem(orderId: string, lineItemId: string, dto: UpdateLineItemDto, tenantId: string, userId: string): Promise<PurchaseOrderBatch>;
    removeLineItem(orderId: string, lineItemId: string, tenantId: string, userId: string): Promise<PurchaseOrderBatch>;
    regenerateDocumentoOriginal(id: string, tenantId: string, userId: string, language: PurchaseOrderDocumentLanguage, keepPrevious?: boolean): Promise<{
        success: boolean;
        message: string;
        document_language: PurchaseOrderDocumentLanguage;
        keep_previous: boolean;
    }>;
    regenerateDocumentoOriginalPreservingLanguage(id: string, tenantId: string, userId: string): Promise<{
        success: boolean;
        message: string;
        document_language: PurchaseOrderDocumentLanguage;
    }>;
    regenerateRecepcionDocument(id: string, tenantId: string, userId: string, language: PurchaseOrderDocumentLanguage, keepPrevious?: boolean): Promise<{
        success: boolean;
        message: string;
        document_language: PurchaseOrderDocumentLanguage;
        keep_previous: boolean;
    }>;
}
export {};
