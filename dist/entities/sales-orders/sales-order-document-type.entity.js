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
exports.SalesOrderDocumentType = void 0;
const typeorm_1 = require("typeorm");
let SalesOrderDocumentType = class SalesOrderDocumentType {
    id;
    name;
    description;
    created_at;
};
exports.SalesOrderDocumentType = SalesOrderDocumentType;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SalesOrderDocumentType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], SalesOrderDocumentType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], SalesOrderDocumentType.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SalesOrderDocumentType.prototype, "created_at", void 0);
exports.SalesOrderDocumentType = SalesOrderDocumentType = __decorate([
    (0, typeorm_1.Entity)('inv_s_sales_order_document_types'),
    (0, typeorm_1.Index)('uq_so_doc_type_name', ['name'], { unique: true })
], SalesOrderDocumentType);
//# sourceMappingURL=sales-order-document-type.entity.js.map