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
exports.SalesOrderPaymentDocument = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const sales_order_payment_entity_1 = require("./sales-order-payment.entity");
const user_entity_1 = require("../users/user.entity");
let SalesOrderPaymentDocument = class SalesOrderPaymentDocument {
    id;
    tenant;
    tenant_id;
    payment;
    payment_id;
    file_name;
    s3_key;
    mime_type;
    file_size;
    notes;
    uploader;
    uploaded_by;
    created_at;
};
exports.SalesOrderPaymentDocument = SalesOrderPaymentDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesOrderPaymentDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], SalesOrderPaymentDocument.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderPaymentDocument.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_payment_entity_1.SalesOrderPayment, (payment) => payment.documents, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'payment_id' }),
    __metadata("design:type", sales_order_payment_entity_1.SalesOrderPayment)
], SalesOrderPaymentDocument.prototype, "payment", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderPaymentDocument.prototype, "payment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SalesOrderPaymentDocument.prototype, "file_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], SalesOrderPaymentDocument.prototype, "s3_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], SalesOrderPaymentDocument.prototype, "mime_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], SalesOrderPaymentDocument.prototype, "file_size", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], SalesOrderPaymentDocument.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by' }),
    __metadata("design:type", user_entity_1.User)
], SalesOrderPaymentDocument.prototype, "uploader", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesOrderPaymentDocument.prototype, "uploaded_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SalesOrderPaymentDocument.prototype, "created_at", void 0);
exports.SalesOrderPaymentDocument = SalesOrderPaymentDocument = __decorate([
    (0, typeorm_1.Entity)('inv_s_sales_order_payment_documents'),
    (0, typeorm_1.Index)('idx_so_pay_doc_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_so_pay_doc_payment', ['payment_id'])
], SalesOrderPaymentDocument);
//# sourceMappingURL=sales-order-payment-document.entity.js.map