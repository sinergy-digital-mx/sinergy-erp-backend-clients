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
var PosConfiguration_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosConfiguration = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
const billing_branch_entity_1 = require("./billing-branch.entity");
let PosConfiguration = class PosConfiguration {
    static { PosConfiguration_1 = this; }
    static ALLOWED_TYPES = ['VENTAS', 'COBRANZA'];
    id;
    tenant_id;
    code;
    type;
    sucursal;
    modelo;
    status;
    branch;
    created_at;
    updated_at;
};
exports.PosConfiguration = PosConfiguration;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PosConfiguration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PosConfiguration.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PosConfiguration.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(PosConfiguration.ALLOWED_TYPES),
    __metadata("design:type", Object)
], PosConfiguration.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sucursal' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PosConfiguration.prototype, "sucursal", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PosConfiguration.prototype, "modelo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 1 }),
    (0, class_validator_1.IsIn)([0, 1]),
    __metadata("design:type", Number)
], PosConfiguration.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => billing_branch_entity_1.BillingBranch, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'sucursal' }),
    __metadata("design:type", billing_branch_entity_1.BillingBranch)
], PosConfiguration.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PosConfiguration.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PosConfiguration.prototype, "updated_at", void 0);
exports.PosConfiguration = PosConfiguration = PosConfiguration_1 = __decorate([
    (0, typeorm_1.Entity)('pos_configurations'),
    (0, typeorm_1.Index)('tenant_index', ['tenant_id']),
    (0, typeorm_1.Index)('branch_index', ['sucursal'])
], PosConfiguration);
//# sourceMappingURL=pos-configuration.entity.js.map