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
exports.Customer = void 0;
const typeorm_1 = require("typeorm");
const customer_status_entity_1 = require("./customer-status.entity");
const customer_address_entity_1 = require("./customer-address.entity");
const customer_group_entity_1 = require("./customer-group.entity");
const customer_activity_entity_1 = require("./customer-activity.entity");
const tenant_entity_1 = require("../rbac/tenant.entity");
const contract_entity_1 = require("../contracts/contract.entity");
const warehouse_entity_1 = require("../warehouse/warehouse.entity");
const billing_branch_entity_1 = require("../billing/billing-branch.entity");
const fiscal_configuration_entity_1 = require("../billing/fiscal-configuration.entity");
const user_entity_1 = require("../users/user.entity");
let Customer = class Customer {
    id;
    tenant;
    tenant_id;
    status;
    status_id;
    name;
    lastname;
    email;
    phone;
    phone_country;
    phone_code;
    country;
    company_name;
    website;
    group;
    group_id;
    additional_name;
    additional_lastname;
    additional_email;
    additional_phone;
    additional_phone_country;
    additional_phone_code;
    fiscal_rfc;
    fiscal_razon_social;
    fiscal_person_type;
    fiscal_address;
    fiscal_street;
    fiscal_exterior_number;
    fiscal_interior_number;
    fiscal_colonia;
    fiscal_localidad;
    fiscal_municipio;
    fiscal_country;
    fiscal_city;
    fiscal_state;
    fiscal_postal_code;
    warehouse;
    warehouse_id;
    registered_fiscal_configuration;
    registered_fiscal_configuration_id;
    registered_billing_branch;
    registered_billing_branch_id;
    registered_by_user;
    registered_by_user_id;
    assigned_seller_user;
    assigned_seller_user_id;
    credit_enabled;
    credit_days;
    credit_amount;
    auto_generate_invoice;
    legacy_customer_id;
    addresses;
    activities;
    contracts;
    created_at;
};
exports.Customer = Customer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Customer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], Customer.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], Customer.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_status_entity_1.CustomerStatus),
    (0, typeorm_1.JoinColumn)({ name: 'status_id' }),
    __metadata("design:type", customer_status_entity_1.CustomerStatus)
], Customer.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status_id', nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "status_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Customer.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "lastname", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 2, nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "phone_country", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5, nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "phone_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "company_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_group_entity_1.CustomerGroup, group => group.customers),
    (0, typeorm_1.JoinColumn)({ name: 'group_id' }),
    __metadata("design:type", customer_group_entity_1.CustomerGroup)
], Customer.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'group_id', nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "group_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "additional_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "additional_lastname", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "additional_email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "additional_phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 2, nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "additional_phone_country", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "additional_phone_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], Customer.prototype, "fiscal_rfc", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "fiscal_razon_social", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], Customer.prototype, "fiscal_person_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "fiscal_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], Customer.prototype, "fiscal_street", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], Customer.prototype, "fiscal_exterior_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], Customer.prototype, "fiscal_interior_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 120 }),
    __metadata("design:type", String)
], Customer.prototype, "fiscal_colonia", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 120 }),
    __metadata("design:type", String)
], Customer.prototype, "fiscal_localidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 120 }),
    __metadata("design:type", String)
], Customer.prototype, "fiscal_municipio", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 3 }),
    __metadata("design:type", String)
], Customer.prototype, "fiscal_country", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "fiscal_city", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "fiscal_state", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], Customer.prototype, "fiscal_postal_code", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", Object)
], Customer.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "warehouse_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => fiscal_configuration_entity_1.FiscalConfiguration, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'registered_fiscal_configuration_id' }),
    __metadata("design:type", Object)
], Customer.prototype, "registered_fiscal_configuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'registered_fiscal_configuration_id', nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "registered_fiscal_configuration_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => billing_branch_entity_1.BillingBranch, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'registered_billing_branch_id' }),
    __metadata("design:type", Object)
], Customer.prototype, "registered_billing_branch", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'registered_billing_branch_id', nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "registered_billing_branch_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'registered_by_user_id' }),
    __metadata("design:type", Object)
], Customer.prototype, "registered_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'registered_by_user_id', nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "registered_by_user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_seller_user_id' }),
    __metadata("design:type", Object)
], Customer.prototype, "assigned_seller_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_seller_user_id', nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "assigned_seller_user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Customer.prototype, "credit_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "credit_days", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Customer.prototype, "credit_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Customer.prototype, "auto_generate_invoice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Customer.prototype, "legacy_customer_id", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => customer_address_entity_1.CustomerAddress, address => address.customer),
    __metadata("design:type", Array)
], Customer.prototype, "addresses", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => customer_activity_entity_1.CustomerActivity, activity => activity.customer),
    __metadata("design:type", Array)
], Customer.prototype, "activities", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => contract_entity_1.Contract, contract => contract.customer),
    __metadata("design:type", Array)
], Customer.prototype, "contracts", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Customer.prototype, "created_at", void 0);
exports.Customer = Customer = __decorate([
    (0, typeorm_1.Entity)('customers')
], Customer);
//# sourceMappingURL=customer.entity.js.map