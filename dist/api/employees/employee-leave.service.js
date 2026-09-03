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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeLeaveService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_entity_1 = require("../../entities/employees/employee.entity");
const employee_leave_request_entity_1 = require("../../entities/employees/employee-leave-request.entity");
const leave_type_enum_1 = require("../../entities/employees/leave-type.enum");
const leave_status_enum_1 = require("../../entities/employees/leave-status.enum");
const employees_service_1 = require("./employees.service");
const mexican_labor_law_1 = require("./utils/mexican-labor-law");
let EmployeeLeaveService = class EmployeeLeaveService {
    leaveRepo;
    employeeRepo;
    employeesService;
    constructor(leaveRepo, employeeRepo, employeesService) {
        this.leaveRepo = leaveRepo;
        this.employeeRepo = employeeRepo;
        this.employeesService = employeesService;
    }
    async create(tenantId, employeeId, dto, createdBy) {
        const employee = await this.employeeRepo.findOne({
            where: { id: employeeId, tenant_id: tenantId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        const start = new Date(dto.start_date);
        const end = new Date(dto.end_date);
        if (end < start) {
            throw new common_1.BadRequestException('La fecha de fin no puede ser anterior a la de inicio');
        }
        const { days } = this.resolveDays({
            type: dto.type,
            startDate: dto.start_date,
            endDate: dto.end_date,
            days: dto.days,
            countWeekends: dto.count_weekends,
        });
        if (dto.type === leave_type_enum_1.LeaveType.VACATION) {
            const summary = await this.employeesService.getVacationSummary(employee);
            if (days > summary.available_days) {
                throw new common_1.BadRequestException(`Días de vacaciones insuficientes. Disponibles: ${summary.available_days}, solicitados: ${days}`);
            }
        }
        const request = this.leaveRepo.create({
            tenant_id: tenantId,
            employee_id: employeeId,
            type: dto.type,
            start_date: dto.start_date,
            end_date: dto.end_date,
            days,
            reason: dto.reason ?? null,
            is_paid: dto.is_paid ?? true,
            status: leave_status_enum_1.LeaveStatus.PENDING,
            created_by: createdBy,
        });
        const saved = await this.leaveRepo.save(request);
        return (0, employees_service_1.mapLeaveRequest)(saved);
    }
    async findAll(tenantId, query) {
        return this.paginate(tenantId, query);
    }
    async findAllByEmployee(tenantId, employeeId, query) {
        return this.paginate(tenantId, query, employeeId);
    }
    async paginate(tenantId, query, employeeId) {
        let page = Number(query?.page) || 1;
        let limit = Number(query?.limit) || 20;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 1;
        if (limit > 100)
            limit = 100;
        const skip = (page - 1) * limit;
        const qb = this.leaveRepo
            .createQueryBuilder('lr')
            .leftJoin('lr.employee', 'employee')
            .leftJoin('employee.user', 'user')
            .addSelect([
            'employee.id',
            'employee.position',
            'user.first_name',
            'user.last_name',
            'user.email',
        ])
            .where('lr.tenant_id = :tenantId', { tenantId });
        if (employeeId) {
            qb.andWhere('lr.employee_id = :employeeId', { employeeId });
        }
        if (query?.type) {
            qb.andWhere('lr.type = :type', { type: query.type });
        }
        if (query?.status) {
            qb.andWhere('lr.status = :status', { status: query.status });
        }
        qb.orderBy('lr.created_at', 'DESC');
        const total = await qb.getCount();
        const rows = await qb.skip(skip).take(limit).getMany();
        const data = rows.map((r) => ({
            ...(0, employees_service_1.mapLeaveRequest)(r),
            employee: r.employee
                ? {
                    id: r.employee.id,
                    position: r.employee.position,
                    first_name: r.employee.user?.first_name ?? null,
                    last_name: r.employee.user?.last_name ?? null,
                    email: r.employee.user?.email ?? null,
                }
                : null,
        }));
        const totalPages = Math.ceil(total / limit) || 1;
        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }
    async findOne(tenantId, id) {
        const request = await this.leaveRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!request) {
            throw new common_1.NotFoundException('Solicitud no encontrada');
        }
        return request;
    }
    async review(tenantId, id, dto, reviewerId) {
        const request = await this.findOne(tenantId, id);
        if (request.status !== leave_status_enum_1.LeaveStatus.PENDING) {
            throw new common_1.BadRequestException('Solo se pueden resolver solicitudes en estatus pendiente');
        }
        if (dto.status !== leave_status_enum_1.LeaveStatus.APPROVED &&
            dto.status !== leave_status_enum_1.LeaveStatus.REJECTED) {
            throw new common_1.BadRequestException('El estatus debe ser approved o rejected');
        }
        request.status = dto.status;
        request.review_notes = dto.review_notes ?? null;
        request.reviewed_by = reviewerId;
        request.reviewed_at = new Date();
        const saved = await this.leaveRepo.save(request);
        return (0, employees_service_1.mapLeaveRequest)(saved);
    }
    async cancel(tenantId, id, requesterEmployeeId) {
        const request = await this.findOne(tenantId, id);
        if (requesterEmployeeId &&
            request.employee_id !== requesterEmployeeId) {
            throw new common_1.ForbiddenException('No puedes cancelar solicitudes de otro empleado');
        }
        if (request.status !== leave_status_enum_1.LeaveStatus.PENDING) {
            throw new common_1.BadRequestException('Solo se pueden cancelar solicitudes pendientes');
        }
        request.status = leave_status_enum_1.LeaveStatus.CANCELLED;
        const saved = await this.leaveRepo.save(request);
        return (0, employees_service_1.mapLeaveRequest)(saved);
    }
    async update(tenantId, id, dto) {
        const request = await this.findOne(tenantId, id);
        if (request.status === leave_status_enum_1.LeaveStatus.CANCELLED ||
            request.status === leave_status_enum_1.LeaveStatus.REJECTED) {
            throw new common_1.BadRequestException('No se pueden editar solicitudes canceladas o rechazadas');
        }
        const startDate = dto.start_date ?? request.start_date;
        const endDate = dto.end_date ?? request.end_date;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            throw new common_1.BadRequestException('La fecha de fin no puede ser anterior a la de inicio');
        }
        const datesChanged = dto.start_date !== undefined || dto.end_date !== undefined;
        const shouldRecalculate = datesChanged || dto.count_weekends !== undefined;
        const { days } = this.resolveDays({
            type: request.type,
            startDate,
            endDate,
            days: dto.days ?? (shouldRecalculate ? undefined : Number(request.days)),
            countWeekends: dto.count_weekends,
        });
        if (request.type === leave_type_enum_1.LeaveType.VACATION) {
            const employee = await this.employeeRepo.findOne({
                where: { id: request.employee_id, tenant_id: tenantId },
            });
            if (!employee) {
                throw new common_1.NotFoundException('Empleado no encontrado');
            }
            const summary = await this.employeesService.getVacationSummary(employee);
            const alreadyCounted = request.status === leave_status_enum_1.LeaveStatus.APPROVED ||
                request.status === leave_status_enum_1.LeaveStatus.PENDING
                ? Number(request.days)
                : 0;
            const availableWithoutThis = summary.available_days + alreadyCounted;
            if (days > availableWithoutThis) {
                throw new common_1.BadRequestException(`Días de vacaciones insuficientes. Disponibles: ${availableWithoutThis}, solicitados: ${days}`);
            }
        }
        request.start_date = startDate;
        request.end_date = endDate;
        request.days = days;
        if (dto.reason !== undefined) {
            request.reason = dto.reason ?? null;
        }
        if (dto.is_paid !== undefined) {
            request.is_paid = dto.is_paid;
        }
        const saved = await this.leaveRepo.save(request);
        return (0, employees_service_1.mapLeaveRequest)(saved);
    }
    resolveDays(params) {
        try {
            return (0, mexican_labor_law_1.resolveLeaveDays)(params);
        }
        catch (err) {
            throw new common_1.BadRequestException(err instanceof Error ? err.message : 'No se pudieron calcular los días');
        }
    }
};
exports.EmployeeLeaveService = EmployeeLeaveService;
exports.EmployeeLeaveService = EmployeeLeaveService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_leave_request_entity_1.EmployeeLeaveRequest)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        employees_service_1.EmployeesService])
], EmployeeLeaveService);
//# sourceMappingURL=employee-leave.service.js.map