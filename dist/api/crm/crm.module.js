"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const customer_activity_entity_1 = require("../../entities/customers/customer-activity.entity");
const customer_entity_1 = require("../../entities/customers/customer.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const rbac_module_1 = require("../rbac/rbac.module");
const crm_inbox_controller_1 = require("./crm-inbox.controller");
const crm_inbox_service_1 = require("./services/crm-inbox.service");
let CrmModule = class CrmModule {
};
exports.CrmModule = CrmModule;
exports.CrmModule = CrmModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([customer_activity_entity_1.CustomerActivity, customer_entity_1.Customer, user_entity_1.User]),
            rbac_module_1.RBACModule,
        ],
        controllers: [crm_inbox_controller_1.CrmInboxController],
        providers: [crm_inbox_service_1.CrmInboxService],
        exports: [crm_inbox_service_1.CrmInboxService],
    })
], CrmModule);
//# sourceMappingURL=crm.module.js.map