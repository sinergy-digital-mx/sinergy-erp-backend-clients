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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const catalogs_service_1 = require("./catalogs.service");
const catalog_entity_1 = require("../../entities/catalog.entity");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let CatalogsController = class CatalogsController {
    catalogsService;
    constructor(catalogsService) {
        this.catalogsService = catalogsService;
    }
    async findAll(type) {
        return this.catalogsService.findAll(type);
    }
    async findByType(type) {
        return this.catalogsService.findByType(type);
    }
    async search(type, query) {
        if (!query || query.length < 1) {
            return this.catalogsService.findByType(type);
        }
        return this.catalogsService.search(type, query);
    }
    async getPhoneCountries() {
        return this.catalogsService.findByType(catalog_entity_1.CatalogType.PHONE_COUNTRY);
    }
};
exports.CatalogsController = CatalogsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all catalogs or filter by type' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, enum: catalog_entity_1.CatalogType, description: 'Catalog type filter' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of catalogs',
        schema: {
            example: [
                {
                    id: 1,
                    catalog_type: 'phone_country',
                    name: 'United States',
                    code: 'US',
                    value: '+1',
                    description: null,
                    metadata: null,
                    is_active: true,
                    sort_order: 0,
                },
            ],
        },
    }),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('by-type'),
    (0, swagger_1.ApiOperation)({ summary: 'Get catalogs by type' }),
    (0, swagger_1.ApiQuery)({ name: 'type', enum: catalog_entity_1.CatalogType, description: 'Catalog type' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Catalogs of specified type',
    }),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "findByType", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search catalogs by type and query' }),
    (0, swagger_1.ApiQuery)({ name: 'type', enum: catalog_entity_1.CatalogType, description: 'Catalog type' }),
    (0, swagger_1.ApiQuery)({ name: 'q', description: 'Search query (name, code, or value)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Filtered catalogs',
    }),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('phone-countries'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all phone countries (convenience endpoint)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of phone countries',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogsController.prototype, "getPhoneCountries", null);
exports.CatalogsController = CatalogsController = __decorate([
    (0, common_1.Controller)('tenant/catalogs'),
    (0, swagger_1.ApiTags)('Catalogs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [catalogs_service_1.CatalogsService])
], CatalogsController);
//# sourceMappingURL=catalogs.controller.js.map