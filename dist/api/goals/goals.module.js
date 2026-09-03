"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sales_goal_entity_1 = require("../../entities/goals/sales-goal.entity");
const sales_goals_settings_entity_1 = require("../../entities/goals/sales-goals-settings.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const role_entity_1 = require("../../entities/rbac/role.entity");
const auth_module_1 = require("../auth/auth.module");
const rbac_module_1 = require("../rbac/rbac.module");
const goals_controller_1 = require("./goals.controller");
const goals_service_1 = require("./goals.service");
let GoalsModule = class GoalsModule {
};
exports.GoalsModule = GoalsModule;
exports.GoalsModule = GoalsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([sales_goal_entity_1.SalesGoal, sales_goals_settings_entity_1.SalesGoalsSettings, billing_branch_entity_1.BillingBranch, role_entity_1.Role]),
            auth_module_1.AuthModule,
            rbac_module_1.RBACModule,
        ],
        controllers: [goals_controller_1.GoalsController],
        providers: [goals_service_1.GoalsService],
        exports: [goals_service_1.GoalsService],
    })
], GoalsModule);
//# sourceMappingURL=goals.module.js.map