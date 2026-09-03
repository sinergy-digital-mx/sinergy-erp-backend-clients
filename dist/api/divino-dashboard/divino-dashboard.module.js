"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DivinoDashboardModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const contract_entity_1 = require("../../entities/contracts/contract.entity");
const rbac_module_1 = require("../rbac/rbac.module");
const divino_dashboard_controller_1 = require("./divino-dashboard.controller");
const divino_dashboard_service_1 = require("./divino-dashboard.service");
let DivinoDashboardModule = class DivinoDashboardModule {
};
exports.DivinoDashboardModule = DivinoDashboardModule;
exports.DivinoDashboardModule = DivinoDashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([contract_entity_1.Contract]), rbac_module_1.RBACModule],
        controllers: [divino_dashboard_controller_1.DivinoDashboardController],
        providers: [divino_dashboard_service_1.DivinoDashboardService],
        exports: [divino_dashboard_service_1.DivinoDashboardService],
    })
], DivinoDashboardModule);
//# sourceMappingURL=divino-dashboard.module.js.map