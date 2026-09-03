// src/users/users.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignUserBranchDto } from './dto/assign-user-branch.dto';
import { UserStatus } from '../../entities/users/user-status.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { User } from '../../entities/users/user.entity';
import { UserBillingBranch } from '../../entities/users/user-billing-branch.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { PosUserType, canPosCollect, canPosSell } from '../../entities/users/pos-user-type.enum';
import { PosDailyShift } from '../../entities/pos/pos-daily-shift.entity';
import { PosDailyShiftStatus } from '../../entities/pos/pos-daily-shift-status.enum';
import { EmployeesService } from '../employees/employees.service';
import { UserManagerReport } from '../../entities/users/user-manager-report.entity';
import { UserWarehouseAssignment } from '../../entities/control-desk/user-warehouse-assignment.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { QueryUsersDto } from './dto/query-users.dto';
import {
  USER_STATUS_CODE,
  isActiveUserStatus,
} from './user-status.constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RBACTenant) private tenantRepo: Repository<RBACTenant>,
    @InjectRepository(UserStatus) private statusRepo: Repository<UserStatus>,
    @InjectRepository(BillingBranch)
    private branchRepo: Repository<BillingBranch>,
    @InjectRepository(UserBillingBranch)
    private branchAssignmentRepo: Repository<UserBillingBranch>,
    @InjectRepository(PosDailyShift)
    private dailyShiftRepo: Repository<PosDailyShift>,
    @InjectRepository(UserManagerReport)
    private managerReportRepo: Repository<UserManagerReport>,
    @InjectRepository(UserWarehouseAssignment)
    private warehouseAssignmentRepo: Repository<UserWarehouseAssignment>,
    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,
    private employeesService: EmployeesService,
  ) {}

  async create(dto: CreateUserDto, tenantId: string) {
    const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });
    const isPosUser = dto.is_pos_user ?? false;
    const assignment = this.resolveBranchAssignmentInput(dto) ?? {
      ids: dto.billing_branch_id ? [dto.billing_branch_id] : [],
      primary: dto.billing_branch_id ?? null,
      active: dto.billing_branch_id ?? null,
    };

    await this.validateBillingBranches(tenantId, assignment.ids);
    this.validateBranchAssignment(isPosUser, assignment.ids);
    this.validatePosUserType(isPosUser, dto.pos_user_type, dto.is_manager ?? false);
    await this.validatePosFields(tenantId, dto.pos_user_code);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const {
      is_pos_user,
      pos_user_code,
      billing_branch_id: _billing_branch_id,
      billing_branch_ids: _billing_branch_ids,
      primary_billing_branch_id: _primary_billing_branch_id,
      pos_user_type,
      is_employee,
      employee,
      is_manager,
      warehouse_ids,
      ...userFields
    } = dto;

    const user = await this.userRepo.save({
      ...userFields,
      password: hashedPassword,
      tenant: { id: tenantId },
      tenant_id: tenantId,
      status,
      permissions_version: 1,
      is_pos_user: isPosUser,
      pos_user_code: dto.pos_user_code ?? null,
      pos_user_type: isPosUser ? dto.pos_user_type ?? null : null,
      billing_branch_id: assignment.active,
      is_employee: false,
      is_manager: is_manager ?? false,
    });

    await this.replaceAssignedBranches(user.id, tenantId, assignment);

    if (dto.is_employee) {
      await this.employeesService.upsertForUser(tenantId, user.id, employee ?? {});
    }

    if (warehouse_ids) {
      await this.replaceAssignedWarehouses(user.id, tenantId, warehouse_ids);
    }

    const created = await this.findOne(user.id, tenantId);
    if (!created) {
      throw new NotFoundException('User not found after creation');
    }
    return created;
  }

  async update(id: string, dto: UpdateUserDto, tenantId: string) {
    const user = await this.userRepo.findOneByOrFail({
      id,
      tenant_id: tenantId,
    });

    if (dto.status_id) {
      const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });
      user.status = status;
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    const nextIsPosUser = dto.is_pos_user ?? user.is_pos_user;
    const assignment = this.resolveBranchAssignmentInput(dto, user.billing_branch_id);
    const currentAssignedIds = assignment
      ? assignment.ids
      : await this.loadAssignedBranchIds(id, tenantId);
    const nextBillingBranchId = assignment
      ? assignment.active
      : user.billing_branch_id;
    const nextPosCode =
      dto.pos_user_code !== undefined ? dto.pos_user_code : user.pos_user_code;
    const nextPosUserType =
      dto.pos_user_type !== undefined ? dto.pos_user_type : user.pos_user_type;
    const nextIsManager = dto.is_manager ?? Boolean(user.is_manager);

    if (assignment) {
      await this.validateBillingBranches(tenantId, assignment.ids);
    }

    if (
      dto.is_pos_user !== undefined ||
      assignment !== undefined ||
      dto.pos_user_type !== undefined ||
      dto.is_manager !== undefined
    ) {
      this.validateBranchAssignment(nextIsPosUser, currentAssignedIds);
      this.validatePosUserType(nextIsPosUser, nextPosUserType, nextIsManager);
    }

    if (dto.is_pos_user !== undefined || dto.pos_user_code !== undefined) {
      await this.validatePosFields(tenantId, nextPosCode, id);
    }

    await this.assertCobranzaConfigChangeAllowed(
      user,
      tenantId,
      nextIsPosUser,
      nextPosUserType,
      nextBillingBranchId,
    );

    const {
      is_pos_user,
      pos_user_code,
      billing_branch_id: _billing_branch_id,
      billing_branch_ids: _billing_branch_ids,
      primary_billing_branch_id: _primary_billing_branch_id,
      pos_user_type,
      is_employee,
      employee,
      is_manager,
      warehouse_ids,
      ...userFields
    } = dto;

    if (dto.is_pos_user === true) {
      user.is_pos_user = true;
      if (dto.pos_user_type !== undefined) {
        user.pos_user_type = dto.pos_user_type;
      }
    } else if (dto.is_pos_user === false) {
      user.is_pos_user = false;
      user.pos_user_type = null;
    } else if (dto.pos_user_type !== undefined && user.is_pos_user) {
      user.pos_user_type = dto.pos_user_type;
    }

    if (dto.pos_user_code !== undefined) {
      user.pos_user_code = dto.pos_user_code;
    }

    if (assignment) {
      user.billing_branch_id = assignment.active;
      await this.replaceAssignedBranches(id, tenantId, assignment);
      if (warehouse_ids === undefined) {
        await this.dropWarehousesOutsideBranches(id, tenantId, assignment.ids);
      }
    }

    if (is_manager !== undefined) {
      user.is_manager = is_manager;
    }

    Object.assign(user, userFields);
    await this.userRepo.save(user);

    // Perfil de empleado (tab "Empleado" del modal de usuario).
    if (dto.is_employee === true) {
      await this.employeesService.upsertForUser(tenantId, id, employee ?? {});
    } else if (dto.is_employee === false) {
      await this.employeesService.setEmployeeFlag(tenantId, id, false);
    } else if (employee) {
      await this.employeesService.upsertForUser(tenantId, id, employee);
    }

    if (warehouse_ids) {
      await this.replaceAssignedWarehouses(id, tenantId, warehouse_ids);
    }

    const updated = await this.findOne(id, tenantId);
    if (!updated) {
      throw new NotFoundException('User not found after update');
    }
    return updated;
  }

  /**
   * Cambia la contraseña propia, o la de cualquier usuario si el actor tiene User:Reset_Password.
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    tenantId: string,
    currentUserId: string,
    canResetOthers = false,
  ) {
    if (userId !== currentUserId && !canResetOthers) {
      throw new ForbiddenException(
        'No tienes permiso para cambiar la contraseña de otro usuario',
      );
    }

    if (dto.new_password !== dto.confirm_password) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const user = await this.userRepo.findOneBy({
      id: userId,
      tenant_id: tenantId,
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.password = await bcrypt.hash(dto.new_password, 10);
    await this.userRepo.save(user);

    return { message: 'Contraseña actualizada correctamente' };
  }

  async assignBranch(
    userId: string,
    tenantId: string,
    dto: AssignUserBranchDto | string | null,
  ) {
    const user = await this.userRepo.findOneByOrFail({
      id: userId,
      tenant_id: tenantId,
    });

    const input: AssignUserBranchDto =
      dto && typeof dto === 'object'
        ? dto
        : { billing_branch_id: dto ?? null };
    const assignment = this.resolveBranchAssignmentInput(
      input,
      user.billing_branch_id,
    ) ?? {
      ids: input.billing_branch_id ? [input.billing_branch_id] : [],
      primary: input.billing_branch_id ?? null,
      active: input.billing_branch_id ?? null,
    };

    await this.validateBillingBranches(tenantId, assignment.ids);
    this.validateBranchAssignment(user.is_pos_user, assignment.ids);
    await this.assertCobranzaConfigChangeAllowed(
      user,
      tenantId,
      Boolean(user.is_pos_user),
      user.pos_user_type,
      assignment.active,
    );

    user.billing_branch_id = assignment.active;
    await this.userRepo.save(user);
    await this.replaceAssignedBranches(userId, tenantId, assignment);
    await this.dropWarehousesOutsideBranches(userId, tenantId, assignment.ids);

    const updated = await this.findOne(userId, tenantId);
    if (!updated) {
      throw new NotFoundException('User not found after branch assignment');
    }
    return this.mapUserBranchResponse(updated);
  }

  async setActiveBranch(userId: string, tenantId: string, billingBranchId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId, tenant_id: tenantId },
      relations: ['billing_branch', 'billing_branch.fiscal_configuration'],
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const assignedIds = await this.loadAssignedBranchIds(userId, tenantId);
    if (!assignedIds.includes(billingBranchId)) {
      throw new BadRequestException(
        'La sucursal no está asignada a este usuario',
      );
    }

    await this.validateBillingBranch(tenantId, billingBranchId);

    if (user.billing_branch_id !== billingBranchId) {
      user.billing_branch_id = billingBranchId;
      await this.userRepo.save(user);
    }

    const updated = await this.findOne(userId, tenantId);
    if (!updated) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.mapUserBranchResponse(updated);
  }

  async getUserBranch(userId: string, tenantId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId, tenant_id: tenantId },
      relations: ['billing_branch', 'billing_branch.fiscal_configuration'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapUserBranchResponse(user);
  }

  async findAllStatuses(): Promise<UserStatus[]> {
    return this.statusRepo.find({ order: { id: 'ASC' } });
  }

  async findAll(tenantId: string, query?: QueryUsersDto) {
    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.status', 'status')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .leftJoinAndSelect('user.billing_branch', 'billing_branch')
      .leftJoinAndSelect('billing_branch.fiscal_configuration', 'fiscal_configuration')
      .where('user.tenant_id = :tenantId', { tenantId });

    if (query?.status_id) {
      qb.andWhere('user.status_id = :statusId', { statusId: query.status_id });
    } else {
      qb.andWhere(
        '(status.code IS NULL OR LOWER(status.code) != :deletedCode)',
        { deletedCode: USER_STATUS_CODE.DELETED },
      );
    }

    if (query?.role_id) {
      qb.innerJoin(
        'rbac_user_roles',
        'ur',
        'ur.user_id = user.id AND ur.tenant_id = :tenantId AND ur.role_id = :roleId',
        { tenantId, roleId: query.role_id },
      );
    }

    const search = query?.search?.trim();
    if (search) {
      qb.andWhere(
        '(user.email LIKE :q OR user.first_name LIKE :q OR user.last_name LIKE :q)',
        { q: `%${search}%` },
      );
    }

    qb.orderBy('user.first_name', 'ASC').addOrderBy('user.email', 'ASC');

    const users = await qb.getMany();

    const managerByUserId = await this.getManagerByUserIdMap(tenantId);
    const warehousesByUserId = await this.getAssignedWarehousesByUserIdMap(
      tenantId,
      users.map((user) => user.id),
    );
    const branchesByUserId = await this.getAssignedBranchesByUserIdMap(
      tenantId,
      users.map((user) => user.id),
    );
    for (const user of users) {
      (user as any).managerUser = managerByUserId.get(user.id) ?? null;
      (user as any).assignedWarehouses = warehousesByUserId.get(user.id) ?? [];
      (user as any).assignedBranches = branchesByUserId.get(user.id) ?? [];
    }

    return users;
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.userRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['status', 'tenant', 'billing_branch', 'billing_branch.fiscal_configuration'],
    });

    if (!user) {
      return user;
    }

    if (user.is_employee) {
      const employee = await this.employeesService.findEntityByUser(tenantId, id);
      if (employee) {
        (user as any).employeeProfile = await this.employeesService.mapEmployee(
          employee,
          { withRequests: false },
        );
      }
    }

    const assignment = await this.managerReportRepo.findOne({
      where: { tenant_id: tenantId, report_user_id: id },
      relations: ['manager'],
    });
    (user as any).managerUser = assignment?.manager ?? null;

    if (user.is_manager) {
      (user as any).managedUsers = await this.loadManagedUsers(id, tenantId);
    }

    (user as any).assignedWarehouses = await this.loadAssignedWarehouses(
      id,
      tenantId,
    );
    (user as any).assignedBranches = await this.loadAssignedBranches(
      id,
      tenantId,
    );

    return user;
  }

  async getManagerReports(managerUserId: string, tenantId: string) {
    const manager = await this.userRepo.findOne({
      where: { id: managerUserId, tenant_id: tenantId },
    });
    if (!manager) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const reports = await this.loadManagedUsers(managerUserId, tenantId);

    return {
      is_manager: Boolean(manager.is_manager),
      reports,
    };
  }

  async addManagerReport(
    managerUserId: string,
    reportUserId: string,
    tenantId: string,
  ) {
    const manager = await this.userRepo.findOne({
      where: { id: managerUserId, tenant_id: tenantId },
    });
    if (!manager) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (!manager.is_manager) {
      throw new BadRequestException(
        'Activa la opción de gerente para asignar usuarios a cargo',
      );
    }
    if (managerUserId === reportUserId) {
      throw new BadRequestException('Un gerente no puede asignarse a sí mismo');
    }

    const reportUser = await this.userRepo.findOne({
      where: { id: reportUserId, tenant_id: tenantId },
      relations: ['status'],
    });
    if (!reportUser) {
      throw new NotFoundException(
        'El usuario no existe o no pertenece a esta organización',
      );
    }

    const existing = await this.managerReportRepo.findOne({
      where: { tenant_id: tenantId, report_user_id: reportUserId },
    });
    if (existing) {
      if (existing.manager_user_id === managerUserId) {
        throw new ConflictException('Este usuario ya está a cargo de este gerente');
      }
      throw new ConflictException('Este usuario ya tiene un responsable asignado');
    }

    await this.managerReportRepo.save({
      tenant_id: tenantId,
      manager_user_id: managerUserId,
      report_user_id: reportUserId,
    });

    return this.mapManagedUser(reportUser);
  }

  async removeManagerReport(
    managerUserId: string,
    reportUserId: string,
    tenantId: string,
  ) {
    const assignment = await this.managerReportRepo.findOne({
      where: {
        tenant_id: tenantId,
        manager_user_id: managerUserId,
        report_user_id: reportUserId,
      },
    });

    if (!assignment) {
      throw new NotFoundException('El usuario no está a cargo de este gerente');
    }

    await this.managerReportRepo.remove(assignment);
  }

  async updateStatus(
    userId: string,
    tenantId: string,
    statusId: number,
    currentUserId: string,
  ) {
    const user = await this.userRepo.findOne({
      where: { id: userId, tenant_id: tenantId },
      relations: ['status'],
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const status = await this.statusRepo.findOneBy({ id: statusId });
    if (!status) {
      throw new BadRequestException('Estatus no válido');
    }

    if (userId === currentUserId && !isActiveUserStatus(status.code)) {
      throw new ForbiddenException(
        'No puedes desactivar o eliminar tu propia cuenta',
      );
    }

    user.status = status;
    if (status.code?.toLowerCase() === USER_STATUS_CODE.DELETED) {
      user.email = null;
    }
    await this.userRepo.save(user);

    const updated = await this.findOne(userId, tenantId);
    if (!updated) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return updated;
  }

  async softDelete(userId: string, tenantId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta');
    }

    const deleted = await this.statusRepo.findOne({
      where: { code: USER_STATUS_CODE.DELETED },
    });
    if (!deleted) {
      throw new BadRequestException('Estatus eliminado no está configurado');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId, tenant_id: tenantId },
      relations: ['status'],
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.status?.code?.toLowerCase() === USER_STATUS_CODE.DELETED) {
      throw new BadRequestException('El usuario ya está eliminado');
    }

    return this.updateStatus(userId, tenantId, deleted.id, currentUserId);
  }

  mapUserResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      status_id: user.status?.id ?? null,
      status: user.status,
      language_code: user.language_code,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      is_pos_user: Boolean(user.is_pos_user),
      pos_user_type: user.pos_user_type,
      pos_user_code: user.pos_user_code,
      pos_can_sell: Boolean(user.is_pos_user) && canPosSell(user.pos_user_type),
      pos_can_collect:
        Boolean(user.is_pos_user) && canPosCollect(user.pos_user_type),
      is_employee: Boolean(user.is_employee),
      employee: (user as any).employeeProfile ?? null,
      is_manager: Boolean(user.is_manager),
      manager: this.mapManagerSummary((user as any).managerUser),
      ...((user as any).managedUsers
        ? { reports: (user as any).managedUsers }
        : {}),
      ...this.mapUserBranchResponse(user),
      assigned_warehouses:
        (user as any).assignedWarehouses ?? [],
    };
  }

  async getAssignedWarehouses(userId: string, tenantId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId, tenant_id: tenantId },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return {
      assigned_warehouses: await this.loadAssignedWarehouses(userId, tenantId),
    };
  }

  async replaceAssignedWarehouses(
    userId: string,
    tenantId: string,
    warehouseIds: string[],
  ) {
    const user = await this.userRepo.findOne({
      where: { id: userId, tenant_id: tenantId },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const uniqueIds = [...new Set(warehouseIds)];
    const assignedBranchIds = await this.loadAssignedBranchIds(userId, tenantId);
    await this.assertWarehousesForUser(tenantId, assignedBranchIds, uniqueIds);

    await this.warehouseAssignmentRepo.delete({
      tenant_id: tenantId,
      user_id: userId,
    });

    if (uniqueIds.length) {
      await this.warehouseAssignmentRepo.save(
        uniqueIds.map((warehouseId) =>
          this.warehouseAssignmentRepo.create({
            tenant_id: tenantId,
            user_id: userId,
            warehouse_id: warehouseId,
          }),
        ),
      );
    }

    return this.getAssignedWarehouses(userId, tenantId);
  }

  mapUserBranchResponse(user: User) {
    const assigned =
      (user as any).assignedBranches ?? ([] as ReturnType<UsersService['mapAssignedBranch']>[]);
    const primary = assigned.find((row) => row.is_primary) ?? assigned[0] ?? null;
    return {
      billing_branch_id: user.billing_branch_id,
      billing_branch: user.billing_branch
        ? this.mapBillingBranch(user.billing_branch)
        : null,
      fiscal_configuration_id:
        user.billing_branch?.fiscal_configuration_id ?? null,
      primary_billing_branch_id: primary?.id ?? user.billing_branch_id ?? null,
      assigned_branches: assigned,
      can_switch_branch: assigned.length > 1,
      has_all_branches_access:
        assigned.length === 0 && user.billing_branch_id == null,
    };
  }

  private async loadAssignedWarehouses(userId: string, tenantId: string) {
    const rows = await this.warehouseAssignmentRepo.find({
      where: { tenant_id: tenantId, user_id: userId },
      relations: ['warehouse', 'warehouse.billing_branch'],
      order: { created_at: 'ASC' },
    });
    return rows.filter((row) => row.warehouse).map((row) => this.mapWarehouse(row.warehouse));
  }

  private async getAssignedWarehousesByUserIdMap(
    tenantId: string,
    userIds: string[],
  ) {
    const map = new Map<string, ReturnType<UsersService['mapWarehouse']>[]>();
    if (!userIds.length) {
      return map;
    }
    const rows = await this.warehouseAssignmentRepo.find({
      where: { tenant_id: tenantId, user_id: In(userIds) },
      relations: ['warehouse', 'warehouse.billing_branch'],
    });
    for (const row of rows) {
      if (!row.warehouse) {
        continue;
      }
      const list = map.get(row.user_id) ?? [];
      list.push(this.mapWarehouse(row.warehouse));
      map.set(row.user_id, list);
    }
    return map;
  }

  private async assertWarehousesForUser(
    tenantId: string,
    assignedBranchIds: string[],
    warehouseIds: string[],
  ) {
    if (!warehouseIds.length) {
      return;
    }
    const warehouses = await this.warehouseRepo.find({
      where: warehouseIds.map((id) => ({ id, tenant_id: tenantId })),
    });
    if (warehouses.length !== warehouseIds.length) {
      throw new BadRequestException(
        'Uno o más almacenes no existen o no pertenecen a la organización',
      );
    }
    if (assignedBranchIds.length) {
      const allowed = new Set(assignedBranchIds);
      const outside = warehouses.filter(
        (warehouse) =>
          !warehouse.billing_branch_id ||
          !allowed.has(warehouse.billing_branch_id),
      );
      if (outside.length) {
        throw new BadRequestException(
          'El almacén debe pertenecer a una sucursal asignada al usuario',
        );
      }
    }
  }

  private async dropWarehousesOutsideBranches(
    userId: string,
    tenantId: string,
    assignedBranchIds: string[],
  ) {
    if (!assignedBranchIds.length) {
      return;
    }
    const allowed = new Set(assignedBranchIds);
    const rows = await this.warehouseAssignmentRepo.find({
      where: { tenant_id: tenantId, user_id: userId },
      relations: ['warehouse', 'warehouse.billing_branch'],
    });
    const toRemove = rows.filter(
      (row) =>
        !row.warehouse?.billing_branch_id ||
        !allowed.has(row.warehouse.billing_branch_id),
    );
    if (toRemove.length) {
      await this.warehouseAssignmentRepo.remove(toRemove);
    }
  }

  private mapWarehouse(warehouse: Warehouse) {
    const branch = warehouse.billing_branch;
    return {
      id: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      billing_branch_id: warehouse.billing_branch_id,
      billing_branch: branch
        ? {
            id: branch.id,
            code: branch.code,
            display_name: [branch.code, branch.city].filter(Boolean).join(' — '),
          }
        : null,
    };
  }

  private mapBillingBranch(branch: BillingBranch) {
    return {
      id: branch.id,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      state: branch.state,
      country: branch.country,
      postal_code: branch.postal_code,
      fiscal_configuration_id: branch.fiscal_configuration_id,
      fiscal_configuration: branch.fiscal_configuration
        ? {
            id: branch.fiscal_configuration.id,
            razon_social: branch.fiscal_configuration.razon_social,
            rfc: branch.fiscal_configuration.rfc,
          }
        : null,
    };
  }

  private validatePosUserType(
    isPosUser: boolean,
    posUserType?: PosUserType | null,
    isManager = false,
  ) {
    if (!isPosUser) {
      if (posUserType) {
        throw new BadRequestException(
          'pos_user_type solo aplica cuando el usuario es de tipo POS',
        );
      }
      return;
    }

    if (!posUserType) {
      throw new BadRequestException(
        'pos_user_type es requerido cuando is_pos_user es true (VENTAS, COBRANZA o AMBOS)',
      );
    }

    if (posUserType === PosUserType.AMBOS && !isManager) {
      throw new BadRequestException(
        'Solo un gerente puede tener POS de ventas y cobranza (AMBOS)',
      );
    }
  }

  private validateBranchAssignment(isPosUser: boolean, assignedBranchIds: string[]) {
    if (isPosUser && assignedBranchIds.length === 0) {
      throw new BadRequestException(
        'Los usuarios POS deben tener al menos una sucursal asignada',
      );
    }
  }

  private async assertCobranzaConfigChangeAllowed(
    user: User,
    tenantId: string,
    nextIsPosUser: boolean,
    nextPosUserType: PosUserType | null,
    nextBillingBranchId: string | null,
  ) {
    if (!canPosCollect(user.pos_user_type)) {
      return;
    }

    const hasOpenShift = await this.hasOpenDailyShift(user.id, tenantId);
    if (!hasOpenShift) {
      return;
    }

    const configChanging =
      nextIsPosUser !== Boolean(user.is_pos_user) ||
      nextPosUserType !== user.pos_user_type ||
      nextBillingBranchId !== user.billing_branch_id;

    if (configChanging) {
      throw new BadRequestException(
        'No se puede cambiar el tipo POS ni la sucursal mientras hay un corte global abierto. Cierra el corte primero.',
      );
    }
  }

  private async hasOpenDailyShift(terminalUserId: string, tenantId: string) {
    const shiftDate = new Date().toISOString().slice(0, 10);

    const count = await this.dailyShiftRepo.count({
      where: {
        tenant_id: tenantId,
        terminal_user_id: terminalUserId,
        shift_date: shiftDate,
        status: PosDailyShiftStatus.OPEN,
      },
    });

    return count > 0;
  }

  private resolveBranchAssignmentInput(
    dto: {
      billing_branch_id?: string | null;
      billing_branch_ids?: string[];
      primary_billing_branch_id?: string | null;
    },
    currentActive?: string | null,
  ): { ids: string[]; primary: string | null; active: string | null } | undefined {
    if (
      dto.billing_branch_ids === undefined &&
      dto.billing_branch_id === undefined &&
      dto.primary_billing_branch_id === undefined
    ) {
      return undefined;
    }

    let ids: string[];
    if (dto.billing_branch_ids !== undefined) {
      ids = [...new Set(dto.billing_branch_ids.filter((id): id is string => !!id))];
    } else if (dto.billing_branch_id) {
      ids = [dto.billing_branch_id];
    } else {
      ids = [];
    }

    const requestedPrimary =
      dto.primary_billing_branch_id ?? dto.billing_branch_id ?? null;
    const primary =
      (requestedPrimary && ids.includes(requestedPrimary)
        ? requestedPrimary
        : null) ??
      ids[0] ??
      null;
    const active =
      (currentActive && ids.includes(currentActive) ? currentActive : null) ??
      primary;

    if (ids.length > 0 && dto.primary_billing_branch_id && !primary) {
      throw new BadRequestException(
        'La sucursal principal debe estar en las sucursales asignadas',
      );
    }

    return { ids, primary, active };
  }

  private async replaceAssignedBranches(
    userId: string,
    tenantId: string,
    assignment: { ids: string[]; primary: string | null },
  ) {
    await this.branchAssignmentRepo.delete({
      tenant_id: tenantId,
      user_id: userId,
    });

    if (!assignment.ids.length) {
      return;
    }

    await this.branchAssignmentRepo.save(
      assignment.ids.map((billingBranchId) =>
        this.branchAssignmentRepo.create({
          tenant_id: tenantId,
          user_id: userId,
          billing_branch_id: billingBranchId,
          is_primary: billingBranchId === assignment.primary,
        }),
      ),
    );
  }

  private async loadAssignedBranchIds(userId: string, tenantId: string) {
    const rows = await this.branchAssignmentRepo.find({
      where: { tenant_id: tenantId, user_id: userId },
    });
    return rows.map((row) => row.billing_branch_id);
  }

  private async loadAssignedBranches(userId: string, tenantId: string) {
    const rows = await this.branchAssignmentRepo.find({
      where: { tenant_id: tenantId, user_id: userId },
      relations: ['billing_branch', 'billing_branch.fiscal_configuration'],
      order: { created_at: 'ASC' },
    });
    return rows
      .filter((row) => row.billing_branch)
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
      .map((row) => this.mapAssignedBranch(row));
  }

  private async getAssignedBranchesByUserIdMap(tenantId: string, userIds: string[]) {
    const map = new Map<string, ReturnType<UsersService['mapAssignedBranch']>[]>();
    if (!userIds.length) {
      return map;
    }
    const rows = await this.branchAssignmentRepo.find({
      where: { tenant_id: tenantId, user_id: In(userIds) },
      relations: ['billing_branch', 'billing_branch.fiscal_configuration'],
    });
    for (const row of rows) {
      if (!row.billing_branch) {
        continue;
      }
      const list = map.get(row.user_id) ?? [];
      list.push(this.mapAssignedBranch(row));
      map.set(row.user_id, list);
    }
    for (const [userId, list] of map) {
      list.sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
      map.set(userId, list);
    }
    return map;
  }

  private mapAssignedBranch(row: UserBillingBranch) {
    const branch = row.billing_branch;
    return {
      id: branch.id,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      state: branch.state,
      display_name: [branch.code, branch.city].filter(Boolean).join(' — '),
      name: [branch.code, branch.city].filter(Boolean).join(' — '),
      is_primary: Boolean(row.is_primary),
      fiscal_configuration_id: branch.fiscal_configuration_id,
      fiscal_configuration: branch.fiscal_configuration
        ? {
            id: branch.fiscal_configuration.id,
            razon_social: branch.fiscal_configuration.razon_social,
            rfc: branch.fiscal_configuration.rfc,
          }
        : null,
    };
  }

  private async validateBillingBranches(tenantId: string, billingBranchIds: string[]) {
    for (const billingBranchId of billingBranchIds) {
      await this.validateBillingBranch(tenantId, billingBranchId);
    }
  }

  private async validateBillingBranch(
    tenantId: string,
    billingBranchId?: string | null,
  ) {
    if (!billingBranchId) {
      return;
    }

    const branch = await this.branchRepo
      .createQueryBuilder('branch')
      .innerJoin('branch.fiscal_configuration', 'fc')
      .where('branch.id = :billingBranchId', { billingBranchId })
      .andWhere('fc.tenant_id = :tenantId', { tenantId })
      .getOne();

    if (!branch) {
      throw new NotFoundException(
        'La sucursal no existe o no pertenece al tenant',
      );
    }
  }

  private async validatePosFields(
    tenantId: string,
    posUserCode?: number | null,
    excludeUserId?: string,
  ) {
    if (posUserCode == null) {
      return;
    }

    const query = this.userRepo
      .createQueryBuilder('user')
      .where('user.tenant_id = :tenantId', { tenantId })
      .andWhere('user.pos_user_code = :posUserCode', { posUserCode });

    if (excludeUserId) {
      query.andWhere('user.id != :excludeUserId', { excludeUserId });
    }

    const existing = await query.getOne();
    if (existing) {
      throw new ConflictException(
        `El código ${posUserCode} ya está asignado a otro usuario`,
      );
    }
  }

  private async getManagerByUserIdMap(tenantId: string) {
    const assignments = await this.managerReportRepo.find({
      where: { tenant_id: tenantId },
      relations: ['manager'],
    });

    return new Map(
      assignments.map((row) => [row.report_user_id, row.manager]),
    );
  }

  private async loadManagedUsers(managerUserId: string, tenantId: string) {
    const rows = await this.managerReportRepo.find({
      where: { tenant_id: tenantId, manager_user_id: managerUserId },
      relations: ['report', 'report.status'],
      order: { created_at: 'ASC' },
    });

    return rows.map((row) => this.mapManagedUser(row.report));
  }

  private mapManagedUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      status: user.status,
    };
  }

  private mapManagerSummary(manager?: User | null) {
    if (!manager) {
      return null;
    }

    return {
      id: manager.id,
      email: manager.email,
      first_name: manager.first_name,
      last_name: manager.last_name,
    };
  }
}
