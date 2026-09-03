"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoaPaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const contract_entity_1 = require("../../../entities/contracts/contract.entity");
const contract_hoa_payment_entity_1 = require("../../../entities/contracts/contract-hoa-payment.entity");
const rbac_module_1 = require("../../rbac/rbac.module");
const hoa_payments_controller_1 = require("./hoa-payments.controller");
const hoa_payments_service_1 = require("./hoa-payments.service");
let HoaPaymentsModule = class HoaPaymentsModule {
};
exports.HoaPaymentsModule = HoaPaymentsModule;
exports.HoaPaymentsModule = HoaPaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([contract_hoa_payment_entity_1.ContractHoaPayment, contract_entity_1.Contract]), rbac_module_1.RBACModule],
        providers: [hoa_payments_service_1.HoaPaymentsService],
        controllers: [hoa_payments_controller_1.HoaPaymentsController],
        exports: [hoa_payments_service_1.HoaPaymentsService],
    })
], HoaPaymentsModule);
//# sourceMappingURL=hoa-payments.module.js.map