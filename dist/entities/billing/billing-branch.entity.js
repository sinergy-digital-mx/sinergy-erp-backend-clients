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
exports.BillingBranch = void 0;
const typeorm_1 = require("typeorm");
const fiscal_configuration_entity_1 = require("./fiscal-configuration.entity");
let BillingBranch = class BillingBranch {
    id;
    fiscal_configuration_id;
    fiscal_configuration;
    code;
    prefix;
    address;
    city;
    state;
    country;
    postal_code;
    phone;
    latitude;
    longitude;
    status;
    warehouses;
    created_at;
    updated_at;
};
exports.BillingBranch = BillingBranch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BillingBranch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fiscal_configuration_id' }),
    __metadata("design:type", String)
], BillingBranch.prototype, "fiscal_configuration_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => fiscal_configuration_entity_1.FiscalConfiguration, (config) => config.branches, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'fiscal_configuration_id' }),
    __metadata("design:type", fiscal_configuration_entity_1.FiscalConfiguration)
], BillingBranch.prototype, "fiscal_configuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], BillingBranch.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", Object)
], BillingBranch.prototype, "prefix", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], BillingBranch.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], BillingBranch.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], BillingBranch.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], BillingBranch.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], BillingBranch.prototype, "postal_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], BillingBranch.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 6, nullable: true }),
    __metadata("design:type", Object)
], BillingBranch.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 6, nullable: true }),
    __metadata("design:type", Object)
], BillingBranch.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 1 }),
    __metadata("design:type", Number)
], BillingBranch.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Warehouse', 'billing_branch'),
    __metadata("design:type", Array)
], BillingBranch.prototype, "warehouses", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], BillingBranch.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], BillingBranch.prototype, "updated_at", void 0);
exports.BillingBranch = BillingBranch = __decorate([
    (0, typeorm_1.Entity)('billing_branches')
], BillingBranch);
//# sourceMappingURL=billing-branch.entity.js.map