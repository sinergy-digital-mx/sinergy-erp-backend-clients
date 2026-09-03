import { PurchaseOrderDocumentsService } from '../services/purchase-order-documents.service';
import { PurchaseOrderService } from '../services/purchase-order.service';
export declare class PurchaseOrderDocumentsController {
    private readonly documentsService;
    private readonly purchaseOrderService;
    constructor(documentsService: PurchaseOrderDocumentsService, purchaseOrderService: PurchaseOrderService);
    uploadDocument(orderId: string, file: Express.Multer.File, documentTypeId: string, req: any): Promise<{
        message: string;
        data: import("../../../entities/purchase-orders").PurchaseOrderDocument;
    }>;
    getDocuments(orderId: string, req: any): Promise<{
        data: any[];
        total: number;
    }>;
    deleteDocument(documentId: string): Promise<{
        message: string;
    }>;
    getDocumentTypes(): Promise<{
        data: import("../../../entities/purchase-orders").PurchaseOrderDocumentType[];
        total: number;
    }>;
}
