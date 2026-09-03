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
exports.ElectronicInvoiceSyncLog = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const electronic_invoice_entity_1 = require("./electronic-invoice.entity");
const user_entity_1 = require("../users/user.entity");
let ElectronicInvoiceSyncLog = class ElectronicInvoiceSyncLog {
    id;
    tenant;
    tenant_id;
    electronic_invoice;
    electronic_invoice_id;
    trigger_type;
    previous_sat_status;
    new_sat_status;
    raw_response;
    success;
    error_message;
    triggered_by_user;
    triggered_by;
    created_at;
};
exports.ElectronicInvoiceSyncLog = ElectronicInvoiceSyncLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ElectronicInvoiceSyncLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], ElectronicInvoiceSyncLog.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ElectronicInvoiceSyncLog.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => electronic_invoice_entity_1.ElectronicInvoice, { onDelete: 'CASCADE', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'electronic_invoice_id' }),
    __metadata("design:type", Object)
], ElectronicInvoiceSyncLog.prototype, "electronic_invoice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoiceSyncLog.prototype, "electronic_invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['scheduled', 'manual', 'batch'],
        default: 'scheduled',
    }),
    __metadata("design:type", String)
], ElectronicInvoiceSyncLog.prototype, "trigger_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoiceSyncLog.prototype, "previous_sat_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoiceSyncLog.prototype, "new_sat_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoiceSyncLog.prototype, "raw_response", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 1 }),
    __metadata("design:type", Number)
], ElectronicInvoiceSyncLog.prototype, "success", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoiceSyncLog.prototype, "error_message", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'triggered_by' }),
    __metadata("design:type", Object)
], ElectronicInvoiceSyncLog.prototype, "triggered_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], ElectronicInvoiceSyncLog.prototype, "triggered_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ElectronicInvoiceSyncLog.prototype, "created_at", void 0);
exports.ElectronicInvoiceSyncLog = ElectronicInvoiceSyncLog = __decorate([
    (0, typeorm_1.Entity)('electronic_invoice_sync_logs'),
    (0, typeorm_1.Index)('tenant_index', ['tenant_id']),
    (0, typeorm_1.Index)('idx_eisl_invoice', ['electronic_invoice_id'])
], ElectronicInvoiceSyncLog);
//# sourceMappingURL=electronic-invoice-sync-log.entity.js.map