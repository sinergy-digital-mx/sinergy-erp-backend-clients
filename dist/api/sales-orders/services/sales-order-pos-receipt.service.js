"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SalesOrderPosReceiptService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesOrderPosReceiptService = exports.SALES_ORDER_TICKET_RECIBO_NAMES = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const s3_service_1 = require("../../../common/services/s3.service");
const document_language_enum_1 = require("../../../common/enums/document-language.enum");
const public_invoice_code_util_1 = require("../../../common/utils/public-invoice-code.util");
const sales_order_entity_1 = require("../../../entities/sales-orders/sales-order.entity");
const pos_sale_collection_entity_1 = require("../../../entities/pos/pos-sale-collection.entity");
const pos_sale_payment_method_enum_1 = require("../../../entities/pos/pos-sale-payment-method.enum");
const billing_branch_entity_1 = require("../../../entities/billing/billing-branch.entity");
const sales_order_documents_service_1 = require("./sales-order-documents.service");
const sales_order_document_type_entity_1 = require("../../../entities/sales-orders/sales-order-document-type.entity");
const escpos_util_1 = require("../utils/escpos.util");
exports.SALES_ORDER_TICKET_RECIBO_NAMES = ['TICKET / RECIBO', 'TICKET_RECIBO'];
let SalesOrderPosReceiptService = SalesOrderPosReceiptService_1 = class SalesOrderPosReceiptService {
    salesOrderRepo;
    collectionRepo;
    billingBranchRepo;
    documentTypeRepo;
    documentsService;
    s3Service;
    configService;
    logger = new common_1.Logger(SalesOrderPosReceiptService_1.name);
    ticketDocumentTypeIdCache = null;
    constructor(salesOrderRepo, collectionRepo, billingBranchRepo, documentTypeRepo, documentsService, s3Service, configService) {
        this.salesOrderRepo = salesOrderRepo;
        this.collectionRepo = collectionRepo;
        this.billingBranchRepo = billingBranchRepo;
        this.documentTypeRepo = documentTypeRepo;
        this.documentsService = documentsService;
        this.s3Service = s3Service;
        this.configService = configService;
    }
    async generateAndSavePosTicket(tenantId, salesOrderId, uploadedBy) {
        const { order, collection } = await this.loadReceiptContext(tenantId, salesOrderId);
        const billingBranchId = order.billing_branch_id ?? order.warehouse?.billing_branch_id ?? null;
        const billingBranch = billingBranchId
            ? await this.billingBranchRepo.findOne({
                where: { id: billingBranchId },
            })
            : null;
        const publicInvoiceCode = await this.ensurePublicInvoiceCode(order, billingBranch);
        const selfInvoiceUrl = this.buildPortalUrl(publicInvoiceCode, order.customer?.email);
        const plainText = this.buildPlainTextReceipt(order, collection, billingBranch, publicInvoiceCode, selfInvoiceUrl);
        const escposBuffer = this.buildEscPosReceipt(plainText);
        const fileName = `TICKET_RECIBO-${order.folio}.escpos`;
        const s3Key = await this.s3Service.uploadEntityFile(tenantId, 'sales_orders', order.id, 'TICKET_RECIBO', escposBuffer, fileName, 'application/octet-stream');
        await this.deleteExistingTickets(salesOrderId);
        const ticketDocumentTypeId = await this.resolveTicketDocumentTypeId();
        const document = await this.documentsService.uploadDocument(salesOrderId, ticketDocumentTypeId, fileName, s3Key, escposBuffer.length, 'application/octet-stream', uploadedBy, document_language_enum_1.DocumentLanguage.ES);
        let downloadUrl = null;
        try {
            downloadUrl = await this.s3Service.getSignedUrl(s3Key, 3600);
        }
        catch (error) {
            this.logger.warn(`No se pudo firmar URL del ticket ${salesOrderId}: ${error}`);
        }
        return this.buildReceiptResult(escposBuffer, plainText, document.id, fileName, downloadUrl, publicInvoiceCode, selfInvoiceUrl);
    }
    async getPosTicketRawBuffer(tenantId, salesOrderId) {
        const order = await this.salesOrderRepo.findOne({
            where: { id: salesOrderId, tenant_id: tenantId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Orden de venta no encontrada');
        }
        const ticketDoc = await this.findExistingTicket(salesOrderId);
        if (!ticketDoc) {
            throw new common_1.NotFoundException('Ticket de recibo no generado para esta orden');
        }
        const buffer = await this.s3Service.getFileBuffer(ticketDoc.file_path);
        return { buffer, fileName: ticketDoc.document_name };
    }
    async getPosTicket(tenantId, salesOrderId) {
        const order = await this.salesOrderRepo.findOne({
            where: { id: salesOrderId, tenant_id: tenantId },
            relations: ['customer'],
        });
        if (!order) {
            throw new common_1.NotFoundException('Orden de venta no encontrada');
        }
        const ticketDoc = await this.findExistingTicket(salesOrderId);
        if (!ticketDoc) {
            throw new common_1.NotFoundException('Ticket de recibo no generado para esta orden');
        }
        return this.buildReceiptResultFromDocument(order, ticketDoc);
    }
    async reprintPosTicket(tenantId, salesOrderId) {
        return this.getPosTicket(tenantId, salesOrderId);
    }
    async regeneratePosTicket(tenantId, salesOrderId, uploadedBy) {
        this.logger.warn(`[TEMP] Regenerando ticket POS ${salesOrderId} por usuario ${uploadedBy}`);
        return this.generateAndSavePosTicket(tenantId, salesOrderId, uploadedBy);
    }
    buildReceiptResult(escposBuffer, plainText, documentId, fileName, downloadUrl, publicInvoiceCode = null, selfInvoiceUrl = null) {
        const escposHex = (0, escpos_util_1.bufferToEscPosHex)(escposBuffer);
        return {
            document_id: documentId,
            file_name: fileName,
            mime_type: 'application/octet-stream',
            download_url: downloadUrl,
            escpos_base64: escposBuffer.toString('base64'),
            escpos_hex: escposHex,
            plain_text: this.stripStyleMarkers(plainText),
            printer_profile: 'bixolon-srp-330iii-escpos-80mm',
            print_mode: 'raw_escpos_base64',
            public_invoice_code: publicInvoiceCode,
            self_invoice_url: selfInvoiceUrl,
            qz_raw_config: {
                type: 'raw',
                format: 'command',
                flavor: 'hex',
                data: escposHex,
            },
        };
    }
    async buildReceiptResultFromDocument(order, ticketDoc) {
        const publicInvoiceCode = order.public_invoice_code ?? null;
        const selfInvoiceUrl = publicInvoiceCode
            ? this.buildPortalUrl(publicInvoiceCode, order.customer?.email)
            : null;
        let plainText = '';
        try {
            const buffer = await this.s3Service.getFileBuffer(ticketDoc.file_path);
            plainText = this.extractPlainTextFromEscPos(buffer);
            return this.buildReceiptResult(buffer, plainText, ticketDoc.id, ticketDoc.document_name, ticketDoc.path ?? null, publicInvoiceCode, selfInvoiceUrl);
        }
        catch (error) {
            this.logger.warn(`Error leyendo ticket ${order.id}: ${error}`);
        }
        return this.buildReceiptResult(Buffer.alloc(0), plainText, ticketDoc.id, ticketDoc.document_name, ticketDoc.path ?? null, publicInvoiceCode, selfInvoiceUrl);
    }
    async findExistingTicket(salesOrderId) {
        const documents = await this.documentsService.getDocuments(salesOrderId);
        const ticketTypeId = await this.resolveTicketDocumentTypeId();
        return (documents.find((doc) => Number(doc.document_type_id) === ticketTypeId) ??
            documents.find((doc) => exports.SALES_ORDER_TICKET_RECIBO_NAMES.includes(doc.document_type_name)) ??
            null);
    }
    async resolveTicketDocumentTypeId() {
        if (this.ticketDocumentTypeIdCache != null) {
            return this.ticketDocumentTypeIdCache;
        }
        for (const name of exports.SALES_ORDER_TICKET_RECIBO_NAMES) {
            const found = await this.documentTypeRepo.findOne({ where: { name } });
            if (found) {
                this.ticketDocumentTypeIdCache = found.id;
                return found.id;
            }
        }
        const created = await this.documentTypeRepo.save(this.documentTypeRepo.create({
            name: 'TICKET / RECIBO',
            description: 'Ticket térmico ESC/POS de cobro POS',
        }));
        this.ticketDocumentTypeIdCache = created.id;
        this.logger.log(`Tipo de documento TICKET / RECIBO creado con id ${created.id}`);
        return created.id;
    }
    async loadReceiptContext(tenantId, salesOrderId) {
        const order = await this.salesOrderRepo
            .createQueryBuilder('so')
            .where('so.id = :id AND so.tenant_id = :tenantId', { id: salesOrderId, tenantId })
            .leftJoinAndSelect('so.fiscal_configuration', 'fiscal_configuration')
            .leftJoinAndSelect('so.billing_branch', 'billing_branch')
            .leftJoinAndSelect('so.warehouse', 'warehouse')
            .leftJoinAndSelect('so.customer', 'customer')
            .leftJoinAndSelect('so.seller_user', 'seller_user')
            .leftJoinAndSelect('so.collected_by_user', 'collected_by_user')
            .leftJoinAndSelect('so.line_items', 'line_items')
            .leftJoinAndSelect('line_items.product', 'product')
            .leftJoinAndSelect('line_items.product_uom', 'product_uom')
            .leftJoinAndSelect('product_uom.uom', 'uom')
            .leftJoinAndSelect('line_items.product_discount', 'product_discount')
            .leftJoinAndSelect('so.global_discount', 'global_discount')
            .getOne();
        if (!order) {
            throw new common_1.NotFoundException('Orden de venta no encontrada');
        }
        const collection = await this.collectionRepo.findOne({
            where: { sales_order_id: salesOrderId },
            relations: ['collected_by_user'],
        });
        if (!collection) {
            throw new common_1.NotFoundException('Cobro no encontrado para generar ticket');
        }
        return { order, collection };
    }
    async deleteExistingTickets(salesOrderId) {
        const documents = await this.documentsService.getDocuments(salesOrderId);
        const ticketTypeId = await this.resolveTicketDocumentTypeId();
        for (const doc of documents) {
            const isTicket = Number(doc.document_type_id) === ticketTypeId ||
                exports.SALES_ORDER_TICKET_RECIBO_NAMES.includes(doc.document_type_name);
            if (isTicket) {
                await this.documentsService.deleteDocument(doc.id);
            }
        }
    }
    buildPlainTextReceipt(order, collection, billingBranch, publicInvoiceCode, selfInvoiceUrl) {
        const lines = [];
        const fiscal = order.fiscal_configuration;
        const businessName = order.fiscal_razon_social || fiscal?.razon_social || 'EMPRESA';
        const rfc = fiscal?.rfc ?? '';
        const address = this.formatBranchAddress(billingBranch, order);
        const soldAt = collection.created_at ?? order.updated_at ?? new Date();
        lines.push(`!H!${businessName.toUpperCase()}`);
        if (rfc)
            lines.push(`!H!${rfc}`);
        lines.push(`!C!${this.formatDateTime(soldAt)}`);
        if (address) {
            for (const addressLine of (0, escpos_util_1.wrapLines)(address.toUpperCase(), escpos_util_1.ESCPOS_CHARS_PER_LINE)) {
                lines.push(`!S!${addressLine}`);
            }
        }
        const branchPhone = this.formatBranchPhone(billingBranch);
        if (branchPhone) {
            lines.push(`!S!TEL: ${branchPhone.toUpperCase()}`);
        }
        lines.push('');
        lines.push(`!N!${(0, escpos_util_1.productLine)('DESCRIPCION', 'CANT.', 'PRECIO', 'TOTAL', escpos_util_1.ESCPOS_CHARS_PER_LINE)}`);
        let totalQty = 0;
        let subtotalBeforeDiscount = 0;
        let totalLineDiscountAmount = 0;
        for (const item of order.line_items ?? []) {
            const qty = Number(item.quantity) || 0;
            const unitPrice = Number(item.unit_price) || 0;
            const discountUnit = Number(item.discount_unit) || 0;
            const lineSubtotal = qty * unitPrice;
            const lineDiscount = discountUnit * qty;
            const lineTotal = lineSubtotal - lineDiscount;
            totalQty += qty;
            subtotalBeforeDiscount += lineSubtotal;
            totalLineDiscountAmount += lineDiscount;
            const description = (item.product?.name ?? 'PRODUCTO').toUpperCase();
            lines.push(`!N!${(0, escpos_util_1.productLine)(description, this.formatQuantity(qty), (0, escpos_util_1.formatUnitMoney)(unitPrice), (0, escpos_util_1.formatMoney)(lineTotal), escpos_util_1.ESCPOS_CHARS_PER_LINE)}`);
            if (lineDiscount > 0) {
                const discountLabel = item.product_discount?.name
                    ? `DESC PROD: ${item.product_discount.name.toUpperCase()}`
                    : 'DESCUENTO PRODUCTO';
                lines.push(`!N!${(0, escpos_util_1.compactMoneyLine)(`  ${discountLabel}`, `-${(0, escpos_util_1.formatMoney)(lineDiscount)}`)}`);
            }
        }
        const globalDiscountAmount = Number(order.global_discount_amount) || 0;
        const orderTotal = Number(collection.order_total_mxn) || Number(order.total) || 0;
        const lineCount = order.line_items?.length ?? 0;
        lines.push('');
        lines.push(`!N!${(0, escpos_util_1.compactMoneyLine)('Subtotal:', (0, escpos_util_1.formatMoney)(subtotalBeforeDiscount))}`);
        lines.push(`!N!${(0, escpos_util_1.compactMoneyLine)('Descuento:', `-${(0, escpos_util_1.formatMoney)(totalLineDiscountAmount + globalDiscountAmount)}`)}`);
        if (totalLineDiscountAmount > 0) {
            lines.push(`!N!${(0, escpos_util_1.compactMoneyLine)('  Desc. por producto:', `-${(0, escpos_util_1.formatMoney)(totalLineDiscountAmount)}`)}`);
        }
        if (globalDiscountAmount > 0) {
            const globalLabel = order.global_discount?.name
                ? `Desc. global (${order.global_discount.name})`
                : 'Desc. global';
            lines.push(`!N!${(0, escpos_util_1.compactMoneyLine)(`  ${globalLabel}:`, `-${(0, escpos_util_1.formatMoney)(globalDiscountAmount)}`)}`);
        }
        lines.push(`!N!${(0, escpos_util_1.compactMoneyLine)('IVA:', (0, escpos_util_1.formatMoney)(Number(order.iva_total) || 0))}`);
        lines.push(`!N!${(0, escpos_util_1.compactMoneyLine)('Total:', (0, escpos_util_1.formatMoney)(orderTotal))}`);
        lines.push(`!N!${'-'.repeat(escpos_util_1.ESCPOS_CHARS_PER_LINE)}`);
        lines.push(...this.buildPaymentLines(collection).map((line) => `!N!${line}`));
        lines.push(`!N!${'-'.repeat(escpos_util_1.ESCPOS_CHARS_PER_LINE)}`);
        lines.push(`!N!${(0, escpos_util_1.twoColumnLine)(`Renglones: ${lineCount}`, `Cantidad: ${this.formatQuantity(totalQty)}`)}`);
        lines.push('');
        this.pushFooterLines(lines, 'No. Caja:', '1');
        this.pushFooterLines(lines, 'Recibo No:', publicInvoiceCode);
        this.pushFooterLines(lines, 'Por:', 'RECIBO AL PUBLICO EN GENERAL');
        this.pushFooterLines(lines, 'Cajero(a):', this.formatUserName(collection.collected_by_user));
        this.pushFooterLines(lines, 'Lo atendio:', this.formatUserName(order.seller_user));
        this.pushFooterLines(lines, 'Cliente:', this.formatCustomerName(order));
        lines.push('');
        lines.push('!CB!GRACIAS POR SU PREFERENCIA !!!');
        lines.push('!CB!REVISE SU CAMBIO Y SU MERCANCIA');
        lines.push('!CB!NO HAY CAMBIOS NI DEVOLUCIONES');
        lines.push('');
        lines.push('!CB!FACTURA TU COMPRA');
        lines.push('!C!Escanea el QR o entra a:');
        for (const part of (0, escpos_util_1.wrapLines)(selfInvoiceUrl, escpos_util_1.ESCPOS_CHARS_PER_LINE)) {
            lines.push(`!S!${part}`);
        }
        lines.push(`!QR!${selfInvoiceUrl}`);
        lines.push(`!C!Folio: ${publicInvoiceCode}`);
        return lines.join('\n');
    }
    pushFooterLines(lines, label, value) {
        for (const part of (0, escpos_util_1.leftLabelLines)(label, value)) {
            lines.push(`!N!${part}`);
        }
    }
    buildEscPosReceipt(plainText) {
        const builder = new escpos_util_1.EscPosBuilder().initialize();
        for (const rawLine of plainText.split('\n')) {
            if (!rawLine) {
                builder.textLine('');
                continue;
            }
            const { style, text } = this.parseStyleLine(rawLine);
            switch (style) {
                case 'H':
                    builder
                        .align('center')
                        .selectFontA()
                        .characterSizeDouble()
                        .bold(true)
                        .textLine(text)
                        .bold(false)
                        .characterSizeNormal()
                        .align('left');
                    break;
                case 'S':
                    builder
                        .align('center')
                        .selectFontB()
                        .characterSizeNormal()
                        .bold(false)
                        .textLine(text)
                        .selectFontA()
                        .align('left');
                    break;
                case 'C':
                    builder
                        .align('center')
                        .selectFontA()
                        .characterSizeNormal()
                        .bold(false)
                        .textLine(text)
                        .align('left');
                    break;
                case 'CB':
                    builder
                        .align('center')
                        .selectFontA()
                        .characterSizeNormal()
                        .bold(true)
                        .textLine(text)
                        .bold(false)
                        .align('left');
                    break;
                case 'QR':
                    if (text) {
                        builder.align('center').qr(text, 5).textLine('').align('left');
                    }
                    break;
                default:
                    builder.align('left').selectFontA().characterSizeNormal().bold(false).textLine(text);
            }
        }
        return builder.cut(true).build();
    }
    parseStyleLine(line) {
        const match = line.match(/^!([A-Z]+)!(.*)$/);
        if (match) {
            return { style: match[1], text: match[2] };
        }
        return { style: 'N', text: line };
    }
    stripStyleMarkers(text) {
        return text.replace(/^![A-Z]+!/gm, '');
    }
    buildPaymentLines(collection) {
        const lines = [];
        const cashMxn = Number(collection.amount_cash_mxn) || 0;
        const cashUsd = Number(collection.amount_cash_usd) || 0;
        const transferMxn = Number(collection.amount_transfer_mxn) || 0;
        const cardMxn = Number(collection.amount_card_mxn) || 0;
        const changeMxn = Number(collection.change_cash_mxn) || 0;
        const changeUsd = Number(collection.change_cash_usd) || 0;
        const receivedMxn = Number(collection.received_cash_mxn) || (cashMxn > 0 ? cashMxn + changeMxn : 0);
        const receivedUsd = Number(collection.received_cash_usd) || (cashUsd > 0 ? cashUsd + changeUsd : 0);
        lines.push((0, escpos_util_1.compactMoneyLine)('Recibido Pesos:', (0, escpos_util_1.formatMoney)(receivedMxn)));
        lines.push((0, escpos_util_1.compactMoneyLine)('Recibido Dolares:', (0, escpos_util_1.formatUsd)(receivedUsd)));
        if (collection.payment_method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.CARD && cardMxn > 0) {
            lines.push((0, escpos_util_1.compactMoneyLine)('Tarjeta:', (0, escpos_util_1.formatMoney)(cardMxn)));
        }
        else if (collection.payment_method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.TRANSFER && transferMxn > 0) {
            lines.push((0, escpos_util_1.compactMoneyLine)('Transferencia:', (0, escpos_util_1.formatMoney)(transferMxn)));
        }
        else if (collection.payment_method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.CREDIT) {
            const creditMxn = Number(collection.amount_credit_mxn) || 0;
            if (creditMxn > 0) {
                lines.push((0, escpos_util_1.compactMoneyLine)('Credito:', (0, escpos_util_1.formatMoney)(creditMxn)));
            }
        }
        else if (collection.payment_method === pos_sale_payment_method_enum_1.PosSalePaymentMethod.MIXED) {
            if (transferMxn > 0)
                lines.push((0, escpos_util_1.compactMoneyLine)('Transferencia:', (0, escpos_util_1.formatMoney)(transferMxn)));
            if (cardMxn > 0)
                lines.push((0, escpos_util_1.compactMoneyLine)('Tarjeta:', (0, escpos_util_1.formatMoney)(cardMxn)));
        }
        lines.push((0, escpos_util_1.compactMoneyLine)('Cambio Pesos:', (0, escpos_util_1.formatMoney)(changeMxn)));
        lines.push((0, escpos_util_1.compactMoneyLine)('Cambio Dolares:', (0, escpos_util_1.formatUsd)(changeUsd)));
        return lines;
    }
    formatBranchAddress(billingBranch, order) {
        if (billingBranch) {
            return [billingBranch.address, billingBranch.city, billingBranch.state]
                .filter(Boolean)
                .join(', ');
        }
        const warehouse = order.warehouse;
        if (!warehouse)
            return '';
        return [warehouse.street, warehouse.city, warehouse.state].filter(Boolean).join(', ');
    }
    formatBranchPhone(billingBranch) {
        const phone = billingBranch?.phone?.trim();
        return phone || '';
    }
    formatCustomerName(order) {
        const customer = order.customer;
        if (!customer)
            return 'MOSTRADOR';
        if (customer.company_name)
            return customer.company_name.toUpperCase();
        const fullName = [customer.name, customer.lastname].filter(Boolean).join(' ').trim();
        if (fullName)
            return fullName.toUpperCase();
        if (customer.fiscal_razon_social)
            return customer.fiscal_razon_social.toUpperCase();
        return 'MOSTRADOR';
    }
    formatUserName(user) {
        if (!user)
            return 'N/A';
        return [user.first_name, user.last_name].filter(Boolean).join(' ').trim().toUpperCase() || 'N/A';
    }
    formatDateTime(date) {
        return new Intl.DateTimeFormat('es-MX', {
            timeZone: 'America/Tijuana',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).format(new Date(date));
    }
    formatQuantity(value) {
        return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/\.?0+$/, '');
    }
    async ensurePublicInvoiceCode(order, billingBranch) {
        if (order.public_invoice_code) {
            return order.public_invoice_code;
        }
        const fiscal = order.fiscal_configuration;
        let code = (0, public_invoice_code_util_1.buildPublicInvoiceCode)(fiscal?.prefix, billingBranch?.prefix, order.folio, order.fiscal_razon_social || fiscal?.razon_social, billingBranch?.code || billingBranch?.city);
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                await this.salesOrderRepo.update({ id: order.id }, { public_invoice_code: code });
                order.public_invoice_code = code;
                return code;
            }
            catch (error) {
                if (!this.isUniqueViolation(error)) {
                    throw error;
                }
                code = (0, public_invoice_code_util_1.withCollisionSuffix)(code, order.id);
            }
        }
        throw new Error(`No se pudo asignar folio público al recibo ${order.folio}`);
    }
    buildPortalUrl(publicInvoiceCode, email) {
        const base = this.configService.get('SELF_INVOICE_PORTAL_BASE_URL');
        const usableEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? email.trim() : null;
        return (0, public_invoice_code_util_1.buildSelfInvoicePortalUrl)(publicInvoiceCode, usableEmail, base);
    }
    isUniqueViolation(error) {
        if (error instanceof typeorm_2.QueryFailedError) {
            const driver = error.driverError;
            return driver?.errno === 1062 || driver?.code === 'ER_DUP_ENTRY';
        }
        return false;
    }
    extractPlainTextFromEscPos(buffer) {
        return buffer
            .toString('latin1')
            .replace(/\x1b./g, '')
            .replace(/\x1d./g, '')
            .replace(/[^\x20-\x7E\n\r]/g, '')
            .trim();
    }
};
exports.SalesOrderPosReceiptService = SalesOrderPosReceiptService;
exports.SalesOrderPosReceiptService = SalesOrderPosReceiptService = SalesOrderPosReceiptService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sales_order_entity_1.SalesOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(pos_sale_collection_entity_1.PosSaleCollection)),
    __param(2, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(3, (0, typeorm_1.InjectRepository)(sales_order_document_type_entity_1.SalesOrderDocumentType)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        sales_order_documents_service_1.SalesOrderDocumentsService,
        s3_service_1.S3Service,
        config_1.ConfigService])
], SalesOrderPosReceiptService);
//# sourceMappingURL=sales-order-pos-receipt.service.js.map