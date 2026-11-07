"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceUpdatesModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const rbac_module_1 = require("../rbac/rbac.module");
const price_updates_controller_1 = require("./price-updates.controller");
const price_updates_service_1 = require("./price-updates.service");
let PriceUpdatesModule = class PriceUpdatesModule {
};
exports.PriceUpdatesModule = PriceUpdatesModule;
exports.PriceUpdatesModule = PriceUpdatesModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, rbac_module_1.RBACModule],
        controllers: [price_updates_controller_1.PriceUpdatesController],
        providers: [price_updates_service_1.PriceUpdatesService],
    })
], PriceUpdatesModule);
//# sourceMappingURL=price-updates.module.js.map