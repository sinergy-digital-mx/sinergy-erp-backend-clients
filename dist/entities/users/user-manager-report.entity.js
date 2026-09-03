"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManagerReport = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const user_entity_1 = require("./user.entity");
let UserManagerReport = class UserManagerReport {
    id;
    tenant;
    tenant_id;
    manager;
    manager_user_id;
    report;
    report_user_id;
    created_at;
};
exports.UserManagerReport = UserManagerReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserManagerReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], UserManagerReport.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserManagerReport.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'manager_user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserManagerReport.prototype, "manager", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserManagerReport.prototype, "manager_user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'report_user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserManagerReport.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserManagerReport.prototype, "report_user_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], UserManagerReport.prototype, "created_at", void 0);
exports.UserManagerReport = UserManagerReport = __decorate([
    (0, typeorm_1.Entity)('user_manager_reports'),
    (0, typeorm_1.Index)('idx_user_manager_reports_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('idx_user_manager_reports_manager', ['tenant_id', 'manager_user_id']),
    (0, typeorm_1.Index)('idx_user_manager_reports_report_unique', ['tenant_id', 'report_user_id'], {
        unique: true,
    })
], UserManagerReport);
//# sourceMappingURL=user-manager-report.entity.js.map