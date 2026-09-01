import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../entities/employees/employee.entity';
import { EmployeeLeaveRequest } from '../../entities/employees/employee-leave-request.entity';
import { LeaveType } from '../../entities/employees/leave-type.enum';
import { LeaveStatus } from '../../entities/employees/leave-status.enum';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { QueryLeaveRequestDto } from './dto/query-leave-request.dto';
import { EmployeesService, mapLeaveRequest } from './employees.service';
import { resolveLeaveDays } from './utils/mexican-labor-law';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';

@Injectable()
export class EmployeeLeaveService {
  constructor(
    @InjectRepository(EmployeeLeaveRequest)
    private readonly leaveRepo: Repository<EmployeeLeaveRequest>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly employeesService: EmployeesService,
  ) {}

  // ---------------------------------------------------------------------------
  // Crear solicitud (por RH a nombre de un empleado, o por el propio empleado).
  // ---------------------------------------------------------------------------
  async create(
    tenantId: string,
    employeeId: string,
    dto: CreateLeaveRequestDto,
    createdBy: string | null,
  ) {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, tenant_id: tenantId },
    });
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    const start = new Date(dto.start_date);
    const end = new Date(dto.end_date);
    if (end < start) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la de inicio',
      );
    }

    const { days } = this.resolveDays({
      type: dto.type,
      startDate: dto.start_date,
      endDate: dto.end_date,
      days: dto.days,
      countWeekends: dto.count_weekends,
    });

    // Para vacaciones, validar que no exceda los días disponibles.
    if (dto.type === LeaveType.VACATION) {
      const summary = await this.employeesService.getVacationSummary(employee);
      if (days > summary.available_days) {
        throw new BadRequestException(
          `Días de vacaciones insuficientes. Disponibles: ${summary.available_days}, solicitados: ${days}`,
        );
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
      status: LeaveStatus.PENDING,
      created_by: createdBy,
    });

    const saved = await this.leaveRepo.save(request);
    return mapLeaveRequest(saved);
  }

  // ---------------------------------------------------------------------------
  // Listados.
  // ---------------------------------------------------------------------------
  async findAll(tenantId: string, query?: QueryLeaveRequestDto) {
    return this.paginate(tenantId, query);
  }

  async findAllByEmployee(
    tenantId: string,
    employeeId: string,
    query?: QueryLeaveRequestDto,
  ) {
    return this.paginate(tenantId, query, employeeId);
  }

  private async paginate(
    tenantId: string,
    query?: QueryLeaveRequestDto,
    employeeId?: string,
  ) {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;
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
      ...mapLeaveRequest(r),
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

  async findOne(tenantId: string, id: string) {
    const request = await this.leaveRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    return request;
  }

  // ---------------------------------------------------------------------------
  // Resolución (aprobar/rechazar) — módulo Empleados.
  // ---------------------------------------------------------------------------
  async review(
    tenantId: string,
    id: string,
    dto: ReviewLeaveRequestDto,
    reviewerId: string | null,
  ) {
    const request = await this.findOne(tenantId, id);

    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden resolver solicitudes en estatus pendiente',
      );
    }
    if (
      dto.status !== LeaveStatus.APPROVED &&
      dto.status !== LeaveStatus.REJECTED
    ) {
      throw new BadRequestException('El estatus debe ser approved o rejected');
    }

    request.status = dto.status;
    request.review_notes = dto.review_notes ?? null;
    request.reviewed_by = reviewerId;
    request.reviewed_at = new Date();

    const saved = await this.leaveRepo.save(request);
    return mapLeaveRequest(saved);
  }

  // ---------------------------------------------------------------------------
  // Cancelación (por RH o por el propio empleado sobre solicitudes pendientes).
  // ---------------------------------------------------------------------------
  async cancel(tenantId: string, id: string, requesterEmployeeId?: string) {
    const request = await this.findOne(tenantId, id);

    if (
      requesterEmployeeId &&
      request.employee_id !== requesterEmployeeId
    ) {
      throw new ForbiddenException('No puedes cancelar solicitudes de otro empleado');
    }
    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden cancelar solicitudes pendientes',
      );
    }

    request.status = LeaveStatus.CANCELLED;
    const saved = await this.leaveRepo.save(request);
    return mapLeaveRequest(saved);
  }

  // ---------------------------------------------------------------------------
  // Corrección de fechas/días (RH). Permite ajustar un rango que contó
  // naturales (p. ej. 9) a hábiles (7) sin recrear la solicitud.
  // ---------------------------------------------------------------------------
  async update(
    tenantId: string,
    id: string,
    dto: UpdateLeaveRequestDto,
  ) {
    const request = await this.findOne(tenantId, id);

    if (
      request.status === LeaveStatus.CANCELLED ||
      request.status === LeaveStatus.REJECTED
    ) {
      throw new BadRequestException(
        'No se pueden editar solicitudes canceladas o rechazadas',
      );
    }

    const startDate = dto.start_date ?? request.start_date;
    const endDate = dto.end_date ?? request.end_date;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la de inicio',
      );
    }

    const datesChanged =
      dto.start_date !== undefined || dto.end_date !== undefined;
    const shouldRecalculate =
      datesChanged || dto.count_weekends !== undefined;
    const { days } = this.resolveDays({
      type: request.type,
      startDate,
      endDate,
      days: dto.days ?? (shouldRecalculate ? undefined : Number(request.days)),
      countWeekends: dto.count_weekends,
    });

    if (request.type === LeaveType.VACATION) {
      const employee = await this.employeeRepo.findOne({
        where: { id: request.employee_id, tenant_id: tenantId },
      });
      if (!employee) {
        throw new NotFoundException('Empleado no encontrado');
      }
      const summary = await this.employeesService.getVacationSummary(employee);
      const alreadyCounted =
        request.status === LeaveStatus.APPROVED ||
        request.status === LeaveStatus.PENDING
          ? Number(request.days)
          : 0;
      const availableWithoutThis = summary.available_days + alreadyCounted;
      if (days > availableWithoutThis) {
        throw new BadRequestException(
          `Días de vacaciones insuficientes. Disponibles: ${availableWithoutThis}, solicitados: ${days}`,
        );
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
    return mapLeaveRequest(saved);
  }

  private resolveDays(params: {
    type: string;
    startDate: string;
    endDate: string;
    days?: number;
    countWeekends?: boolean;
  }) {
    try {
      return resolveLeaveDays(params);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'No se pudieron calcular los días',
      );
    }
  }
}
