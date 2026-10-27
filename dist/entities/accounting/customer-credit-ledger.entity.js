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
exports.CustomerCreditLedger = void 0;
const typeorm_1 = require("typeorm");
let CustomerCreditLedger = class CustomerCreditLedger {
    id;
    tenant_id;
    customer_id;
    fiscal_configuration_id;
    currency;
    entry_type;
    amount;
    sales_order_id;
    electronic_invoice_id;
    notes;
    created_by;
    created_at;
};
exports.CustomerCreditLedger = CustomerCreditLedger;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], CustomerCreditLedger.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], CustomerCreditLedger.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], CustomerCreditLedger.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], CustomerCreditLedger.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['MXN', 'USD'] }),
    __metadata("design:type", String)
], CustomerCreditLedger.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['credit', 'reversal'] }),
    __metadata("design:type", String)
], CustomerCreditLedger.prototype, "entry_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    __metadata("design:type", Number)
], CustomerCreditLedger.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], CustomerCreditLedger.prototype, "sales_order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], CustomerCreditLedger.prototype, "electronic_invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], CustomerCreditLedger.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], CustomerCreditLedger.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], CustomerCreditLedger.prototype, "created_at", void 0);
exports.CustomerCreditLedger = CustomerCreditLedger = __decorate([
    (0, typeorm_1.Entity)('customer_credit_ledger'),
    (0, typeorm_1.Index)('uq_customer_credit_ledger_invoice', ['tenant_id', 'electronic_invoice_id', 'entry_type'], {
        unique: true,
    })
], CustomerCreditLedger);
//# sourceMappingURL=customer-credit-ledger.entity.js.map