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
exports.SalesOrderDocument = void 0;
const typeorm_1 = require("typeorm");
const sales_order_entity_1 = require("./sales-order.entity");
const sales_order_document_type_entity_1 = require("./sales-order-document-type.entity");
const document_language_enum_1 = require("../../common/enums/document-language.enum");
const user_entity_1 = require("../users/user.entity");
let SalesOrderDocument = class SalesOrderDocument {
    id;
    sales_order;
    sales_order_id;
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
exports.SalesOrderDocument = SalesOrderDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesOrderDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_entity_1.SalesOrder, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_order_id' }),
    __metadata("design:type", sales_order_entity_1.SalesOrder)
], SalesOrderDocument.prototype, "sales_order", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderDocument.prototype, "sales_order_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_document_type_entity_1.SalesOrderDocumentType, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'document_type_id' }),
    __metadata("design:type", sales_order_document_type_entity_1.SalesOrderDocumentType)
], SalesOrderDocument.prototype, "document_type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], SalesOrderDocument.prototype, "document_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], SalesOrderDocument.prototype, "file_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], SalesOrderDocument.prototype, "file_path", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], SalesOrderDocument.prototype, "file_size", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], SalesOrderDocument.prototype, "mime_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: document_language_enum_1.DocumentLanguage,
        default: document_language_enum_1.DocumentLanguage.ES,
    }),
    __metadata("design:type", String)
], SalesOrderDocument.prototype, "document_language", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by' }),
    __metadata("design:type", user_entity_1.User)
], SalesOrderDocument.prototype, "uploader", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderDocument.prototype, "uploaded_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SalesOrderDocument.prototype, "created_at", void 0);
exports.SalesOrderDocument = SalesOrderDocument = __decorate([
    (0, typeorm_1.Entity)('inv_s_sales_order_documents'),
    (0, typeorm_1.Index)('idx_so_doc_order_id', ['sales_order_id']),
    (0, typeorm_1.Index)('idx_so_doc_type_id', ['document_type_id'])
], SalesOrderDocument);
//# sourceMappingURL=sales-order-document.entity.js.map