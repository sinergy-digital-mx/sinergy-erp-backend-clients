// src/users/users.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatus } from '../../entities/users/user-status.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { User } from '../../entities/users/user.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { PosUserType } from '../../entities/users/pos-user-type.enum';
import { PosDailyShift } from '../../entities/pos/pos-daily-shift.entity';
import { PosDailyShiftStatus } from '../../entities/pos/pos-daily-shift-status.enum';
import { EmployeesService } from '../employees/employees.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RBACTenant) private tenantRepo: Repository<RBACTenant>,
    @InjectRepository(UserStatus) private statusRepo: Repository<UserStatus>,
    @InjectRepository(BillingBranch)
    private branchRepo: Repository<BillingBranch>,
    @InjectRepository(PosDailyShift)
    private dailyShiftRepo: Repository<PosDailyShift>,
    private employeesService: EmployeesService,
  ) {}

  async create(dto: CreateUserDto, tenantId: string) {
    const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });
    const isPosUser = dto.is_pos_user ?? false;
    const billingBranchId = dto.billing_branch_id ?? null;

    await this.validateBillingBranch(tenantId, billingBranchId);
    this.validateBranchAssignment(isPosUser, billingBranchId);
    this.validatePosUserType(isPosUser, dto.pos_user_type);
    await this.validatePosFields(tenantId, isPosUser, dto.pos_user_code);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const {
      is_pos_user,
      pos_user_code,
      billing_branch_id,
      pos_user_type,
      is_employee,
      employee,
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
      pos_user_code: isPosUser ? null : dto.pos_user_code ?? null,
      pos_user_type: isPosUser ? dto.pos_user_type ?? null : null,
      billing_branch_id: billingBranchId,
      is_employee: false,
    });

    if (dto.is_employee) {
      await this.employeesService.upsertForUser(tenantId, user.id, employee ?? {});
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
    const nextBillingBranchId =
      dto.billing_branch_id !== undefined
        ? dto.billing_branch_id
        : user.billing_branch_id;
    const nextPosCode =
      dto.pos_user_code !== undefined ? dto.pos_user_code : user.pos_user_code;
    const nextPosUserType =
      dto.pos_user_type !== undefined ? dto.pos_user_type : user.pos_user_type;

    if (dto.billing_branch_id !== undefined) {
      await this.validateBillingBranch(tenantId, dto.billing_branch_id);
    }

    if (
      dto.is_pos_user !== undefined ||
      dto.billing_branch_id !== undefined ||
      dto.pos_user_type !== undefined
    ) {
      this.validateBranchAssignment(nextIsPosUser, nextBillingBranchId);
      this.validatePosUserType(nextIsPosUser, nextPosUserType);
    }

    if (dto.is_pos_user !== undefined || dto.pos_user_code !== undefined) {
      await this.validatePosFields(tenantId, nextIsPosUser, nextPosCode, id);
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
      billing_branch_id,
      pos_user_type,
      is_employee,
      employee,
      ...userFields
    } = dto;

    if (dto.is_pos_user === true) {
      user.is_pos_user = true;
      user.pos_user_code = null;
      if (dto.pos_user_type !== undefined) {
        user.pos_user_type = dto.pos_user_type;
      }
    } else if (dto.is_pos_user === false) {
      user.is_pos_user = false;
      user.pos_user_type = null;
      if (dto.pos_user_code !== undefined) {
        user.pos_user_code = dto.pos_user_code;
      }
    } else if (dto.pos_user_type !== undefined && user.is_pos_user) {
      user.pos_user_type = dto.pos_user_type;
    } else if (dto.pos_user_code !== undefined && !user.is_pos_user) {
      user.pos_user_code = dto.pos_user_code;
    }

    if (dto.billing_branch_id !== undefined) {
      user.billing_branch_id = dto.billing_branch_id;
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

    const updated = await this.findOne(id, tenantId);
    if (!updated) {
      throw new NotFoundException('User not found after update');
    }
    return updated;
  }

  /**
   * Cambia la contraseña solo si el usuario editado es el mismo que el autenticado.
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    tenantId: string,
    currentUserId: string,
  ) {
    if (userId !== currentUserId) {
      throw new ForbiddenException(
        'Solo puedes cambiar la contraseña de tu propia cuenta',
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
    billingBranchId: string | null,
  ) {
    const user = await this.userRepo.findOneByOrFail({
      id: userId,
      tenant_id: tenantId,
    });

    await this.validateBillingBranch(tenantId, billingBranchId);
    this.validateBranchAssignment(user.is_pos_user, billingBranchId);

    user.billing_branch_id = billingBranchId;
    await this.userRepo.save(user);

    const updated = await this.findOne(userId, tenantId);
    if (!updated) {
      throw new NotFoundException('User not found after branch assignment');
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

  findAll(tenantId: string) {
    return this.userRepo.find({
      where: { tenant_id: tenantId },
      relations: ['status', 'tenant', 'billing_branch', 'billing_branch.fiscal_configuration'],
    });
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.userRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['status', 'tenant', 'billing_branch', 'billing_branch.fiscal_configuration'],
    });

    if (user && user.is_employee) {
      const employee = await this.employeesService.findEntityByUser(tenantId, id);
      if (employee) {
        (user as any).employeeProfile = await this.employeesService.mapEmployee(
          employee,
          { withRequests: false },
        );
      }
    }

    return user;
  }

  mapUserResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      status: user.status,
      language_code: user.language_code,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      is_pos_user: Boolean(user.is_pos_user),
      pos_user_type: user.pos_user_type,
      pos_user_code: user.pos_user_code,
      is_employee: Boolean(user.is_employee),
      employee: (user as any).employeeProfile ?? null,
      ...this.mapUserBranchResponse(user),
    };
  }

  mapUserBranchResponse(user: User) {
    return {
      billing_branch_id: user.billing_branch_id,
      billing_branch: user.billing_branch
        ? this.mapBillingBranch(user.billing_branch)
        : null,
      has_all_branches_access: user.billing_branch_id == null,
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

  private validatePosUserType(isPosUser: boolean, posUserType?: PosUserType | null) {
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
        'pos_user_type es requerido cuando is_pos_user es true (VENTAS o COBRANZA)',
      );
    }
  }

  private validateBranchAssignment(
    isPosUser: boolean,
    billingBranchId?: string | null,
  ) {
    if (isPosUser && !billingBranchId) {
      throw new BadRequestException(
        'Los usuarios POS deben tener exactamente una sucursal asignada',
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
    if (user.pos_user_type !== PosUserType.COBRANZA) {
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
    isPosUser: boolean,
    posUserCode?: number | null,
    excludeUserId?: string,
  ) {
    if (isPosUser) {
      if (posUserCode != null) {
        throw new BadRequestException(
          'pos_user_code no aplica cuando el usuario es de tipo POS',
        );
      }
      return;
    }

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
}
