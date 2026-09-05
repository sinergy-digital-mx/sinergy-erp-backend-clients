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
exports.SalesOrderInvoiceEmail = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("../users/user.entity");
const sales_order_entity_1 = require("./sales-order.entity");
let SalesOrderInvoiceEmail = class SalesOrderInvoiceEmail {
    id;
    tenant;
    tenant_id;
    sales_order;
    sales_order_id;
    invoice_id;
    to_email;
    cc;
    subject;
    message;
    sender;
    sent_by;
    sent_at;
};
exports.SalesOrderInvoiceEmail = SalesOrderInvoiceEmail;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesOrderInvoiceEmail.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], SalesOrderInvoiceEmail.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderInvoiceEmail.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_entity_1.SalesOrder, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'sales_order_id' }),
    __metadata("design:type", sales_order_entity_1.SalesOrder)
], SalesOrderInvoiceEmail.prototype, "sales_order", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalesOrderInvoiceEmail.prototype, "sales_order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], SalesOrderInvoiceEmail.prototype, "invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], SalesOrderInvoiceEmail.prototype, "to_email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], SalesOrderInvoiceEmail.prototype, "cc", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], SalesOrderInvoiceEmail.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], SalesOrderInvoiceEmail.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'sent_by' }),
    __metadata("design:type", Object)
], SalesOrderInvoiceEmail.prototype, "sender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], SalesOrderInvoiceEmail.prototype, "sent_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SalesOrderInvoiceEmail.prototype, "sent_at", void 0);
exports.SalesOrderInvoiceEmail = SalesOrderInvoiceEmail = __decorate([
    (0, typeorm_1.Entity)('inv_s_sales_order_invoice_emails'),
    (0, typeorm_1.Index)('idx_so_invoice_email_order', ['sales_order_id']),
    (0, typeorm_1.Index)('idx_so_invoice_email_invoice', ['invoice_id']),
    (0, typeorm_1.Index)('idx_so_invoice_email_tenant', ['tenant_id'])
], SalesOrderInvoiceEmail);
//# sourceMappingURL=sales-order-invoice-email.entity.js.map