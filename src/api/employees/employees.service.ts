import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../entities/employees/employee.entity';
import { EmployeeLeaveRequest } from '../../entities/employees/employee-leave-request.entity';
import { User } from '../../entities/users/user.entity';
import { EmployeeStatus } from '../../entities/employees/employee-status.enum';
import { EmployeePaymentFrequency } from '../../entities/employees/employee-payment-frequency.enum';
import { LeaveType } from '../../entities/employees/leave-type.enum';
import { LeaveStatus } from '../../entities/employees/leave-status.enum';
import { S3Service } from '../../common/services/s3.service';
import { EmployeeProfileDto } from './dto/employee-profile.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import {
  buildPayrollSummary,
  buildVacationSummary,
  completedYearsOfService,
  currentAnniversaryStart,
} from './utils/mexican-labor-law';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(EmployeeLeaveRequest)
    private readonly leaveRepo: Repository<EmployeeLeaveRequest>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly s3Service: S3Service,
  ) {}

  // ---------------------------------------------------------------------------
  // Alta desde el módulo Empleados (liga a un usuario existente).
  // ---------------------------------------------------------------------------
  async create(tenantId: string, dto: CreateEmployeeDto) {
    const user = await this.userRepo.findOne({
      where: { id: dto.user_id, tenant_id: tenantId },
    });
    if (!user) {
      throw new NotFoundException('El usuario no existe o no pertenece a la organización');
    }

    const existing = await this.employeeRepo.findOne({
      where: { user_id: dto.user_id, tenant_id: tenantId },
    });
    if (existing) {
      throw new BadRequestException('El usuario ya tiene un perfil de empleado');
    }

    const { user_id, ...profile } = dto;
    const employee = await this.upsertForUser(tenantId, user_id, profile);
    return this.findOne(tenantId, employee.id);
  }

  // ---------------------------------------------------------------------------
  // Upsert usado tanto por el módulo Empleados como por el modal de usuario.
  // ---------------------------------------------------------------------------
  async upsertForUser(
    tenantId: string,
    userId: string,
    profile: EmployeeProfileDto,
  ): Promise<Employee> {
    let employee = await this.employeeRepo.findOne({
      where: { user_id: userId, tenant_id: tenantId },
    });

    if (!employee) {
      employee = this.employeeRepo.create({
        tenant_id: tenantId,
        user_id: userId,
        payment_frequency:
          profile.payment_frequency ?? EmployeePaymentFrequency.BIWEEKLY,
        status: profile.status ?? EmployeeStatus.ACTIVE,
      });
    }

    this.assignProfile(employee, profile);
    const saved = await this.employeeRepo.save(employee);

    await this.userRepo.update(
      { id: userId, tenant_id: tenantId },
      { is_employee: true },
    );

    return saved;
  }

  // Marca/desmarca el flag is_employee sin borrar el historial del empleado.
  async setEmployeeFlag(tenantId: string, userId: string, isEmployee: boolean) {
    await this.userRepo.update(
      { id: userId, tenant_id: tenantId },
      { is_employee: isEmployee },
    );
  }

  private assignProfile(employee: Employee, profile: EmployeeProfileDto) {
    const fields: (keyof EmployeeProfileDto)[] = [
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
    ];
    for (const field of fields) {
      if (profile[field] !== undefined) {
        (employee as any)[field] = profile[field];
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Listado con paginación, búsqueda y resumen de vacaciones por empleado.
  // ---------------------------------------------------------------------------
  async findAll(tenantId: string, query?: QueryEmployeeDto) {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;
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
      qb.andWhere(
        `(LOWER(user.first_name) LIKE LOWER(:search)
          OR LOWER(user.last_name) LIKE LOWER(:search)
          OR LOWER(user.email) LIKE LOWER(:search)
          OR LOWER(employee.rfc) LIKE LOWER(:search)
          OR LOWER(employee.position) LIKE LOWER(:search)
          OR LOWER(employee.employee_code) LIKE LOWER(:search))`,
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('employee.created_at', 'DESC');

    const total = await qb.getCount();
    const employees = await qb.skip(skip).take(limit).getMany();

    const data = await Promise.all(
      employees.map((e) => this.mapEmployee(e, { withRequests: false })),
    );

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

  async findOne(tenantId: string, id: string) {
    const employee = await this.employeeRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['user'],
    });
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }
    return this.mapEmployee(employee, { withRequests: true });
  }

  async findEntityByUser(tenantId: string, userId: string): Promise<Employee | null> {
    return this.employeeRepo.findOne({
      where: { user_id: userId, tenant_id: tenantId },
      relations: ['user'],
    });
  }

  async update(tenantId: string, id: string, dto: UpdateEmployeeDto) {
    const employee = await this.employeeRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }
    this.assignProfile(employee, dto);
    await this.employeeRepo.save(employee);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    const employee = await this.employeeRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }
    await this.userRepo.update(
      { id: employee.user_id, tenant_id: tenantId },
      { is_employee: false },
    );
    await this.employeeRepo.remove(employee);
  }

  // ---------------------------------------------------------------------------
  // Foto del empleado (S3).
  // ---------------------------------------------------------------------------
  async uploadPhoto(tenantId: string, id: string, file: any) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    const employee = await this.employeeRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    const previousKey = employee.photo_s3_key;
    const s3Key = await this.s3Service.uploadEntityFile(
      tenantId,
      'employees',
      employee.id,
      'photo',
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    employee.photo_s3_key = s3Key;
    await this.employeeRepo.save(employee);

    if (previousKey) {
      await this.s3Service.deleteFile(previousKey).catch(() => undefined);
    }

    return this.findOne(tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // Resumen de vacaciones del periodo laboral vigente.
  // ---------------------------------------------------------------------------
  async getVacationSummary(employee: Employee) {
    if (!employee.hire_date) {
      return buildVacationSummary(null);
    }

    const periodStart = currentAnniversaryStart(employee.hire_date)
      .toISOString()
      .slice(0, 10);

    const approved = await this.sumVacationDays(
      employee.id,
      LeaveStatus.APPROVED,
      periodStart,
    );
    const pending = await this.sumVacationDays(
      employee.id,
      LeaveStatus.PENDING,
      periodStart,
    );

    return buildVacationSummary(employee.hire_date, approved, pending);
  }

  private async sumVacationDays(
    employeeId: string,
    status: LeaveStatus,
    periodStart: string,
  ): Promise<number> {
    const raw = await this.leaveRepo
      .createQueryBuilder('lr')
      .select('COALESCE(SUM(lr.days), 0)', 'sum')
      .where('lr.employee_id = :employeeId', { employeeId })
      .andWhere('lr.type = :type', { type: LeaveType.VACATION })
      .andWhere('lr.status = :status', { status })
      .andWhere('lr.start_date >= :periodStart', { periodStart })
      .getRawOne<{ sum: string }>();
    return Number(raw?.sum ?? 0);
  }

  // ---------------------------------------------------------------------------
  // Mapeo de salida (incluye nómina, vacaciones, foto firmada y conteos).
  // ---------------------------------------------------------------------------
  async mapEmployee(employee: Employee, opts: { withRequests: boolean }) {
    const years = completedYearsOfService(employee.hire_date);
    const vacation = await this.getVacationSummary(employee);
    const payroll = buildPayrollSummary(employee.monthly_salary, years);

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
      monthly_salary:
        employee.monthly_salary != null ? Number(employee.monthly_salary) : null,
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

  private async getRequestCounts(employeeId: string) {
    const rows = await this.leaveRepo
      .createQueryBuilder('lr')
      .select('lr.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('lr.employee_id = :employeeId', { employeeId })
      .groupBy('lr.status')
      .getRawMany<{ status: LeaveStatus; count: string }>();

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
        (counts as any)[row.status] = n;
      }
    }
    return counts;
  }
}

export function mapLeaveRequest(request: EmployeeLeaveRequest) {
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
