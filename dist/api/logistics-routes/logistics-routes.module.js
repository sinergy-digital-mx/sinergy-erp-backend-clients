"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsRoutesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const logistics_route_entity_1 = require("../../entities/logistics/logistics-route.entity");
const rbac_1 = require("../../entities/rbac");
const logistics_routes_controller_1 = require("./logistics-routes.controller");
const logistics_routes_service_1 = require("./logistics-routes.service");
let LogisticsRoutesModule = class LogisticsRoutesModule {
};
exports.LogisticsRoutesModule = LogisticsRoutesModule;
exports.LogisticsRoutesModule = LogisticsRoutesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([logistics_route_entity_1.LogisticsRoute, rbac_1.Module, rbac_1.TenantModule])],
        controllers: [logistics_routes_controller_1.LogisticsRoutesController],
        providers: [logistics_routes_service_1.LogisticsRoutesService],
        exports: [logistics_routes_service_1.LogisticsRoutesService],
    })
], LogisticsRoutesModule);
//# sourceMappingURL=logistics-routes.module.js.map