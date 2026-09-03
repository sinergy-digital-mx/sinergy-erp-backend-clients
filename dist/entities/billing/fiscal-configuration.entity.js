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
exports.FiscalConfiguration = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
const billing_branch_entity_1 = require("./billing-branch.entity");
let FiscalConfiguration = class FiscalConfiguration {
    id;
    tenant_id;
    razon_social;
    rfc;
    prefix;
    persona_type;
    fiscal_regime;
    digital_seal;
    digital_seal_password;
    private_key;
    logo;
    status;
    created_by;
    certificate_serial_number;
    finkok_registration_status;
    finkok_registered_at;
    finkok_registration_error;
    finkok_remote_status;
    finkok_stamps_counter;
    finkok_stamps_credit;
    last_finkok_sync_at;
    branches;
    created_at;
    updated_at;
};
exports.FiscalConfiguration = FiscalConfiguration;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FiscalConfiguration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], FiscalConfiguration.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiscalConfiguration.prototype, "razon_social", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiscalConfiguration.prototype, "rfc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], FiscalConfiguration.prototype, "prefix", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['Persona Física', 'Persona Moral'],
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiscalConfiguration.prototype, "persona_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['601', '603', '605', '606', '607', '608', '609', '610', '611', '614', '616', '620', '621', '622', '623', '624', '625', '626', '627', '628', '629', '630'],
        nullable: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiscalConfiguration.prototype, "fiscal_regime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiscalConfiguration.prototype, "digital_seal", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiscalConfiguration.prototype, "digital_seal_password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiscalConfiguration.prototype, "private_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiscalConfiguration.prototype, "logo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['active', 'inactive'],
        default: 'active',
    }),
    __metadata("design:type", String)
], FiscalConfiguration.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], FiscalConfiguration.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", Object)
], FiscalConfiguration.prototype, "certificate_serial_number", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['pending', 'registered', 'failed', 'not_required'],
        default: 'pending',
    }),
    __metadata("design:type", String)
], FiscalConfiguration.prototype, "finkok_registration_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], FiscalConfiguration.prototype, "finkok_registered_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], FiscalConfiguration.prototype, "finkok_registration_error", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", Object)
], FiscalConfiguration.prototype, "finkok_remote_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], FiscalConfiguration.prototype, "finkok_stamps_counter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], FiscalConfiguration.prototype, "finkok_stamps_credit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], FiscalConfiguration.prototype, "last_finkok_sync_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => billing_branch_entity_1.BillingBranch, (branch) => branch.fiscal_configuration),
    __metadata("design:type", Array)
], FiscalConfiguration.prototype, "branches", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], FiscalConfiguration.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], FiscalConfiguration.prototype, "updated_at", void 0);
exports.FiscalConfiguration = FiscalConfiguration = __decorate([
    (0, typeorm_1.Entity)('fiscal_configurations'),
    (0, typeorm_1.Index)('tenant_index', ['tenant_id'])
], FiscalConfiguration);
//# sourceMappingURL=fiscal-configuration.entity.js.map