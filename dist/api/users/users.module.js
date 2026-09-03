"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const users_controller_1 = require("./users.controller");
const users_service_1 = require("./users.service");
const tenant_entity_1 = require("../../entities/rbac/tenant.entity");
const user_status_entity_1 = require("../../entities/users/user-status.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const user_billing_branch_entity_1 = require("../../entities/users/user-billing-branch.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const pos_daily_shift_entity_1 = require("../../entities/pos/pos-daily-shift.entity");
const user_manager_report_entity_1 = require("../../entities/users/user-manager-report.entity");
const user_warehouse_assignment_entity_1 = require("../../entities/control-desk/user-warehouse-assignment.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const rbac_module_1 = require("../rbac/rbac.module");
const users_roles_controller_1 = require("../rbac/controllers/users-roles.controller");
const employees_module_1 = require("../employees/employees.module");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                user_billing_branch_entity_1.UserBillingBranch,
                tenant_entity_1.RBACTenant,
                user_status_entity_1.UserStatus,
                billing_branch_entity_1.BillingBranch,
                pos_daily_shift_entity_1.PosDailyShift,
                user_manager_report_entity_1.UserManagerReport,
                user_warehouse_assignment_entity_1.UserWarehouseAssignment,
                warehouse_entity_1.Warehouse,
            ]),
            rbac_module_1.RBACModule,
            employees_module_1.EmployeesModule,
        ],
        controllers: [users_controller_1.UsersController, users_roles_controller_1.UsersRolesController],
        providers: [users_service_1.UsersService],
        exports: [users_service_1.UsersService],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map