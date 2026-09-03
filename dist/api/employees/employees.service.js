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
exports.EmployeesService = void 0;
exports.mapLeaveRequest = mapLeaveRequest;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_entity_1 = require("../../entities/employees/employee.entity");
const employee_leave_request_entity_1 = require("../../entities/employees/employee-leave-request.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const employee_status_enum_1 = require("../../entities/employees/employee-status.enum");
const employee_payment_frequency_enum_1 = require("../../entities/employees/employee-payment-frequency.enum");
const leave_type_enum_1 = require("../../entities/employees/leave-type.enum");
const leave_status_enum_1 = require("../../entities/employees/leave-status.enum");
const s3_service_1 = require("../../common/services/s3.service");
const mexican_labor_law_1 = require("./utils/mexican-labor-law");
let EmployeesService = class EmployeesService {
    employeeRepo;
    leaveRepo;
    userRepo;
    s3Service;
    constructor(employeeRepo, leaveRepo, userRepo, s3Service) {
        this.employeeRepo = employeeRepo;
        this.leaveRepo = leaveRepo;
        this.userRepo = userRepo;
        this.s3Service = s3Service;
    }
    async create(tenantId, dto) {
        const user = await this.userRepo.findOne({
            where: { id: dto.user_id, tenant_id: tenantId },
        });
        if (!user) {
            throw new common_1.NotFoundException('El usuario no existe o no pertenece a la organización');
        }
        const existing = await this.employeeRepo.findOne({
            where: { user_id: dto.user_id, tenant_id: tenantId },
        });
        if (existing) {
            throw new common_1.BadRequestException('El usuario ya tiene un perfil de empleado');
        }
        const { user_id, ...profile } = dto;
        const employee = await this.upsertForUser(tenantId, user_id, profile);
        return this.findOne(tenantId, employee.id);
    }
    async upsertForUser(tenantId, userId, profile) {
        let employee = await this.employeeRepo.findOne({
            where: { user_id: userId, tenant_id: tenantId },
        });
        if (!employee) {
            employee = this.employeeRepo.create({
                tenant_id: tenantId,
                user_id: userId,
                payment_frequency: profile.payment_frequency ?? employee_payment_frequency_enum_1.EmployeePaymentFrequency.BIWEEKLY,
                status: profile.status ?? employee_status_enum_1.EmployeeStatus.ACTIVE,
            });
        }
        this.assignProfile(employee, profile);
        const saved = await this.employeeRepo.save(employee);
        await this.userRepo.update({ id: userId, tenant_id: tenantId }, { is_employee: true });
        return saved;
    }
    async setEmployeeFlag(tenantId, userId, isEmployee) {
        await this.userRepo.update({ id: userId, tenant_id: tenantId }, { is_employee: isEmployee });
    }
    assignProfile(employee, profile) {
        const fields = [
            'employee_code',
            'rfc',
            'curp',
            'nss',
            'position',
            'department',
            'hire_date',
            'birth_date',
            'monthly_salary',
            'payment_frequency',
            'bank_name',
            'clabe',
            'bank_account',
            'status',
            'termination_date',
            'vacation_carryover_days',
        ];
        for (const field of fields) {
            if (profile[field] !== undefined) {
                const value = profile[field];
                employee[field] =
                    value === '' ? null : value;
            }
        }
        if (employee.vacation_carryover_days == null) {
            employee.vacation_carryover_days = 0;
        }
    }
    async findAll(tenantId, query) {
        let page = Number(query?.page) || 1;
        let limit = Number(query?.limit) || 20;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 1;
        if (limit > 100)
            limit = 100;
        const skip = (page - 1) * limit;
        const qb = this.employeeRepo
            .createQueryBuilder('employee')
            .leftJoinAndSelect('employee.user', 'user')
            .where('employee.tenant_id = :tenantId', { tenantId });
        if (query?.status) {
            qb.andWhere('employee.status = :status', { status: query.status });
        }
        if (query?.department) {
            qb.andWhere('employee.department = :department', {
                department: query.department,
            });
        }
        if (query?.search) {
            qb.andWhere(`(LOWER(user.first_name) LIKE LOWER(:search)
          OR LOWER(user.last_name) LIKE LOWER(:search)
          OR LOWER(user.email) LIKE LOWER(:search)
          OR LOWER(employee.rfc) LIKE LOWER(:search)
          OR LOWER(employee.position) LIKE LOWER(:search)
          OR LOWER(employee.employee_code) LIKE LOWER(:search))`, { search: `%${query.search}%` });
        }
        qb.orderBy('employee.created_at', 'DESC');
        const total = await qb.getCount();
        const employees = await qb.skip(skip).take(limit).getMany();
        const data = await Promise.all(employees.map((e) => this.mapEmployee(e, { withRequests: false })));
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
        const employee = await this.employeeRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['user'],
        });
        if (!employee) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        return this.mapEmployee(employee, { withRequests: true });
    }
    async findEntityByUser(tenantId, userId) {
        return this.employeeRepo.findOne({
            where: { user_id: userId, tenant_id: tenantId },
            relations: ['user'],
        });
    }
    async update(tenantId, id, dto) {
        const employee = await this.employeeRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        this.assignProfile(employee, dto);
        await this.employeeRepo.save(employee);
        return this.findOne(tenantId, id);
    }
    async remove(tenantId, id) {
        const employee = await this.employeeRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        await this.userRepo.update({ id: employee.user_id, tenant_id: tenantId }, { is_employee: false });
        await this.employeeRepo.remove(employee);
    }
    async uploadPhoto(tenantId, id, file) {
        if (!file) {
            throw new common_1.BadRequestException('No se recibió ningún archivo');
        }
        const employee = await this.employeeRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Empleado no encontrado');
        }
        const previousKey = employee.photo_s3_key;
        const s3Key = await this.s3Service.uploadEntityFile(tenantId, 'employees', employee.id, 'photo', file.buffer, file.originalname, file.mimetype);
        employee.photo_s3_key = s3Key;
        await this.employeeRepo.save(employee);
        if (previousKey) {
            await this.s3Service.deleteFile(previousKey).catch(() => undefined);
        }
        return this.findOne(tenantId, id);
    }
    async getVacationSummary(employee) {
        if (!employee.hire_date) {
            return (0, mexican_labor_law_1.buildVacationSummary)(null);
        }
        const periodStart = (0, mexican_labor_law_1.currentAnniversaryStart)(employee.hire_date)
            .toISOString()
            .slice(0, 10);
        const approved = await this.sumVacationDays(employee.id, leave_status_enum_1.LeaveStatus.APPROVED, periodStart);
        const pending = await this.sumVacationDays(employee.id, leave_status_enum_1.LeaveStatus.PENDING, periodStart);
        return (0, mexican_labor_law_1.buildVacationSummary)(employee.hire_date, approved, pending, Number(employee.vacation_carryover_days ?? 0));
    }
    async sumVacationDays(employeeId, status, periodStart) {
        const raw = await this.leaveRepo
            .createQueryBuilder('lr')
            .select('COALESCE(SUM(lr.days), 0)', 'sum')
            .where('lr.employee_id = :employeeId', { employeeId })
            .andWhere('lr.type = :type', { type: leave_type_enum_1.LeaveType.VACATION })
            .andWhere('lr.status = :status', { status })
            .andWhere('lr.start_date >= :periodStart', { periodStart })
            .getRawOne();
        return Number(raw?.sum ?? 0);
    }
    async mapEmployee(employee, opts) {
        const years = (0, mexican_labor_law_1.completedYearsOfService)(employee.hire_date);
        const vacation = await this.getVacationSummary(employee);
        const payroll = (0, mexican_labor_law_1.buildPayrollSummary)(employee.monthly_salary, years);
        const photoUrl = employee.photo_s3_key
            ? await this.s3Service.getSignedUrl(employee.photo_s3_key).catch(() => null)
            : null;
        const requestCounts = await this.getRequestCounts(employee.id);
        const base = {
            id: employee.id,
            user_id: employee.user_id,
            first_name: employee.user?.first_name ?? null,
            last_name: employee.user?.last_name ?? null,
            email: employee.user?.email ?? null,
            phone: employee.user?.phone ?? null,
            employee_code: employee.employee_code,
            rfc: employee.rfc,
            curp: employee.curp,
            nss: employee.nss,
            position: employee.position,
            department: employee.department,
            hire_date: employee.hire_date,
            birth_date: employee.birth_date,
            vacation_carryover_days: Number(employee.vacation_carryover_days ?? 0),
            monthly_salary: employee.monthly_salary != null ? Number(employee.monthly_salary) : null,
            payment_frequency: employee.payment_frequency,
            bank_name: employee.bank_name,
            clabe: employee.clabe,
            bank_account: employee.bank_account,
            status: employee.status,
            termination_date: employee.termination_date,
            photo_url: photoUrl,
            has_photo: Boolean(employee.photo_s3_key),
            years_of_service: years,
            vacation,
            payroll,
            request_counts: requestCounts,
            created_at: employee.created_at,
            updated_at: employee.updated_at,
        };
        if (opts.withRequests) {
            const requests = await this.leaveRepo.find({
                where: { employee_id: employee.id },
                order: { created_at: 'DESC' },
            });
            return { ...base, leave_requests: requests.map(mapLeaveRequest) };
        }
        return base;
    }
    async getRequestCounts(employeeId) {
        const rows = await this.leaveRepo
            .createQueryBuilder('lr')
            .select('lr.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('lr.employee_id = :employeeId', { employeeId })
            .groupBy('lr.status')
            .getRawMany();
        const counts = {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            cancelled: 0,
        };
        for (const row of rows) {
            const n = Number(row.count);
            counts.total += n;
            if (row.status in counts) {
                counts[row.status] = n;
            }
        }
        return counts;
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_leave_request_entity_1.EmployeeLeaveRequest)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        s3_service_1.S3Service])
], EmployeesService);
function mapLeaveRequest(request) {
    return {
        id: request.id,
        employee_id: request.employee_id,
        type: request.type,
        start_date: request.start_date,
        end_date: request.end_date,
        days: Number(request.days),
        reason: request.reason,
        status: request.status,
        is_paid: Boolean(request.is_paid),
        reviewed_by: request.reviewed_by,
        reviewed_at: request.reviewed_at,
        review_notes: request.review_notes,
        created_by: request.created_by,
        created_at: request.created_at,
        updated_at: request.updated_at,
    };
}
//# sourceMappingURL=employees.service.js.map