"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const employee_entity_1 = require("../../entities/employees/employee.entity");
const employee_leave_request_entity_1 = require("../../entities/employees/employee-leave-request.entity");
const employee_leave_document_entity_1 = require("../../entities/employees/employee-leave-document.entity");
const employee_overtime_policy_entity_1 = require("../../entities/employees/employee-overtime-policy.entity");
const employee_overtime_request_entity_1 = require("../../entities/employees/employee-overtime-request.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const rbac_module_1 = require("../rbac/rbac.module");
const s3_service_1 = require("../../common/services/s3.service");
const employees_service_1 = require("./employees.service");
const employee_leave_service_1 = require("./employee-leave.service");
const employee_overtime_service_1 = require("./employee-overtime.service");
const employees_controller_1 = require("./employees.controller");
const employee_overtime_controller_1 = require("./employee-overtime.controller");
let EmployeesModule = class EmployeesModule {
};
exports.EmployeesModule = EmployeesModule;
exports.EmployeesModule = EmployeesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                employee_entity_1.Employee,
                employee_leave_request_entity_1.EmployeeLeaveRequest,
                employee_leave_document_entity_1.EmployeeLeaveDocument,
                employee_overtime_request_entity_1.EmployeeOvertimeRequest,
                employee_overtime_policy_entity_1.EmployeeOvertimePolicy,
                user_entity_1.User,
            ]),
            rbac_module_1.RBACModule,
        ],
        controllers: [employees_controller_1.EmployeesController, employee_overtime_controller_1.EmployeeOvertimeController],
        providers: [employees_service_1.EmployeesService, employee_leave_service_1.EmployeeLeaveService, employee_overtime_service_1.EmployeeOvertimeService, s3_service_1.S3Service],
        exports: [employees_service_1.EmployeesService, employee_leave_service_1.EmployeeLeaveService, employee_overtime_service_1.EmployeeOvertimeService],
    })
], EmployeesModule);
//# sourceMappingURL=employees.module.js.map