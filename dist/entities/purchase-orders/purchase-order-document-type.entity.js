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
exports.PurchaseOrderDocumentType = void 0;
const typeorm_1 = require("typeorm");
let PurchaseOrderDocumentType = class PurchaseOrderDocumentType {
    id;
    name;
    description;
    created_at;
};
exports.PurchaseOrderDocumentType = PurchaseOrderDocumentType;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PurchaseOrderDocumentType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], PurchaseOrderDocumentType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], PurchaseOrderDocumentType.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PurchaseOrderDocumentType.prototype, "created_at", void 0);
exports.PurchaseOrderDocumentType = PurchaseOrderDocumentType = __decorate([
    (0, typeorm_1.Entity)('inv_s_purchase_order_document_types'),
    (0, typeorm_1.Index)('name_index', ['name'], { unique: true })
], PurchaseOrderDocumentType);
//# sourceMappingURL=purchase-order-document-type.entity.js.map