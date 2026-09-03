import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from '../../entities/users/user.entity';
import { UserBillingBranch } from '../../entities/users/user-billing-branch.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { UserStatus } from '../../entities/users/user-status.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { PosDailyShift } from '../../entities/pos/pos-daily-shift.entity';
import { UserManagerReport } from '../../entities/users/user-manager-report.entity';
import { UserWarehouseAssignment } from '../../entities/control-desk/user-warehouse-assignment.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { EmployeesService } from '../employees/employees.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsersService.changePassword', () => {
  let service: UsersService;
  let userRepo: { findOneBy: jest.Mock; save: jest.Mock };

  const tenantId = 'tenant-1';
  const userId = 'user-1';

  beforeEach(async () => {
    userRepo = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(UserBillingBranch), useValue: { find: jest.fn().mockResolvedValue([]), delete: jest.fn(), save: jest.fn(), create: jest.fn() } },
        { provide: getRepositoryToken(RBACTenant), useValue: {} },
        { provide: getRepositoryToken(UserStatus), useValue: {} },
        { provide: getRepositoryToken(BillingBranch), useValue: {} },
        { provide: getRepositoryToken(PosDailyShift), useValue: {} },
        { provide: getRepositoryToken(UserManagerReport), useValue: {} },
        { provide: getRepositoryToken(UserWarehouseAssignment), useValue: { find: jest.fn().mockResolvedValue([]) } },
        { provide: getRepositoryToken(Warehouse), useValue: {} },
        { provide: EmployeesService, useValue: {} },
      ],
    }).compile();

    service = module.get(UsersService);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');
  });

  it('updates password when the edited user is the logged-in user', async () => {
    const user = { id: userId, tenant_id: tenantId, password: 'old-hash' };
    userRepo.findOneBy.mockResolvedValue(user);
    userRepo.save.mockResolvedValue(user);

    const result = await service.changePassword(
      userId,
      { new_password: 'NuevaClave123', confirm_password: 'NuevaClave123' },
      tenantId,
      userId,
    );

    expect(bcrypt.hash).toHaveBeenCalledWith('NuevaClave123', 10);
    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'hashed-new-password' }),
    );
    expect(result).toEqual({ message: 'Contraseña actualizada correctamente' });
  });

  it('rejects changing another user password without Reset_Password', async () => {
    await expect(
      service.changePassword(
        'other-user',
        { new_password: 'NuevaClave123', confirm_password: 'NuevaClave123' },
        tenantId,
        userId,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(userRepo.findOneBy).not.toHaveBeenCalled();
  });

  it('updates another user password when Reset_Password is granted', async () => {
    const otherUserId = 'other-user';
    const user = { id: otherUserId, tenant_id: tenantId, password: 'old-hash' };
    userRepo.findOneBy.mockResolvedValue(user);
    userRepo.save.mockResolvedValue(user);

    const result = await service.changePassword(
      otherUserId,
      { new_password: 'NuevaClave123', confirm_password: 'NuevaClave123' },
      tenantId,
      userId,
      true,
    );

    expect(bcrypt.hash).toHaveBeenCalledWith('NuevaClave123', 10);
    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'hashed-new-password' }),
    );
    expect(result).toEqual({ message: 'Contraseña actualizada correctamente' });
  });

  it('rejects when passwords do not match', async () => {
    await expect(
      service.changePassword(
        userId,
        { new_password: 'NuevaClave123', confirm_password: 'OtraClave123' },
        tenantId,
        userId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when user does not exist', async () => {
    userRepo.findOneBy.mockResolvedValue(null);

    await expect(
      service.changePassword(
        userId,
        { new_password: 'NuevaClave123', confirm_password: 'NuevaClave123' },
        tenantId,
        userId,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('UsersService.managerReports', () => {
  let service: UsersService;
  let userRepo: { findOne: jest.Mock };
  let managerReportRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  const tenantId = 'tenant-1';
  const managerId = 'manager-1';
  const reportId = 'user-2';

  beforeEach(async () => {
    userRepo = { findOne: jest.fn() };
    managerReportRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(UserBillingBranch), useValue: { find: jest.fn().mockResolvedValue([]), delete: jest.fn(), save: jest.fn(), create: jest.fn() } },
        { provide: getRepositoryToken(RBACTenant), useValue: {} },
        { provide: getRepositoryToken(UserStatus), useValue: {} },
        { provide: getRepositoryToken(BillingBranch), useValue: {} },
        { provide: getRepositoryToken(PosDailyShift), useValue: {} },
        { provide: getRepositoryToken(UserManagerReport), useValue: managerReportRepo },
        { provide: getRepositoryToken(UserWarehouseAssignment), useValue: { find: jest.fn().mockResolvedValue([]) } },
        { provide: getRepositoryToken(Warehouse), useValue: {} },
        { provide: EmployeesService, useValue: {} },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('adds a user under a manager', async () => {
    const reportUser = {
      id: reportId,
      email: 'ana@mzn.mx',
      first_name: 'Ana',
      last_name: 'López',
      phone: null,
      status: { id: 1, code: 'active', name: 'Active' },
    };

    userRepo.findOne
      .mockResolvedValueOnce({ id: managerId, tenant_id: tenantId, is_manager: true })
      .mockResolvedValueOnce(reportUser);
    managerReportRepo.findOne.mockResolvedValue(null);
    managerReportRepo.save.mockResolvedValue({});

    const result = await service.addManagerReport(managerId, reportId, tenantId);

    expect(managerReportRepo.save).toHaveBeenCalledWith({
      tenant_id: tenantId,
      manager_user_id: managerId,
      report_user_id: reportId,
    });
    expect(result).toEqual({
      id: reportId,
      email: 'ana@mzn.mx',
      first_name: 'Ana',
      last_name: 'López',
      phone: null,
      status: { id: 1, code: 'active', name: 'Active' },
    });
  });

  it('rejects assigning a user when the target is not a manager', async () => {
    userRepo.findOne.mockResolvedValue({
      id: managerId,
      tenant_id: tenantId,
      is_manager: false,
    });

    await expect(
      service.addManagerReport(managerId, reportId, tenantId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects assigning the manager to themselves', async () => {
    userRepo.findOne.mockResolvedValue({
      id: managerId,
      tenant_id: tenantId,
      is_manager: true,
    });

    await expect(
      service.addManagerReport(managerId, managerId, tenantId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when the user already has a manager', async () => {
    userRepo.findOne
      .mockResolvedValueOnce({ id: managerId, tenant_id: tenantId, is_manager: true })
      .mockResolvedValueOnce({ id: reportId, tenant_id: tenantId, status: {} });
    managerReportRepo.findOne.mockResolvedValue({
      manager_user_id: 'other-manager',
    });

    await expect(
      service.addManagerReport(managerId, reportId, tenantId),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists users assigned to a manager', async () => {
    userRepo.findOne.mockResolvedValue({
      id: managerId,
      tenant_id: tenantId,
      is_manager: true,
    });
    managerReportRepo.find.mockResolvedValue([
      {
        report: {
          id: reportId,
          email: 'ana@mzn.mx',
          first_name: 'Ana',
          last_name: 'López',
          phone: null,
          status: { id: 1 },
        },
      },
    ]);

    const result = await service.getManagerReports(managerId, tenantId);

    expect(result.is_manager).toBe(true);
    expect(result.reports).toHaveLength(1);
    expect(result.reports[0].id).toBe(reportId);
  });

  it('removes a user from a manager', async () => {
    const assignment = { id: 'rel-1' };
    managerReportRepo.findOne.mockResolvedValue(assignment);
    managerReportRepo.remove.mockResolvedValue(assignment);

    await service.removeManagerReport(managerId, reportId, tenantId);

    expect(managerReportRepo.remove).toHaveBeenCalledWith(assignment);
  });
});

describe('UsersService.userStatus', () => {
  let service: UsersService;
  let userRepo: { findOne: jest.Mock; save: jest.Mock };
  let statusRepo: { findOne: jest.Mock; findOneBy: jest.Mock };
  let managerReportRepo: { findOne: jest.Mock; find: jest.Mock };

  const tenantId = 'tenant-1';
  const actorId = 'admin-1';
  const targetId = 'user-2';

  beforeEach(async () => {
    userRepo = { findOne: jest.fn(), save: jest.fn() };
    statusRepo = { findOne: jest.fn(), findOneBy: jest.fn() };
    managerReportRepo = { findOne: jest.fn(), find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(UserBillingBranch), useValue: { find: jest.fn().mockResolvedValue([]), delete: jest.fn(), save: jest.fn(), create: jest.fn() } },
        { provide: getRepositoryToken(RBACTenant), useValue: {} },
        { provide: getRepositoryToken(UserStatus), useValue: statusRepo },
        { provide: getRepositoryToken(BillingBranch), useValue: {} },
        { provide: getRepositoryToken(PosDailyShift), useValue: {} },
        { provide: getRepositoryToken(UserManagerReport), useValue: managerReportRepo },
        { provide: getRepositoryToken(UserWarehouseAssignment), useValue: { find: jest.fn().mockResolvedValue([]) } },
        { provide: getRepositoryToken(Warehouse), useValue: {} },
        { provide: EmployeesService, useValue: {} },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('updates status to inactive', async () => {
    const inactive = { id: 2, code: 'inactive', name: 'Inactivo' };
    const user = {
      id: targetId,
      tenant_id: tenantId,
      is_employee: false,
      is_manager: false,
      status: { id: 1, code: 'active' },
    };

    userRepo.findOne
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce({ ...user, status: inactive });
    statusRepo.findOneBy.mockResolvedValue(inactive);
    userRepo.save.mockResolvedValue(user);
    managerReportRepo.findOne.mockResolvedValue(null);

    const result = await service.updateStatus(targetId, tenantId, 2, actorId);

    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: inactive }),
    );
    expect(result.status.code).toBe('inactive');
  });

  it('rejects deactivating your own account', async () => {
    userRepo.findOne.mockResolvedValue({
      id: actorId,
      tenant_id: tenantId,
      status: { id: 1, code: 'active' },
    });
    statusRepo.findOneBy.mockResolvedValue({
      id: 2,
      code: 'inactive',
      name: 'Inactivo',
    });

    await expect(
      service.updateStatus(actorId, tenantId, 2, actorId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('soft-deletes a user', async () => {
    const deleted = { id: 3, code: 'deleted', name: 'Eliminado' };
    const user = {
      id: targetId,
      tenant_id: tenantId,
      email: 'contactobai@mzn.mx',
      is_employee: false,
      is_manager: false,
      status: { id: 1, code: 'active' },
    };

    statusRepo.findOne.mockResolvedValue(deleted);
    userRepo.findOne
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce({ ...user, status: deleted });
    statusRepo.findOneBy.mockResolvedValue(deleted);
    userRepo.save.mockResolvedValue(user);
    managerReportRepo.findOne.mockResolvedValue(null);

    const result = await service.softDelete(targetId, tenantId, actorId);

    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ email: null, status: deleted }),
    );
    expect(result.status.code).toBe('deleted');
  });

  it('rejects deleting your own account', async () => {
    await expect(
      service.softDelete(actorId, tenantId, actorId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
