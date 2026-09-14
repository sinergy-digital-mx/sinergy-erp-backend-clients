import { PurchaseOrderService } from '../services/purchase-order.service';
import { PurchaseOrderDocumentsService } from '../services/purchase-order-documents.service';
import { PurchaseOrderExportService } from '../services/purchase-order-export.service';
import { PurchaseOrderMovementsService } from '../services/purchase-order-movements.service';
import { CreatePurchaseOrderDto, CreateLineItemDto, ReceivePurchaseOrderDto, UpdateLineItemDto, QueryPurchaseOrderDto, CreatePurchaseOrderPaymentDto, RegenerateDocumentDto, UpdatePurchaseOrderNotesDto, UpdatePurchaseOrderPedimentoDto, UpdatePurchaseOrderRealCostDto, QueryPurchaseOrderHeaderExportDto, QueryPurchaseOrderDetailExportDto } from '../dto';
export declare class PurchaseOrderController {
    private readonly purchaseOrderService;
    private readonly documentsService;
    private readonly exportService;
    private readonly movementsService;
    constructor(purchaseOrderService: PurchaseOrderService, documentsService: PurchaseOrderDocumentsService, exportService: PurchaseOrderExportService, movementsService: PurchaseOrderMovementsService);
    create(dto: CreatePurchaseOrderDto, req: any): Promise<import("../../../entities/purchase-orders").PurchaseOrderBatch>;
    findAll(filters: QueryPurchaseOrderDto, req: any): Promise<{
        data: import("../../../entities/purchase-orders").PurchaseOrderBatch[];
        total: number;
        stats: import("../services/purchase-order.service").PurchaseOrderListStats;
    }>;
    exportHeadersExcel(filters: QueryPurchaseOrderHeaderExportDto, req: any, res: any): Promise<void>;
    exportDetailsExcel(filters: QueryPurchaseOrderDetailExportDto, req: any, res: any): Promise<void>;
    receive(id: string, dto: ReceivePurchaseOrderDto, req: any): Promise<import("../../../entities/purchase-orders").PurchaseOrderBatch>;
    addLineItem(id: string, dto: CreateLineItemDto, req: any): Promise<import("../../../entities/purchase-orders").PurchaseOrderBatch>;
    getPayments(id: string, req: any): Promise<{
        payments: import("../../../entities/purchase-orders").PurchaseOrderPayment[];
        summary: {
            amount_paid: number;
            amount_pending: number;
            payment_status: string;
            currency: string;
        };
    }>;
    getMovements(id: string, req: any): Promise<{
        data: import("../services/purchase-order-movements.service").PurchaseOrderMovement[];
        total: number;
    }>;
    createPayment(id: string, dto: CreatePurchaseOrderPaymentDto, req: any): Promise<{
        payment: import("../../../entities/purchase-orders").PurchaseOrderPayment;
        summary: {
            amount_paid: number;
            amount_pending: number;
            payment_status: string;
            currency: string;
        };
    }>;
    deletePayment(id: string, paymentId: string, req: any): Promise<{
        success: true;
        id: string;
        summary: {
            amount_paid: number;
            amount_pending: number;
            payment_status: string;
            currency: string;
        };
    }>;
    regenerateDocumentoOriginal(id: string, dto: RegenerateDocumentDto, req: any): Promise<{
        success: boolean;
        message: string;
        document_language: import("../../../common/enums/document-language.enum").DocumentLanguage;
        keep_previous: boolean;
    }>;
    regenerateRecepcion(id: string, dto: RegenerateDocumentDto, req: any): Promise<{
        success: boolean;
        message: string;
        document_language: import("../../../common/enums/document-language.enum").DocumentLanguage;
        keep_previous: boolean;
    }>;
    updateLineItem(orderId: string, lineItemId: string, dto: UpdateLineItemDto, req: any): Promise<import("../../../entities/purchase-orders").PurchaseOrderBatch>;
    removeLineItem(orderId: string, lineItemId: string, req: any): Promise<import("../../../entities/purchase-orders").PurchaseOrderBatch>;
    updateNotes(id: string, dto: UpdatePurchaseOrderNotesDto, req: any): Promise<import("../../../entities/purchase-orders").PurchaseOrderBatch>;
    updatePedimento(id: string, dto: UpdatePurchaseOrderPedimentoDto, req: any): Promise<import("../../../entities/purchase-orders").PurchaseOrderBatch>;
    updateRealCost(id: string, dto: UpdatePurchaseOrderRealCostDto, req: any): Promise<any>;
    replacePurchaseOrderPut(id: string, dto: CreatePurchaseOrderDto, req: any): Promise<import("../../../entities/purchase-orders").PurchaseOrderBatch>;
    replacePurchaseOrderPatch(id: string, dto: CreatePurchaseOrderDto, req: any): Promise<import("../../../entities/purchase-orders").PurchaseOrderBatch>;
    private runReplacePurchaseOrder;
    cancel(id: string, req: any): Promise<import("../../../entities/purchase-orders").PurchaseOrderBatch>;
    findOne(id: string, req: any): Promise<{
        data: {
            header: any;
            products: any;
            batches: any;
            batches_summary: any;
            documents: any[];
            payments: import("../../../entities/purchase-orders").PurchaseOrderPayment[];
            payments_summary: {
                amount_paid: number;
                amount_pending: number;
                payment_status: string;
                currency: string;
            };
            movements: import("../services/purchase-order-movements.service").PurchaseOrderMovement[];
            movements_count: number;
        };
    }>;
}
