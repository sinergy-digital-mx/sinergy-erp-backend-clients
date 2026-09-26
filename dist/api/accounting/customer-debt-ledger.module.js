"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerDebtLedgerModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const customer_debt_ledger_entity_1 = require("../../entities/accounting/customer-debt-ledger.entity");
const customer_debt_ledger_service_1 = require("./services/customer-debt-ledger.service");
const customer_debt_flow_service_1 = require("./services/customer-debt-flow.service");
let CustomerDebtLedgerModule = class CustomerDebtLedgerModule {
};
exports.CustomerDebtLedgerModule = CustomerDebtLedgerModule;
exports.CustomerDebtLedgerModule = CustomerDebtLedgerModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([customer_debt_ledger_entity_1.CustomerDebtLedger])],
        providers: [customer_debt_ledger_service_1.CustomerDebtLedgerService, customer_debt_flow_service_1.CustomerDebtFlowService],
        exports: [customer_debt_ledger_service_1.CustomerDebtLedgerService, customer_debt_flow_service_1.CustomerDebtFlowService, typeorm_1.TypeOrmModule],
    })
], CustomerDebtLedgerModule);
//# sourceMappingURL=customer-debt-ledger.module.js.map