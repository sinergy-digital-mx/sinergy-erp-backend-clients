"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseControlModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const sales_order_detail_entity_1 = require("../../entities/sales-orders/sales-order-detail.entity");
const sales_order_batch_allocation_entity_1 = require("../../entities/sales-orders/sales-order-batch-allocation.entity");
const inventory_batch_entity_1 = require("../../entities/purchase-orders/inventory-batch.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const rbac_1 = require("../../entities/rbac");
const control_desk_1 = require("../../entities/control-desk");
const auth_module_1 = require("../auth/auth.module");
const rbac_module_1 = require("../rbac/rbac.module");
const tenant_module_validation_guard_1 = require("../auth/tenant-module-validation.guard");
const sales_order_fulfillment_service_1 = require("../sales-orders/services/sales-order-fulfillment.service");
const warehouse_control_controller_1 = require("./warehouse-control.controller");
const warehouse_control_service_1 = require("./warehouse-control.service");
const control_desk_lifecycle_service_1 = require("./control-desk-lifecycle.service");
let WarehouseControlModule = class WarehouseControlModule {
};
exports.WarehouseControlModule = WarehouseControlModule;
exports.WarehouseControlModule = WarehouseControlModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                sales_order_entity_1.SalesOrder,
                sales_order_detail_entity_1.SalesOrderDetail,
                sales_order_batch_allocation_entity_1.SalesOrderBatchAllocation,
                inventory_batch_entity_1.InventoryBatch,
                billing_branch_entity_1.BillingBranch,
                warehouse_entity_1.Warehouse,
                control_desk_1.ControlDeskJob,
                control_desk_1.ControlDeskPickTask,
                control_desk_1.ControlDeskPickLine,
                control_desk_1.ControlDeskPosition,
                control_desk_1.UserWarehouseAssignment,
                rbac_1.TenantModule,
                rbac_1.Module,
            ]),
            auth_module_1.AuthModule,
            rbac_module_1.RBACModule,
        ],
        controllers: [warehouse_control_controller_1.WarehouseControlController],
        providers: [
            warehouse_control_service_1.WarehouseControlService,
            control_desk_lifecycle_service_1.ControlDeskLifecycleService,
            sales_order_fulfillment_service_1.SalesOrderFulfillmentService,
            tenant_module_validation_guard_1.TenantModuleValidationGuard,
        ],
        exports: [warehouse_control_service_1.WarehouseControlService, control_desk_lifecycle_service_1.ControlDeskLifecycleService],
    })
], WarehouseControlModule);
//# sourceMappingURL=warehouse-control.module.js.map