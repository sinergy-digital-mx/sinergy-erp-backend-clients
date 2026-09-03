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
exports.PaginatedUoMCatalogDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const uom_catalog_entity_1 = require("../../../entities/uom-catalog/uom-catalog.entity");
class PaginatedUoMCatalogDto {
    data;
    total;
    page;
    limit;
    totalPages;
}
exports.PaginatedUoMCatalogDto = PaginatedUoMCatalogDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [uom_catalog_entity_1.UoMCatalog] }),
    __metadata("design:type", Array)
], PaginatedUoMCatalogDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100 }),
    __metadata("design:type", Number)
], PaginatedUoMCatalogDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], PaginatedUoMCatalogDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    __metadata("design:type", Number)
], PaginatedUoMCatalogDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    __metadata("design:type", Number)
], PaginatedUoMCatalogDto.prototype, "totalPages", void 0);
//# sourceMappingURL=paginated-uom-catalog.dto.js.map