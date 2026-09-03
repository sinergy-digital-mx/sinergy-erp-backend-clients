"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeePortalService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../../entities/users/user.entity");
const employees_service_1 = require("../employees/employees.service");
const employee_leave_service_1 = require("../employees/employee-leave.service");
let EmployeePortalService = class EmployeePortalService {
    userRepo;
    employeesService;
    leaveService;
    constructor(userRepo, employeesService, leaveService) {
        this.userRepo = userRepo;
        this.employeesService = employeesService;
        this.leaveService = leaveService;
    }
    async resolveEmployee(tenantId, userId) {
        const employee = await this.employeesService.findEntityByUser(tenantId, userId);
        if (!employee) {
            throw new common_1.ForbiddenException('Tu cuenta no está registrada como empleado. Contacta a Recursos Humanos.');
        }
        return employee;
    }
    async getMyProfile(tenantId, userId) {
        const employee = await this.resolveEmployee(tenantId, userId);
        return this.employeesService.findOne(tenantId, employee.id);
    }
    async updateMyProfile(tenantId, userId, dto) {
        const employee = await this.resolveEmployee(tenantId, userId);
        const user = await this.userRepo.findOne({
            where: { id: userId, tenant_id: tenantId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (dto.first_name !== undefined)
            user.first_name = dto.first_name;
        if (dto.last_name !== undefined)
            user.last_name = dto.last_name;
        if (dto.phone !== undefined)
            user.phone = dto.phone;
        if (dto.password) {
            user.password = await bcrypt.hash(dto.password, 10);
        }
        await this.userRepo.save(user);
        return this.employeesService.findOne(tenantId, employee.id);
    }
    async uploadMyPhoto(tenantId, userId, file) {
        const employee = await this.resolveEmployee(tenantId, userId);
        return this.employeesService.uploadPhoto(tenantId, employee.id, file);
    }
    async getMyLeaveRequests(tenantId, userId, query) {
        const employee = await this.resolveEmployee(tenantId, userId);
        return this.leaveService.findAllByEmployee(tenantId, employee.id, query);
    }
    async createMyLeaveRequest(tenantId, userId, dto) {
        const employee = await this.resolveEmployee(tenantId, userId);
        return this.leaveService.create(tenantId, employee.id, dto, userId);
    }
    async cancelMyLeaveRequest(tenantId, userId, requestId) {
        const employee = await this.resolveEmployee(tenantId, userId);
        return this.leaveService.cancel(tenantId, requestId, employee.id);
    }
};
exports.EmployeePortalService = EmployeePortalService;
exports.EmployeePortalService = EmployeePortalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        employees_service_1.EmployeesService,
        employee_leave_service_1.EmployeeLeaveService])
], EmployeePortalService);
//# sourceMappingURL=employee-portal.service.js.map