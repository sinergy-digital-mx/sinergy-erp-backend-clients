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
exports.QuotationDocument = void 0;
const typeorm_1 = require("typeorm");
const quotation_entity_1 = require("./quotation.entity");
const quotation_document_type_entity_1 = require("./quotation-document-type.entity");
const document_language_enum_1 = require("../../common/enums/document-language.enum");
const user_entity_1 = require("../users/user.entity");
let QuotationDocument = class QuotationDocument {
    id;
    quotation;
    quotation_id;
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
exports.QuotationDocument = QuotationDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuotationDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quotation_entity_1.Quotation, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'quotation_id' }),
    __metadata("design:type", quotation_entity_1.Quotation)
], QuotationDocument.prototype, "quotation", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuotationDocument.prototype, "quotation_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quotation_document_type_entity_1.QuotationDocumentType, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'document_type_id' }),
    __metadata("design:type", quotation_document_type_entity_1.QuotationDocumentType)
], QuotationDocument.prototype, "document_type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], QuotationDocument.prototype, "document_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], QuotationDocument.prototype, "file_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], QuotationDocument.prototype, "file_path", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], QuotationDocument.prototype, "file_size", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], QuotationDocument.prototype, "mime_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: document_language_enum_1.DocumentLanguage,
        default: document_language_enum_1.DocumentLanguage.ES,
    }),
    __metadata("design:type", String)
], QuotationDocument.prototype, "document_language", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by' }),
    __metadata("design:type", user_entity_1.User)
], QuotationDocument.prototype, "uploader", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuotationDocument.prototype, "uploaded_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], QuotationDocument.prototype, "created_at", void 0);
exports.QuotationDocument = QuotationDocument = __decorate([
    (0, typeorm_1.Entity)('inv_s_quotation_documents'),
    (0, typeorm_1.Index)('idx_qt_doc_quotation_id', ['quotation_id']),
    (0, typeorm_1.Index)('idx_qt_doc_type_id', ['document_type_id'])
], QuotationDocument);
//# sourceMappingURL=quotation-document.entity.js.map