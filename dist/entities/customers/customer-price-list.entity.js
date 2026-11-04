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
exports.CustomerPriceList = void 0;
const typeorm_1 = require("typeorm");
const price_list_entity_1 = require("../products/price-list.entity");
const tenant_entity_1 = require("../rbac/tenant.entity");
const customer_entity_1 = require("./customer.entity");
let CustomerPriceList = class CustomerPriceList {
    id;
    tenant;
    tenant_id;
    customer;
    customer_id;
    price_list;
    price_list_id;
    is_default;
    created_at;
    updated_at;
};
exports.CustomerPriceList = CustomerPriceList;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerPriceList.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], CustomerPriceList.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerPriceList.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customer_entity_1.Customer)
], CustomerPriceList.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CustomerPriceList.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => price_list_entity_1.PriceList, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'price_list_id' }),
    __metadata("design:type", price_list_entity_1.PriceList)
], CustomerPriceList.prototype, "price_list", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerPriceList.prototype, "price_list_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], CustomerPriceList.prototype, "is_default", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], CustomerPriceList.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], CustomerPriceList.prototype, "updated_at", void 0);
exports.CustomerPriceList = CustomerPriceList = __decorate([
    (0, typeorm_1.Entity)('customer_price_lists'),
    (0, typeorm_1.Index)('customer_price_list_unique', ['tenant_id', 'customer_id', 'price_list_id'], {
        unique: true,
    }),
    (0, typeorm_1.Index)('customer_price_list_customer_index', ['tenant_id', 'customer_id'])
], CustomerPriceList);
//# sourceMappingURL=customer-price-list.entity.js.map