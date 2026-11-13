import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Employee } from '../../entities/employees/employee.entity';
import { EmployeeOvertimePolicy } from '../../entities/employees/employee-overtime-policy.entity';
import { EmployeeOvertimeRequest } from '../../entities/employees/employee-overtime-request.entity';
import { EmployeeStatus } from '../../entities/employees/employee-status.enum';
import { OvertimeStatus } from '../../entities/employees/overtime-status.enum';
import { User } from '../../entities/users/user.entity';
import { CreateOvertimeRequestDto } from './dto/create-overtime-request.dto';
import { QueryOvertimeRequestDto } from './dto/query-overtime-request.dto';
import { ReviewOvertimeRequestDto } from './dto/review-overtime-request.dto';
import { UpdateOvertimeRequestDto } from './dto/update-overtime-request.dto';
import { UpsertOvertimePolicyDto } from './dto/upsert-overtime-policy.dto';
import {
  allocateOvertimePay,
  DEFAULT_OVERTIME_POLICY,
  minuteRange,
  OvertimePaymentDetail,
  OvertimePolicyRules,
  rangesOverlap,
  resolveOvertimeSchedule,
  round2,
  round4,
  shiftIsoDate,
  weekRange,
} from './utils/overtime-pay.util';

@Injectable()
export class EmployeeOvertimeService {
  constructor(
    @InjectRepository(EmployeeOvertimeRequest)
    private readonly requestRepo: Repository<EmployeeOvertimeRequest>,
    @InjectRepository(EmployeeOvertimePolicy)
    private readonly policyRepo: Repository<EmployeeOvertimePolicy>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getPolicy(tenantId: string) {
    const row = await this.policyRepo.findOne({
      where: { tenant_id: tenantId },
    });
    if (!row) {
      return { ...DEFAULT_OVERTIME_POLICY, is_custom: false };
    }
    return { ...this.rulesFromRow(row), is_custom: true };
  }

  async upsertPolicy(tenantId: string, dto: UpsertOvertimePolicyDto) {
    let row = await this.policyRepo.findOne({
      where: { tenant_id: tenantId },
    });
    if (!row) {
      row = this.policyRepo.create({ tenant_id: tenantId });
    }
    row.workday_hours = dto.workday_hours;
    row.daily_double_hours = dto.daily_double_hours;
    row.weekly_double_hours = dto.weekly_double_hours;
    row.double_multiplier = dto.double_multiplier;
    row.excess_multiplier = dto.excess_multiplier;
    await this.policyRepo.save(row);
    return this.getPolicy(tenantId);
  }

  async create(
    tenantId: string,
    employeeId: string,
    dto: CreateOvertimeRequestDto,
    createdBy: string | null,
  ) {
    const employee = await this.requireEmployee(tenantId, employeeId);
    this.assertCanWorkOvertime(employee);
    const schedule = this.parseSchedule(dto.work_date, dto.start_time, dto.end_time);
    const reason = this.requireReason(dto.reason);
    await this.assertNoOverlap(
      tenantId,
      employeeId,
      schedule.work_date,
      schedule.start_time,
      schedule.end_time,
    );
    const saved = await this.requestRepo.save(
      this.requestRepo.create({
        tenant_id: tenantId,
        employee_id: employeeId,
        work_date: schedule.work_date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        requested_hours: schedule.requested_hours,
        reason,
        notes: this.cleanText(dto.notes),
        status: OvertimeStatus.PENDING,
        created_by: createdBy,
      }),
    );
    return this.presentOne(tenantId, saved.id);
  }

  async update(
    tenantId: string,
    requestId: string,
    dto: UpdateOvertimeRequestDto,
    ownerEmployeeId?: string,
  ) {
    const current = await this.requireRequest(tenantId, requestId);
    this.assertOwner(current, ownerEmployeeId);
    if (current.status !== OvertimeStatus.PENDING) {
      throw new BadRequestException('Solo se pueden corregir solicitudes pendientes');
    }
    const workDate = dto.work_date ?? this.asIsoDate(current.work_date);
    const startTime = dto.start_time ?? current.start_time;
    const endTime = dto.end_time ?? current.end_time;
    const schedule = this.parseSchedule(workDate, startTime, endTime);
    const reason = dto.reason !== undefined ? this.requireReason(dto.reason) : current.reason;
    await this.assertNoOverlap(
      tenantId,
      current.employee_id,
      schedule.work_date,
      schedule.start_time,
      schedule.end_time,
      current.id,
    );
    current.work_date = schedule.work_date;
    current.start_time = schedule.start_time;
    current.end_time = schedule.end_time;
    current.requested_hours = schedule.requested_hours;
    current.reason = reason;
    if (dto.notes !== undefined) {
      current.notes = this.cleanText(dto.notes);
    }
    await this.requestRepo.save(current);
    return this.presentOne(tenantId, current.id);
  }

  async findAll(tenantId: string, query?: QueryOvertimeRequestDto) {
    return this.paginate(tenantId, query);
  }

  async findAllByEmployee(
    tenantId: string,
    employeeId: string,
    query?: QueryOvertimeRequestDto,
  ) {
    await this.requireEmployee(tenantId, employeeId);
    return this.paginate(tenantId, query, employeeId);
  }

  async preview(tenantId: string, requestId: string, approvedHours?: number) {
    const request = await this.requireRequest(tenantId, requestId);
    if (
      request.status !== OvertimeStatus.PENDING &&
      request.status !== OvertimeStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Solo se puede calcular el pago de una solicitud pendiente o aprobada',
      );
    }
    const hours = round2(approvedHours ?? num(request.requested_hours));
    this.assertApprovedHours(hours);
    const payment = await this.calculatePayment(tenantId, request, hours);
    return {
      requested_hours: num(request.requested_hours),
      approved_hours: hours,
      payment: { ...payment.view, is_estimate: true },
    };
  }

  async review(
    tenantId: string,
    requestId: string,
    dto: ReviewOvertimeRequestDto,
    reviewerId: string | null,
  ) {
    const request = await this.requireRequest(tenantId, requestId);
    if (
      request.status !== OvertimeStatus.PENDING &&
      request.status !== OvertimeStatus.APPROVED
    ) {
      throw new BadRequestException(
        request.status === OvertimeStatus.PAID
          ? 'Las horas ya están pagadas'
          : 'La solicitud está rechazada',
      );
    }

    request.reviewed_by = reviewerId;
    request.reviewed_at = new Date();
    request.review_notes = this.cleanText(dto.review_notes);

    if (dto.status === OvertimeStatus.REJECTED) {
      request.status = OvertimeStatus.REJECTED;
      request.approved_hours = null;
      request.hourly_rate = null;
      request.double_hours = null;
      request.excess_hours = null;
      request.amount = null;
      request.paid_amount = null;
      request.payment_detail = null;
      await this.requestRepo.save(request);
      return this.presentOne(tenantId, request.id);
    }

    const hours = round2(dto.approved_hours ?? num(request.requested_hours));
    this.assertApprovedHours(hours);
    const payment = await this.calculatePayment(tenantId, request, hours);
    if (payment.view.amount <= 0) {
      throw new BadRequestException('El importe calculado es 0');
    }
    request.status = OvertimeStatus.APPROVED;
    request.approved_hours = hours;
    request.hourly_rate = payment.view.hourly_rate;
    request.double_hours = payment.view.double_hours;
    request.excess_hours = payment.view.excess_hours;
    request.amount = payment.view.amount;
    request.paid_amount = null;
    request.paid_by = null;
    request.paid_at = null;
    request.payment_detail = payment.detail as unknown as Record<string, unknown>;
    await this.requestRepo.save(request);
    return this.presentOne(tenantId, request.id);
  }

  async markPaid(tenantId: string, requestId: string, payerId: string | null) {
    const request = await this.requireRequest(tenantId, requestId);
    if (request.status !== OvertimeStatus.APPROVED) {
      throw new BadRequestException(
        'Solo se pueden marcar como pagadas las solicitudes aprobadas',
      );
    }
    const amount = num(request.amount);
    if (!(amount > 0)) {
      throw new BadRequestException('La solicitud no tiene un importe calculado');
    }
    request.status = OvertimeStatus.PAID;
    request.paid_amount = amount;
    request.paid_by = payerId;
    request.paid_at = new Date();
    await this.requestRepo.save(request);
    return this.presentOne(tenantId, request.id);
  }

  private async paginate(
    tenantId: string,
    query?: QueryOvertimeRequestDto,
    employeeId?: string,
  ) {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const qb = this.baseQuery(tenantId);
    if (employeeId) {
      qb.andWhere('ot.employee_id = :employeeId', { employeeId });
    }
    if (query?.status) {
      qb.andWhere('ot.status = :status', { status: query.status });
    }
    qb.orderBy('ot.work_date', 'DESC').addOrderBy('ot.start_time', 'DESC');

    const total = await qb.getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    const data = await this.presentRows(tenantId, rows);
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

  private baseQuery(tenantId: string) {
    return this.requestRepo
      .createQueryBuilder('ot')
      .leftJoin('ot.employee', 'employee')
      .leftJoin('employee.user', 'user')
      .addSelect([
        'employee.id',
        'employee.position',
        'employee.department',
        'employee.employee_code',
        'employee.monthly_salary',
        'user.first_name',
        'user.last_name',
        'user.email',
      ])
      .where('ot.tenant_id = :tenantId', { tenantId });
  }

  private async presentOne(tenantId: string, id: string) {
    const row = await this.baseQuery(tenantId)
      .andWhere('ot.id = :id', { id })
      .getOne();
    if (!row) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    const [view] = await this.presentRows(tenantId, [row]);
    return view;
  }

  private async presentRows(tenantId: string, rows: EmployeeOvertimeRequest[]) {
    const policy = await this.policyRules(tenantId);
    const names = await this.lookupNames(tenantId, rows);
    return rows.map((row) => this.toView(row, policy, names));
  }

  private toView(
    request: EmployeeOvertimeRequest,
    policy: OvertimePolicyRules,
    names: Map<string, string>,
  ) {
    const detail = asDetail(request.payment_detail);
    const hasPayment =
      request.status === OvertimeStatus.APPROVED ||
      request.status === OvertimeStatus.PAID;
    return {
      id: request.id,
      employee_id: request.employee_id,
      work_date: this.asIsoDate(request.work_date),
      start_time: request.start_time,
      end_time: request.end_time,
      requested_hours: num(request.requested_hours),
      reason: request.reason,
      notes: request.notes,
      status: request.status,
      approved_hours: request.approved_hours == null ? null : num(request.approved_hours),
      hourly_rate: request.hourly_rate == null ? null : num(request.hourly_rate),
      double_hours: request.double_hours == null ? null : num(request.double_hours),
      excess_hours: request.excess_hours == null ? null : num(request.excess_hours),
      amount: request.amount == null ? null : num(request.amount),
      paid_amount: request.paid_amount == null ? null : num(request.paid_amount),
      payment:
        hasPayment && request.amount != null
          ? {
              hourly_rate: num(request.hourly_rate),
              approved_hours: num(request.approved_hours),
              double_hours: num(request.double_hours),
              excess_hours: num(request.excess_hours),
              amount: num(request.amount),
              is_estimate: false,
              workday_hours: detail?.workday_hours ?? policy.workday_hours,
              daily_double_hours: detail?.daily_double_hours ?? policy.daily_double_hours,
              weekly_double_hours: detail?.weekly_double_hours ?? policy.weekly_double_hours,
              double_multiplier: detail?.double_multiplier ?? policy.double_multiplier,
              excess_multiplier: detail?.excess_multiplier ?? policy.excess_multiplier,
              prior_day_hours: detail?.prior_day_hours ?? 0,
              prior_week_hours: detail?.prior_week_hours ?? 0,
              week_start: detail?.week_start ?? null,
              week_end: detail?.week_end ?? null,
              daily_salary: detail?.daily_salary ?? null,
              monthly_salary: detail?.monthly_salary ?? null,
            }
          : null,
      reviewed_by: request.reviewed_by,
      reviewer_name: request.reviewed_by
        ? names.get(request.reviewed_by) ?? null
        : null,
      reviewed_at: request.reviewed_at,
      review_notes: request.review_notes,
      paid_by: request.paid_by,
      payer_name: request.paid_by ? names.get(request.paid_by) ?? null : null,
      paid_at: request.paid_at,
      created_by: request.created_by,
      created_at: request.created_at,
      updated_at: request.updated_at,
      employee: this.employeeSummary(request.employee, policy),
    };
  }

  private employeeSummary(
    employee: Employee | null | undefined,
    policy: OvertimePolicyRules,
  ) {
    if (!employee) return null;
    const monthly = Number(employee.monthly_salary);
    const hasSalary = Number.isFinite(monthly) && monthly > 0;
    return {
      id: employee.id,
      first_name: employee.user?.first_name ?? null,
      last_name: employee.user?.last_name ?? null,
      email: employee.user?.email ?? null,
      position: employee.position,
      department: employee.department,
      employee_code: employee.employee_code,
      monthly_salary: hasSalary ? round2(monthly) : null,
      daily_salary: hasSalary ? round2(monthly / 30) : null,
      hourly_rate: hasSalary
        ? round4(monthly / 30 / policy.workday_hours)
        : null,
    };
  }

  private async calculatePayment(
    tenantId: string,
    request: EmployeeOvertimeRequest,
    hours: number,
  ) {
    const employee =
      request.employee ??
      (await this.requireEmployee(tenantId, request.employee_id));
    const monthly = Number(employee.monthly_salary);
    if (!Number.isFinite(monthly) || monthly <= 0) {
      throw new BadRequestException(
        'No se puede autorizar el pago: el empleado no tiene salario mensual. Captúralo en su expediente.',
      );
    }
    const policy = await this.policyRules(tenantId);
    const workDate = this.asIsoDate(request.work_date);
    const prior = await this.authorizedHours(
      tenantId,
      request.employee_id,
      workDate,
      request.id,
    );
    const allocation = allocateOvertimePay({
      hours,
      monthlySalary: monthly,
      priorDayHours: prior.prior_day_hours,
      priorWeekHours: prior.prior_week_hours,
      policy,
    });
    const detail: OvertimePaymentDetail = {
      workday_hours: policy.workday_hours,
      daily_double_hours: policy.daily_double_hours,
      weekly_double_hours: policy.weekly_double_hours,
      double_multiplier: policy.double_multiplier,
      excess_multiplier: policy.excess_multiplier,
      prior_day_hours: prior.prior_day_hours,
      prior_week_hours: prior.prior_week_hours,
      week_start: prior.week_start,
      week_end: prior.week_end,
      daily_salary: allocation.daily_salary,
      monthly_salary: round2(monthly),
    };
    return {
      detail,
      view: {
        ...allocation,
        ...detail,
        approved_hours: hours,
      },
    };
  }

  private async authorizedHours(
    tenantId: string,
    employeeId: string,
    workDate: string,
    ignoreId?: string,
  ) {
    const range = weekRange(workDate);
    if (!range) {
      throw new BadRequestException('La fecha no es válida');
    }
    const rows = await this.requestRepo.find({
      where: {
        tenant_id: tenantId,
        employee_id: employeeId,
        status: In([OvertimeStatus.APPROVED, OvertimeStatus.PAID]),
        work_date: Between(range.week_start, range.week_end),
      },
    });
    let priorDay = 0;
    let priorWeek = 0;
    for (const row of rows) {
      if (ignoreId && row.id === ignoreId) continue;
      const hours = num(row.approved_hours);
      priorWeek += hours;
      if (this.asIsoDate(row.work_date) === workDate) priorDay += hours;
    }
    return {
      prior_day_hours: round2(priorDay),
      prior_week_hours: round2(priorWeek),
      week_start: range.week_start,
      week_end: range.week_end,
    };
  }

  private async assertNoOverlap(
    tenantId: string,
    employeeId: string,
    workDate: string,
    startTime: string,
    endTime: string,
    ignoreId?: string,
  ) {
    const previous = shiftIsoDate(workDate, -1);
    const next = shiftIsoDate(workDate, 1);
    if (!previous || !next) {
      throw new BadRequestException('La fecha no es válida');
    }
    const rows = await this.requestRepo
      .createQueryBuilder('ot')
      .where('ot.tenant_id = :tenantId', { tenantId })
      .andWhere('ot.employee_id = :employeeId', { employeeId })
      .andWhere('ot.work_date BETWEEN :previous AND :next', { previous, next })
      .andWhere('ot.status != :rejected', { rejected: OvertimeStatus.REJECTED })
      .getMany();
    const incoming = minuteRange(workDate, startTime, endTime);
    if (!incoming) {
      throw new BadRequestException('El horario no es válido');
    }
    for (const row of rows) {
      if (ignoreId && row.id === ignoreId) continue;
      const other = minuteRange(this.asIsoDate(row.work_date), row.start_time, row.end_time);
      if (other && rangesOverlap(incoming, other)) {
        throw new BadRequestException(
          `Ya hay una solicitud el ${this.asIsoDate(row.work_date)} de ${row.start_time} a ${row.end_time} que se empalma con ese horario`,
        );
      }
    }
  }

  private async policyRules(tenantId: string): Promise<OvertimePolicyRules> {
    const row = await this.policyRepo.findOne({
      where: { tenant_id: tenantId },
    });
    return row ? this.rulesFromRow(row) : { ...DEFAULT_OVERTIME_POLICY };
  }

  private rulesFromRow(row: EmployeeOvertimePolicy): OvertimePolicyRules {
    return {
      workday_hours: positiveOr(row.workday_hours, DEFAULT_OVERTIME_POLICY.workday_hours),
      daily_double_hours: nonNegativeOr(
        row.daily_double_hours,
        DEFAULT_OVERTIME_POLICY.daily_double_hours,
      ),
      weekly_double_hours: nonNegativeOr(
        row.weekly_double_hours,
        DEFAULT_OVERTIME_POLICY.weekly_double_hours,
      ),
      double_multiplier: positiveOr(
        row.double_multiplier,
        DEFAULT_OVERTIME_POLICY.double_multiplier,
      ),
      excess_multiplier: positiveOr(
        row.excess_multiplier,
        DEFAULT_OVERTIME_POLICY.excess_multiplier,
      ),
    };
  }

  private async lookupNames(
    tenantId: string,
    rows: EmployeeOvertimeRequest[],
  ): Promise<Map<string, string>> {
    const ids = [
      ...new Set(
        rows.flatMap((row) => [row.reviewed_by, row.paid_by].filter(Boolean) as string[]),
      ),
    ];
    const names = new Map<string, string>();
    if (!ids.length) return names;
    const users = await this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.first_name', 'user.last_name'])
      .where('user.tenant_id = :tenantId', { tenantId })
      .andWhere('user.id IN (:...ids)', { ids })
      .getMany();
    for (const user of users) {
      const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
      names.set(user.id, name || 'Usuario');
    }
    return names;
  }

  private async requireEmployee(tenantId: string, employeeId: string) {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, tenant_id: tenantId },
    });
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }
    return employee;
  }

  private async requireRequest(tenantId: string, requestId: string) {
    const request = await this.requestRepo.findOne({
      where: { id: requestId, tenant_id: tenantId },
      relations: { employee: { user: true } },
    });
    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    return request;
  }

  private assertCanWorkOvertime(employee: Employee) {
    if (employee.status === EmployeeStatus.TERMINATED) {
      throw new BadRequestException(
        'No se pueden registrar horas extras de un empleado dado de baja',
      );
    }
  }

  private assertOwner(request: EmployeeOvertimeRequest, ownerEmployeeId?: string) {
    if (ownerEmployeeId && request.employee_id !== ownerEmployeeId) {
      throw new ForbiddenException('No puedes modificar esta solicitud');
    }
  }

  private assertApprovedHours(hours: number) {
    if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
      throw new BadRequestException(
        'Las horas autorizadas deben ser mayores a 0 y no superar 24',
      );
    }
  }

  private parseSchedule(workDate: string, startTime: string, endTime: string) {
    const resolved = resolveOvertimeSchedule(workDate, startTime, endTime);
    if (!resolved.ok) {
      throw new BadRequestException(resolved.message);
    }
    return resolved.schedule;
  }

  private requireReason(value: string | undefined): string {
    const reason = value?.trim() ?? '';
    if (!reason) {
      throw new BadRequestException('El motivo es obligatorio');
    }
    if (reason.length > 500) {
      throw new BadRequestException('El motivo no puede superar 500 caracteres');
    }
    return reason;
  }

  private cleanText(value: string | null | undefined): string | null {
    const text = value?.trim() ?? '';
    return text ? text.slice(0, 500) : null;
  }

  private asIsoDate(value: string | Date): string {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return String(value).slice(0, 10);
  }
}

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function positiveOr(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeOr(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function asDetail(value: unknown): OvertimePaymentDetail | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as OvertimePaymentDetail;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object') {
    return value as OvertimePaymentDetail;
  }
  return null;
}
