"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UoMCatalogModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const uom_catalog_entity_1 = require("../../entities/uom-catalog/uom-catalog.entity");
const uom_catalog_controller_1 = require("./uom-catalog.controller");
const uom_catalog_service_1 = require("./uom-catalog.service");
const rbac_module_1 = require("../rbac/rbac.module");
let UoMCatalogModule = class UoMCatalogModule {
};
exports.UoMCatalogModule = UoMCatalogModule;
exports.UoMCatalogModule = UoMCatalogModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([uom_catalog_entity_1.UoMCatalog]),
            rbac_module_1.RBACModule,
        ],
        controllers: [uom_catalog_controller_1.UoMCatalogController],
        providers: [uom_catalog_service_1.UoMCatalogService],
        exports: [uom_catalog_service_1.UoMCatalogService],
    })
], UoMCatalogModule);
//# sourceMappingURL=uom-catalog.module.js.map