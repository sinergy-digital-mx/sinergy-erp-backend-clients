"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const leads_controller_1 = require("./leads.controller");
const leads_service_1 = require("./leads.service");
const lead_activities_controller_1 = require("./lead-activities.controller");
const lead_activities_service_1 = require("./lead-activities.service");
const lead_groups_controller_1 = require("./lead-groups.controller");
const lead_groups_service_1 = require("./lead-groups.service");
const lead_entity_1 = require("../../entities/leads/lead.entity");
const lead_status_entity_1 = require("../../entities/leads/lead-status.entity");
const lead_activity_entity_1 = require("../../entities/leads/lead-activity.entity");
const lead_address_entity_1 = require("../../entities/leads/lead-address.entity");
const lead_group_entity_1 = require("../../entities/leads/lead-group.entity");
const tenant_entity_1 = require("../../entities/rbac/tenant.entity");
const rbac_module_1 = require("../rbac/rbac.module");
let LeadsModule = class LeadsModule {
};
exports.LeadsModule = LeadsModule;
exports.LeadsModule = LeadsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([lead_entity_1.Lead, lead_status_entity_1.LeadStatus, lead_activity_entity_1.LeadActivity, lead_address_entity_1.LeadAddress, lead_group_entity_1.LeadGroup, tenant_entity_1.RBACTenant]),
            rbac_module_1.RBACModule,
        ],
        providers: [
            leads_service_1.LeadsService,
            lead_activities_service_1.LeadActivitiesService,
            lead_groups_service_1.LeadGroupsService,
        ],
        controllers: [leads_controller_1.LeadsController, lead_activities_controller_1.LeadActivitiesController, lead_groups_controller_1.LeadGroupsController],
        exports: [leads_service_1.LeadsService, lead_activities_service_1.LeadActivitiesService, lead_groups_service_1.LeadGroupsService],
    })
], LeadsModule);
//# sourceMappingURL=leads.module.js.map