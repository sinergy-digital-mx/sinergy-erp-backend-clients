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
exports.ContractDownpaymentPayment = void 0;
const typeorm_1 = require("typeorm");
const contract_entity_1 = require("./contract.entity");
const tenant_entity_1 = require("../rbac/tenant.entity");
let ContractDownpaymentPayment = class ContractDownpaymentPayment {
    id;
    tenant;
    tenant_id;
    contract;
    contract_id;
    payment_number;
    amount;
    amount_paid;
    amount_pending;
    due_date;
    paid_date;
    first_partial_payment_date;
    payment_method;
    status;
    is_overdue;
    notes;
    created_at;
    updated_at;
};
exports.ContractDownpaymentPayment = ContractDownpaymentPayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ContractDownpaymentPayment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], ContractDownpaymentPayment.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ContractDownpaymentPayment.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => contract_entity_1.Contract, { onDelete: 'RESTRICT', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'contract_id' }),
    __metadata("design:type", contract_entity_1.Contract)
], ContractDownpaymentPayment.prototype, "contract", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ContractDownpaymentPayment.prototype, "contract_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], ContractDownpaymentPayment.prototype, "payment_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], ContractDownpaymentPayment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ContractDownpaymentPayment.prototype, "amount_paid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], ContractDownpaymentPayment.prototype, "amount_pending", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], ContractDownpaymentPayment.prototype, "due_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], ContractDownpaymentPayment.prototype, "paid_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], ContractDownpaymentPayment.prototype, "first_partial_payment_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], ContractDownpaymentPayment.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['pagado', 'pendiente', 'parcial', 'cancelado'],
        default: 'pendiente',
    }),
    __metadata("design:type", String)
], ContractDownpaymentPayment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ContractDownpaymentPayment.prototype, "is_overdue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ContractDownpaymentPayment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ContractDownpaymentPayment.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ContractDownpaymentPayment.prototype, "updated_at", void 0);
exports.ContractDownpaymentPayment = ContractDownpaymentPayment = __decorate([
    (0, typeorm_1.Entity)('contract_downpayment_payments'),
    (0, typeorm_1.Index)('contract_downpayment_payments_tenant_index', ['tenant_id']),
    (0, typeorm_1.Index)('contract_downpayment_payments_contract_index', ['contract_id']),
    (0, typeorm_1.Index)('contract_downpayment_payments_due_date_index', ['due_date']),
    (0, typeorm_1.Index)('contract_downpayment_payments_status_index', ['status'])
], ContractDownpaymentPayment);
//# sourceMappingURL=contract-downpayment-payment.entity.js.map