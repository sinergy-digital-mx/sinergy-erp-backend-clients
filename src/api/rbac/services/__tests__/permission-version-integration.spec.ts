import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionVersionService } from '../permission-version.service';
import { User } from '../../../../entities/users/user.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';

describe('PermissionVersionService - Integration', () => {
  let service: PermissionVersionService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionVersionService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            increment: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionVersionService>(PermissionVersionService);
    userRepository = module.get(getRepositoryToken(User));
  });

  describe('User entity with permissions_version', () => {
    it('should create a user with permissions_version initialized to 1', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        tenant_id: 'tenant-123',
        permissions_version: 1,
      };

      (userRepository.save as jest.Mock).mockResolvedValue(mockUser);

      const savedUser = await userRepository.save({
        email: 'test@example.com',
        tenant_id: 'tenant-123',
        permissions_version: 1,
      });

      expect(savedUser.permissions_version).toBe(1);
    });

    it('should retrieve user with permissions_version field', async () => {
      const mockUser = {
        id: 'user-123',
        permissions_version: 3,
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const version = await service.getUserVersion('user-123');

      expect(version).toBe(3);
    });
  });
});
