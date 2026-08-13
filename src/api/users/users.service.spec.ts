import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from '../../entities/users/user.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { UserStatus } from '../../entities/users/user-status.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { PosDailyShift } from '../../entities/pos/pos-daily-shift.entity';
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
        { provide: getRepositoryToken(RBACTenant), useValue: {} },
        { provide: getRepositoryToken(UserStatus), useValue: {} },
        { provide: getRepositoryToken(BillingBranch), useValue: {} },
        { provide: getRepositoryToken(PosDailyShift), useValue: {} },
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

  it('rejects changing another user password', async () => {
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
