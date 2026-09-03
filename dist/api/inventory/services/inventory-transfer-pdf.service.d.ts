import { InventoryTransferService } from './inventory-transfer.service';
export declare class InventoryTransferPdfService {
    private readonly transferService;
    private readonly fonts;
    constructor(transferService: InventoryTransferService);
    generatePdf(id: string, tenantId: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    private render;
    private buildHeader;
    private buildTitleBar;
    private buildMetaCards;
    private buildRouteSection;
    private buildProductSection;
    private buildLinesSection;
    private buildNotes;
    private buildFooterNote;
    private metaCell;
    private warehouseTitle;
    private warehouseDetails;
    private isUuid;
    private formatQty;
    private formatDateTime;
    private statusLabel;
}
