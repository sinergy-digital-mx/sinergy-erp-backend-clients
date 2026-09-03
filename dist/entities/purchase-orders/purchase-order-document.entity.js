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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderDocument = void 0;
const typeorm_1 = require("typeorm");
const purchase_order_batch_entity_1 = require("./purchase-order-batch.entity");
const purchase_order_document_type_entity_1 = require("./purchase-order-document-type.entity");
const purchase_order_document_language_enum_1 = require("./purchase-order-document-language.enum");
const user_entity_1 = require("../users/user.entity");
let PurchaseOrderDocument = class PurchaseOrderDocument {
    id;
    purchase_order_batch;
    purchase_order_batch_id;
    document_type;
    document_type_id;
    file_name;
    file_path;
    file_size;
    mime_type;
    document_language;
    uploader;
    uploaded_by;
    created_at;
};
exports.PurchaseOrderDocument = PurchaseOrderDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PurchaseOrderDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_order_batch_entity_1.PurchaseOrderBatch, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_order_batch_id' }),
    __metadata("design:type", purchase_order_batch_entity_1.PurchaseOrderBatch)
], PurchaseOrderDocument.prototype, "purchase_order_batch", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchaseOrderDocument.prototype, "purchase_order_batch_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_order_document_type_entity_1.PurchaseOrderDocumentType, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'document_type_id' }),
    __metadata("design:type", purchase_order_document_type_entity_1.PurchaseOrderDocumentType)
], PurchaseOrderDocument.prototype, "document_type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PurchaseOrderDocument.prototype, "document_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], PurchaseOrderDocument.prototype, "file_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], PurchaseOrderDocument.prototype, "file_path", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], PurchaseOrderDocument.prototype, "file_size", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], PurchaseOrderDocument.prototype, "mime_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: purchase_order_document_language_enum_1.PurchaseOrderDocumentLanguage,
        default: purchase_order_document_language_enum_1.PurchaseOrderDocumentLanguage.ES,
    }),
    __metadata("design:type", String)
], PurchaseOrderDocument.prototype, "document_language", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by' }),
    __metadata("design:type", user_entity_1.User)
], PurchaseOrderDocument.prototype, "uploader", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchaseOrderDocument.prototype, "uploaded_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PurchaseOrderDocument.prototype, "created_at", void 0);
exports.PurchaseOrderDocument = PurchaseOrderDocument = __decorate([
    (0, typeorm_1.Entity)('inv_s_purchase_order_documents'),
    (0, typeorm_1.Index)('idx_po_batch_id', ['purchase_order_batch_id']),
    (0, typeorm_1.Index)('idx_doc_type_id', ['document_type_id'])
], PurchaseOrderDocument);
//# sourceMappingURL=purchase-order-document.entity.js.map