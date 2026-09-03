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
const user_entity_1 = require("../../entities/users/user.entity");
const rbac_module_1 = require("../rbac/rbac.module");
const s3_service_1 = require("../../common/services/s3.service");
const employees_service_1 = require("./employees.service");
const employee_leave_service_1 = require("./employee-leave.service");
const employees_controller_1 = require("./employees.controller");
let EmployeesModule = class EmployeesModule {
};
exports.EmployeesModule = EmployeesModule;
exports.EmployeesModule = EmployeesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([employee_entity_1.Employee, employee_leave_request_entity_1.EmployeeLeaveRequest, user_entity_1.User]),
            rbac_module_1.RBACModule,
        ],
        controllers: [employees_controller_1.EmployeesController],
        providers: [employees_service_1.EmployeesService, employee_leave_service_1.EmployeeLeaveService, s3_service_1.S3Service],
        exports: [employees_service_1.EmployeesService, employee_leave_service_1.EmployeeLeaveService],
    })
], EmployeesModule);
//# sourceMappingURL=employees.module.js.map