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
exports.GlobalInvoiceAutoRun = void 0;
const typeorm_1 = require("typeorm");
let GlobalInvoiceAutoRun = class GlobalInvoiceAutoRun {
    id;
    tenant_id;
    fiscal_configuration_id;
    billing_branch_id;
    period_year;
    period_month;
    folio;
    status;
    message;
    global_invoice_id;
    created_at;
    updated_at;
};
exports.GlobalInvoiceAutoRun = GlobalInvoiceAutoRun;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GlobalInvoiceAutoRun.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GlobalInvoiceAutoRun.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GlobalInvoiceAutoRun.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GlobalInvoiceAutoRun.prototype, "billing_branch_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], GlobalInvoiceAutoRun.prototype, "period_year", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint' }),
    __metadata("design:type", Number)
], GlobalInvoiceAutoRun.prototype, "period_month", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], GlobalInvoiceAutoRun.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], GlobalInvoiceAutoRun.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], GlobalInvoiceAutoRun.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], GlobalInvoiceAutoRun.prototype, "global_invoice_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], GlobalInvoiceAutoRun.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], GlobalInvoiceAutoRun.prototype, "updated_at", void 0);
exports.GlobalInvoiceAutoRun = GlobalInvoiceAutoRun = __decorate([
    (0, typeorm_1.Entity)('global_invoice_auto_runs'),
    (0, typeorm_1.Index)('uq_global_invoice_auto_run', ['billing_branch_id', 'period_year', 'period_month'], {
        unique: true,
    })
], GlobalInvoiceAutoRun);
//# sourceMappingURL=global-invoice-auto-run.entity.js.map