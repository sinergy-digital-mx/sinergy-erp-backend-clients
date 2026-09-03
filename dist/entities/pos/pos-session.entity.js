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
exports.PosSession = exports.PosSessionStatus = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("../users/user.entity");
const pos_configuration_entity_1 = require("../billing/pos-configuration.entity");
var PosSessionStatus;
(function (PosSessionStatus) {
    PosSessionStatus["OPEN"] = "open";
    PosSessionStatus["CLOSED"] = "closed";
    PosSessionStatus["SUSPENDED"] = "suspended";
})(PosSessionStatus || (exports.PosSessionStatus = PosSessionStatus = {}));
let PosSession = class PosSession {
    id;
    tenant_id;
    pos_configuration_id;
    user_id;
    session_number;
    opened_at;
    closed_at;
    opening_cash;
    closing_cash;
    expected_cash;
    cash_difference;
    status;
    total_sales;
    total_transactions;
    notes;
    closed_by;
    created_at;
    updated_at;
    tenant;
    posConfiguration;
    user;
    closedByUser;
    generateId() {
        if (!this.id) {
            this.id = (0, uuid_1.v4)();
        }
    }
};
exports.PosSession = PosSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PosSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], PosSession.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], PosSession.prototype, "pos_configuration_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], PosSession.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], PosSession.prototype, "session_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], PosSession.prototype, "opened_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], PosSession.prototype, "closed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosSession.prototype, "opening_cash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PosSession.prototype, "closing_cash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PosSession.prototype, "expected_cash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PosSession.prototype, "cash_difference", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PosSessionStatus,
        default: PosSessionStatus.OPEN,
    }),
    __metadata("design:type", String)
], PosSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PosSession.prototype, "total_sales", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PosSession.prototype, "total_transactions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PosSession.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], PosSession.prototype, "closed_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PosSession.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PosSession.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], PosSession.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => pos_configuration_entity_1.PosConfiguration),
    (0, typeorm_1.JoinColumn)({ name: 'pos_configuration_id' }),
    __metadata("design:type", pos_configuration_entity_1.PosConfiguration)
], PosSession.prototype, "posConfiguration", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], PosSession.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'closed_by' }),
    __metadata("design:type", user_entity_1.User)
], PosSession.prototype, "closedByUser", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PosSession.prototype, "generateId", null);
exports.PosSession = PosSession = __decorate([
    (0, typeorm_1.Entity)('pos_sessions')
], PosSession);
//# sourceMappingURL=pos-session.entity.js.map