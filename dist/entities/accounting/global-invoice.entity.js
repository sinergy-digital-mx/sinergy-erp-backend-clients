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
exports.GlobalInvoice = void 0;
const typeorm_1 = require("typeorm");
let GlobalInvoice = class GlobalInvoice {
    id;
    tenant_id;
    fiscal_configuration_id;
    billing_branch_id;
    period_year;
    period_month;
    status;
    active_key;
    electronic_invoice_id;
    created_by;
    process_folio;
    created_at;
    updated_at;
};
exports.GlobalInvoice = GlobalInvoice;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GlobalInvoice.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GlobalInvoice.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GlobalInvoice.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], GlobalInvoice.prototype, "billing_branch_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], GlobalInvoice.prototype, "period_year", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint' }),
    __metadata("design:type", Number)
], GlobalInvoice.prototype, "period_month", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], GlobalInvoice.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", Object)
], GlobalInvoice.prototype, "active_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], GlobalInvoice.prototype, "electronic_invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], GlobalInvoice.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", Object)
], GlobalInvoice.prototype, "process_folio", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], GlobalInvoice.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], GlobalInvoice.prototype, "updated_at", void 0);
exports.GlobalInvoice = GlobalInvoice = __decorate([
    (0, typeorm_1.Entity)('global_invoices'),
    (0, typeorm_1.Index)('idx_global_invoice_period', [
        'tenant_id',
        'fiscal_configuration_id',
        'period_year',
        'period_month',
    ]),
    (0, typeorm_1.Index)('idx_global_invoice_branch', [
        'tenant_id',
        'billing_branch_id',
        'period_year',
        'period_month',
    ]),
    (0, typeorm_1.Index)('uq_global_invoice_active', ['tenant_id', 'active_key'], { unique: true })
], GlobalInvoice);
//# sourceMappingURL=global-invoice.entity.js.map