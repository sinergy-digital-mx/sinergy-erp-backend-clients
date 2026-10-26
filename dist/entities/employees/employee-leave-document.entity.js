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
exports.EmployeeLeaveDocument = void 0;
const typeorm_1 = require("typeorm");
const tenant_entity_1 = require("../rbac/tenant.entity");
const employee_leave_request_entity_1 = require("./employee-leave-request.entity");
let EmployeeLeaveDocument = class EmployeeLeaveDocument {
    id;
    tenant;
    tenant_id;
    leave_request;
    leave_request_id;
    employee_id;
    file_name;
    s3_key;
    mime_type;
    file_size;
    uploaded_by;
    created_at;
};
exports.EmployeeLeaveDocument = EmployeeLeaveDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EmployeeLeaveDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.RBACTenant, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'tenant_id' }),
    __metadata("design:type", tenant_entity_1.RBACTenant)
], EmployeeLeaveDocument.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id' }),
    __metadata("design:type", String)
], EmployeeLeaveDocument.prototype, "tenant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => employee_leave_request_entity_1.EmployeeLeaveRequest, (request) => request.documents, {
        onDelete: 'CASCADE',
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'leave_request_id' }),
    __metadata("design:type", employee_leave_request_entity_1.EmployeeLeaveRequest)
], EmployeeLeaveDocument.prototype, "leave_request", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'leave_request_id' }),
    __metadata("design:type", String)
], EmployeeLeaveDocument.prototype, "leave_request_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'employee_id' }),
    __metadata("design:type", String)
], EmployeeLeaveDocument.prototype, "employee_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], EmployeeLeaveDocument.prototype, "file_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], EmployeeLeaveDocument.prototype, "s3_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", Object)
], EmployeeLeaveDocument.prototype, "mime_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], EmployeeLeaveDocument.prototype, "file_size", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], EmployeeLeaveDocument.prototype, "uploaded_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], EmployeeLeaveDocument.prototype, "created_at", void 0);
exports.EmployeeLeaveDocument = EmployeeLeaveDocument = __decorate([
    (0, typeorm_1.Entity)('employee_leave_documents'),
    (0, typeorm_1.Index)('IDX_employee_leave_documents_tenant', ['tenant_id']),
    (0, typeorm_1.Index)('IDX_employee_leave_documents_request', ['leave_request_id'])
], EmployeeLeaveDocument);
//# sourceMappingURL=employee-leave-document.entity.js.map