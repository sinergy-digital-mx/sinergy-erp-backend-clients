"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalDiscountsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const global_discount_entity_1 = require("../../entities/global-discounts/global-discount.entity");
const global_discount_controller_1 = require("./global-discount.controller");
const global_discount_service_1 = require("./global-discount.service");
const rbac_module_1 = require("../rbac/rbac.module");
const auth_module_1 = require("../auth/auth.module");
let GlobalDiscountsModule = class GlobalDiscountsModule {
};
exports.GlobalDiscountsModule = GlobalDiscountsModule;
exports.GlobalDiscountsModule = GlobalDiscountsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([global_discount_entity_1.GlobalDiscount]),
            auth_module_1.AuthModule,
            rbac_module_1.RBACModule,
        ],
        controllers: [global_discount_controller_1.GlobalDiscountController],
        providers: [global_discount_service_1.GlobalDiscountService],
        exports: [global_discount_service_1.GlobalDiscountService],
    })
], GlobalDiscountsModule);
//# sourceMappingURL=global-discounts.module.js.map