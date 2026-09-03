"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosSessionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const pos_session_entity_1 = require("../../entities/pos/pos-session.entity");
const pos_configuration_entity_1 = require("../../entities/billing/pos-configuration.entity");
const pos_session_controller_1 = require("./pos-session.controller");
const pos_session_service_1 = require("./pos-session.service");
const rbac_module_1 = require("../rbac/rbac.module");
let PosSessionsModule = class PosSessionsModule {
};
exports.PosSessionsModule = PosSessionsModule;
exports.PosSessionsModule = PosSessionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([pos_session_entity_1.PosSession, pos_configuration_entity_1.PosConfiguration]),
            rbac_module_1.RBACModule,
        ],
        controllers: [pos_session_controller_1.PosSessionController],
        providers: [pos_session_service_1.PosSessionService],
        exports: [pos_session_service_1.PosSessionService],
    })
], PosSessionsModule);
//# sourceMappingURL=pos-sessions.module.js.map