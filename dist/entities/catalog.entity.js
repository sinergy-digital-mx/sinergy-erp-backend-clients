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
exports.Catalog = exports.CatalogType = void 0;
const typeorm_1 = require("typeorm");
var CatalogType;
(function (CatalogType) {
    CatalogType["PHONE_COUNTRY"] = "phone_country";
    CatalogType["INDUSTRY"] = "industry";
    CatalogType["LEAD_SOURCE"] = "lead_source";
    CatalogType["CUSTOMER_TYPE"] = "customer_type";
    CatalogType["ACTIVITY_TYPE"] = "activity_type";
})(CatalogType || (exports.CatalogType = CatalogType = {}));
let Catalog = class Catalog {
    id;
    catalog_type;
    name;
    code;
    value;
    description;
    metadata;
    is_active;
    sort_order;
    created_at;
    updated_at;
};
exports.Catalog = Catalog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Catalog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CatalogType,
    }),
    __metadata("design:type", String)
], Catalog.prototype, "catalog_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Catalog.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Catalog.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Catalog.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Catalog.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Catalog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Catalog.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Catalog.prototype, "sort_order", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Catalog.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Catalog.prototype, "updated_at", void 0);
exports.Catalog = Catalog = __decorate([
    (0, typeorm_1.Entity)('catalogs'),
    (0, typeorm_1.Index)('catalog_type_index', ['catalog_type']),
    (0, typeorm_1.Index)('catalog_code_index', ['code']),
    (0, typeorm_1.Index)('catalog_name_index', ['name'])
], Catalog);
//# sourceMappingURL=catalog.entity.js.map