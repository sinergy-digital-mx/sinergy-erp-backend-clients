"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryStockLedgerModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const inventory_stock_ledger_entity_1 = require("../../entities/inventory/inventory-stock-ledger.entity");
const inventory_stock_ledger_service_1 = require("./services/inventory-stock-ledger.service");
let InventoryStockLedgerModule = class InventoryStockLedgerModule {
};
exports.InventoryStockLedgerModule = InventoryStockLedgerModule;
exports.InventoryStockLedgerModule = InventoryStockLedgerModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([inventory_stock_ledger_entity_1.InventoryStockLedger])],
        providers: [inventory_stock_ledger_service_1.InventoryStockLedgerService],
        exports: [inventory_stock_ledger_service_1.InventoryStockLedgerService, typeorm_1.TypeOrmModule],
    })
], InventoryStockLedgerModule);
//# sourceMappingURL=inventory-stock-ledger.module.js.map