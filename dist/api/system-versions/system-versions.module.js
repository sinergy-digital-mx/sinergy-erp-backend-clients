"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemVersionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const system_version_entity_1 = require("../../entities/system-versions/system-version.entity");
const rbac_module_1 = require("../rbac/rbac.module");
const system_versions_controller_1 = require("./system-versions.controller");
const system_versions_service_1 = require("./system-versions.service");
let SystemVersionsModule = class SystemVersionsModule {
};
exports.SystemVersionsModule = SystemVersionsModule;
exports.SystemVersionsModule = SystemVersionsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([system_version_entity_1.SystemVersion]), rbac_module_1.RBACModule],
        controllers: [system_versions_controller_1.SystemVersionsController],
        providers: [system_versions_service_1.SystemVersionsService],
        exports: [system_versions_service_1.SystemVersionsService],
    })
], SystemVersionsModule);
//# sourceMappingURL=system-versions.module.js.map