import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { RoleService } from '../role.service';
import { Role } from '../../../../entities/rbac/role.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { Permission } from '../../../../entities/rbac/permission.entity';
import { RBACTenant } from '../../../../entities/rbac/tenant.entity';
import { TenantContextService } from '../tenant-context.service';
import { PermissionCacheService } from '../permission-cache.service';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let userRoleRepository: jest.Mocked<Repository<UserRole>>;
  let rolePermissionRepository: jest.Mocked<Repository<RolePermission>>;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let tenantRepository: jest.Mocked<Repository<RBACTenant>>;

  const mockTenant: RBACTenant = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Company',
    subdomain: 'testcompany',
    is_active: true,
    roles: [],
    user_roles: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRole: Role = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Admin',
    description: 'Administrator role',
    is_system_role: false,
    tenant_id: '123e4567-e89b-12d3-a456-426614174000',
    tenant: mockTenant,
    user_roles: [],
    role_permissions: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPermission: Permission = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    entity_type: 'Customer',
    action: 'Read',
    description: 'Read customer data',
    is_system_permission: false,
    role_permissions: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUserRole: UserRole = {
    id: '123e4567-e89b-12d3-a456-426614174003',
    user_id: '123e4567-e89b-12d3-a456-426614174004',
    role_id: '123e4567-e89b-12d3-a456-426614174001',
    tenant_id: '123e4567-e89b-12d3-a456-426614174000',
    user: null,
    role: mockRole,
    tenant: mockTenant,
    created_at: new Date(),
  };

  const mockRolePermission: RolePermission = {
    id: '123e4567-e89b-12d3-a456-426614174005',
    role_id: '123e4567-e89b-12d3-a456-426614174001',
    permission_id: '123e4567-e89b-12d3-a456-426614174002',
    role: mockRole,
    permission: mockPermission,
    created_at: new Date(),
  };

  beforeEach(async () => {
    const mockRoleRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockUserRoleRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    };

    const mockRolePermissionRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    };

    const mockPermissionRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockTenantRepository = {
      findOne: jest.fn(),
    };

    const mockTenantContextService = {
      getCurrentTenantId: jest.fn(),
      getCurrentUserId: jest.fn(),
      setTenantContext: jest.fn(),
      hasContext: jest.fn(),
      clearContext: jest.fn(),
      validateContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: mockUserRoleRepository,
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: mockRolePermissionRepository,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
        {
          provide: getRepositoryToken(RBACTenant),
          useValue: mockTenantRepository,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: PermissionCacheService,
          useValue: {
            getUserPermissions: jest.fn(),
            setUserPermissions: jest.fn(),
            invalidateUserPermissions: jest.fn(),
            invalidateRolePermissions: jest.fn(),
            invalidateTenantPermissions: jest.fn(),
            clearAllCache: jest.fn(),
            getCacheStats: jest.fn(),
            getCacheHitRatio: jest.fn(),
            isUserPermissionsCached: jest.fn(),
            warmCache: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    roleRepository = module.get(getRepositoryToken(Role));
    userRoleRepository = module.get(getRepositoryToken(UserRole));
    rolePermissionRepository = module.get(getRepositoryToken(RolePermission));
    permissionRepository = module.get(getRepositoryToken(Permission));
    tenantRepository = module.get(getRepositoryToken(RBACTenant));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.create.mockReturnValue(mockRole);
      roleRepository.save.mockResolvedValue(mockRole);

      const result = await service.createRole('123e4567-e89b-12d3-a456-426614174000', 'Admin', 'Administrator role');

      expect(result).toEqual(mockRole);
      expect(roleRepository.create).toHaveBeenCalledWith({
        name: 'Admin',
        description: 'Administrator role',
        tenant_id: '123e4567-e89b-12d3-a456-426614174000',
        is_system_role: false,
      });
      expect(roleRepository.save).toHaveBeenCalledWith(mockRole);
    });

    it('should throw NotFoundException for invalid tenant', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createRole('invalid-tenant-id', 'Admin'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if role name already exists in tenant', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      roleRepository.findOne.mockResolvedValue(mockRole);

      await expect(
        service.createRole('123e4567-e89b-12d3-a456-426614174000', 'Admin'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      userRoleRepository.findOne.mockResolvedValue(null);
      userRoleRepository.create.mockReturnValue(mockUserRole);
      userRoleRepository.save.mockResolvedValue(mockUserRole);

      const result = await service.assignRoleToUser(
        '123e4567-e89b-12d3-a456-426614174004',
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(result).toEqual(mockUserRole);
      expect(userRoleRepository.create).toHaveBeenCalledWith({
        user_id: '123e4567-e89b-12d3-a456-426614174004',
        role_id: '123e4567-e89b-12d3-a456-426614174001',
        tenant_id: '123e4567-e89b-12d3-a456-426614174000',
      });
    });

    it('should throw NotFoundException for invalid role', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignRoleToUser('user-id', 'invalid-role-id', 'tenant-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already has role', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      userRoleRepository.findOne.mockResolvedValue(mockUserRole);

      await expect(
        service.assignRoleToUser(
          '123e4567-e89b-12d3-a456-426614174004',
          '123e4567-e89b-12d3-a456-426614174001',
          '123e4567-e89b-12d3-a456-426614174000',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('assignPermissionToRole', () => {
    it('should assign permission to role successfully', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      permissionRepository.findOne.mockResolvedValue(mockPermission);
      rolePermissionRepository.findOne.mockResolvedValue(null);
      rolePermissionRepository.create.mockReturnValue(mockRolePermission);
      rolePermissionRepository.save.mockResolvedValue(mockRolePermission);
      
      // Mock getUsersWithRole to return empty array
      userRoleRepository.find.mockResolvedValue([]);

      const result = await service.assignPermissionToRole(
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174002',
      );

      expect(result).toEqual(mockRolePermission);
      expect(rolePermissionRepository.create).toHaveBeenCalledWith({
        role_id: '123e4567-e89b-12d3-a456-426614174001',
        permission_id: '123e4567-e89b-12d3-a456-426614174002',
      });
    });

    it('should throw NotFoundException for invalid role', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignPermissionToRole('invalid-role-id', 'permission-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for invalid permission', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      permissionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignPermissionToRole('role-id', 'invalid-permission-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if role already has permission', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      permissionRepository.findOne.mockResolvedValue(mockPermission);
      rolePermissionRepository.findOne.mockResolvedValue(mockRolePermission);

      await expect(
        service.assignPermissionToRole(
          '123e4567-e89b-12d3-a456-426614174001',
          '123e4567-e89b-12d3-a456-426614174002',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles in tenant', async () => {
      const mockRoles = [mockRole];
      
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockRoles),
      };
      
      roleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserRoles('user-id', 'tenant-id');

      expect(result).toEqual(mockRoles);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('ur.user_id = :userId', { userId: 'user-id' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('ur.tenant_id = :tenantId', { tenantId: 'tenant-id' });
    });
  });

  describe('getTenantRoles', () => {
    it('should return all roles in tenant', async () => {
      const mockRoles = [mockRole];
      roleRepository.find.mockResolvedValue(mockRoles);

      const result = await service.getTenantRoles('tenant-id');

      expect(result).toEqual(mockRoles);
      expect(roleRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: 'tenant-id' },
        order: { name: 'ASC' },
      });
    });
  });

  describe('getRoleById', () => {
    it('should return role by ID and tenant', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.getRoleById('role-id', 'tenant-id');

      expect(result).toEqual(mockRole);
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'role-id', tenant_id: 'tenant-id' },
      });
    });

    it('should throw NotFoundException if role not found', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getRoleById('invalid-role-id', 'tenant-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRolePermissions', () => {
    it('should return permissions for role', async () => {
      const mockPermissions = [mockPermission];
      
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockPermissions),
      };
      
      permissionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getRolePermissions('role-id');

      expect(result).toEqual(mockPermissions);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('rp.role_id = :roleId', { roleId: 'role-id' });
    });
  });

  describe('createSystemRoles', () => {
    it('should create system roles for tenant', async () => {
      const adminRole = { ...mockRole, name: 'Admin', is_system_role: true };
      const operatorRole = { ...mockRole, name: 'Operator', is_system_role: true };
      const viewerRole = { ...mockRole, name: 'Viewer', is_system_role: true };

      roleRepository.findOne
        .mockResolvedValueOnce(null) // Admin doesn't exist
        .mockResolvedValueOnce(null) // Operator doesn't exist
        .mockResolvedValueOnce(null); // Viewer doesn't exist

      roleRepository.create
        .mockReturnValueOnce(adminRole)
        .mockReturnValueOnce(operatorRole)
        .mockReturnValueOnce(viewerRole);

      roleRepository.save
        .mockResolvedValueOnce(adminRole)
        .mockResolvedValueOnce(operatorRole)
        .mockResolvedValueOnce(viewerRole);

      const result = await service.createSystemRoles('tenant-id');

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Admin');
      expect(result[1].name).toBe('Operator');
      expect(result[2].name).toBe('Viewer');
      expect(roleRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should return existing system roles if they already exist', async () => {
      const existingAdminRole = { ...mockRole, name: 'Admin', is_system_role: true };

      roleRepository.findOne
        .mockResolvedValueOnce(existingAdminRole) // Admin exists
        .mockResolvedValueOnce(null) // Operator doesn't exist
        .mockResolvedValueOnce(null); // Viewer doesn't exist

      const operatorRole = { ...mockRole, name: 'Operator', is_system_role: true };
      const viewerRole = { ...mockRole, name: 'Viewer', is_system_role: true };

      roleRepository.create
        .mockReturnValueOnce(operatorRole)
        .mockReturnValueOnce(viewerRole);

      roleRepository.save
        .mockResolvedValueOnce(operatorRole)
        .mockResolvedValueOnce(viewerRole);

      const result = await service.createSystemRoles('tenant-id');

      expect(result).toHaveLength(3);
      expect(result[0]).toBe(existingAdminRole); // Existing role returned
      expect(roleRepository.save).toHaveBeenCalledTimes(2); // Only 2 new roles created
    });
  });

  describe('deleteRole', () => {
    it('should delete role and all associations', async () => {
      const customRole = { ...mockRole, is_system_role: false };
      roleRepository.findOne.mockResolvedValue(customRole);
      userRoleRepository.delete.mockResolvedValue({ affected: 1, raw: {} });
      rolePermissionRepository.delete.mockResolvedValue({ affected: 1, raw: {} });
      roleRepository.remove.mockResolvedValue(customRole);
      
      // Mock getUsersWithRole to return empty array
      userRoleRepository.find.mockResolvedValue([]);

      await service.deleteRole('role-id', 'tenant-id');

      expect(userRoleRepository.delete).toHaveBeenCalledWith({ role_id: 'role-id' });
      expect(rolePermissionRepository.delete).toHaveBeenCalledWith({ role_id: 'role-id' });
      expect(roleRepository.remove).toHaveBeenCalledWith(customRole);
    });

    it('should throw BadRequestException for system roles', async () => {
      const systemRole = { ...mockRole, is_system_role: true };
      roleRepository.findOne.mockResolvedValue(systemRole);

      await expect(
        service.deleteRole('role-id', 'tenant-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Edge Cases - Deleted Role/Entity References', () => {
    it('should handle deleted role references in user assignments', async () => {
      // Mock scenario where user-role exists but role is deleted
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]), // No roles found due to deleted role
      };
      
      roleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserRoles('user-id', 'tenant-id');

      expect(result).toEqual([]);
    });

    it('should handle deleted permission references in role assignments', async () => {
      // Mock scenario where role-permission exists but permission is deleted
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]), // No permissions found due to deleted permission
      };
      
      permissionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getRolePermissions('role-id');

      expect(result).toEqual([]);
    });

    it('should handle deleted tenant references in role operations', async () => {
      // Mock scenario where role exists but tenant is deleted
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createRole('deleted-tenant-id', 'TestRole'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle orphaned user-role assignments during role assignment', async () => {
      // Mock scenario where role exists but has orphaned references
      const roleWithDeletedTenant = { ...mockRole, tenant_id: 'deleted-tenant-id' };
      roleRepository.findOne.mockResolvedValue(roleWithDeletedTenant);

      // Should throw UnauthorizedException for cross-tenant assignment
      await expect(
        service.assignRoleToUser('user-id', 'role-id', 'different-tenant-id'),
      ).rejects.toThrow();
    });

    it('should handle deleted role during permission assignment', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      permissionRepository.findOne.mockResolvedValue(mockPermission);

      await expect(
        service.assignPermissionToRole('deleted-role-id', 'permission-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle deleted permission during role assignment', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);
      permissionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignPermissionToRole('role-id', 'deleted-permission-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle orphaned role-permission assignments during removal', async () => {
      // Mock scenario where role-permission assignment doesn't exist (already deleted)
      rolePermissionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removePermissionFromRole('role-id', 'permission-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle orphaned user-role assignments during removal', async () => {
      // Mock scenario where user-role assignment doesn't exist (already deleted)
      userRoleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeRoleFromUser('user-id', 'role-id', 'tenant-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle role with deleted tenant during update', async () => {
      // Mock role that references a deleted tenant
      const roleWithDeletedTenant = { ...mockRole, tenant_id: 'deleted-tenant-id' };
      roleRepository.findOne.mockResolvedValue(roleWithDeletedTenant);

      // Should still allow update of role basic info even if tenant is deleted
      roleRepository.save.mockResolvedValue(roleWithDeletedTenant);

      const result = await service.updateRole('role-id', 'deleted-tenant-id', { description: 'Updated' });
      expect(result.description).toBe('Updated');
    });

    it('should handle role deletion with orphaned associations', async () => {
      const customRole = { ...mockRole, is_system_role: false };
      roleRepository.findOne.mockResolvedValue(customRole);
      
      // Mock database errors during cascade deletion
      userRoleRepository.delete.mockRejectedValue(new Error('Foreign key constraint'));
      rolePermissionRepository.delete.mockResolvedValue({ affected: 0, raw: {} });
      
      // Mock getUsersWithRole to return empty array (won't be called due to earlier error)
      userRoleRepository.find.mockResolvedValue([]);

      // Should still attempt to delete the role even if some associations fail
      await expect(
        service.deleteRole('role-id', 'tenant-id'),
      ).rejects.toThrow('Foreign key constraint');
    });
  });

  describe('Edge Cases - System Service Unavailability', () => {
    it('should handle database unavailability during role creation', async () => {
      tenantRepository.findOne.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        service.createRole('tenant-id', 'TestRole'),
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle database timeout during role queries', async () => {
      const timeoutError = new Error('Query timeout');
      timeoutError.name = 'TimeoutError';
      
      roleRepository.find.mockRejectedValue(timeoutError);

      await expect(
        service.getTenantRoles('tenant-id'),
      ).rejects.toThrow('Query timeout');
    });

    it('should handle connection errors during user role assignment', async () => {
      const roleWithCorrectTenant = { ...mockRole, tenant_id: 'tenant-id' };
      roleRepository.findOne.mockResolvedValue(roleWithCorrectTenant);
      userRoleRepository.findOne.mockResolvedValue(null);
      
      const connectionError = new Error('Connection lost');
      connectionError.name = 'ConnectionNotFoundError';
      userRoleRepository.save.mockRejectedValue(connectionError);

      await expect(
        service.assignRoleToUser('user-id', 'role-id', 'tenant-id'),
      ).rejects.toThrow('Connection lost');
    });

    it('should handle memory errors during bulk operations', async () => {
      const memoryError = new Error('JavaScript heap out of memory');
      memoryError.name = 'RangeError';
      
      roleRepository.createQueryBuilder.mockImplementation(() => {
        throw memoryError;
      });

      await expect(
        service.getUserRoles('user-id', 'tenant-id'),
      ).rejects.toThrow('JavaScript heap out of memory');
    });

    it('should handle cache service unavailability gracefully', async () => {
      const roleWithCorrectTenant = { ...mockRole, tenant_id: 'tenant-id' };
      roleRepository.findOne.mockResolvedValue(roleWithCorrectTenant);
      userRoleRepository.findOne.mockResolvedValue(null);
      userRoleRepository.create.mockReturnValue(mockUserRole);
      userRoleRepository.save.mockResolvedValue(mockUserRole);

      // Mock cache service failure - should not prevent role assignment
      const mockCacheService = {
        invalidateUserPermissions: jest.fn().mockRejectedValue(new Error('Cache unavailable')),
      };
      
      // Replace the cache service in the service instance
      (service as any).permissionCacheService = mockCacheService;

      // Should still succeed even if cache invalidation fails
      const result = await service.assignRoleToUser('user-id', 'role-id', 'tenant-id');
      expect(result).toEqual(mockUserRole);
    });

    it('should handle partial database failures during system role creation', async () => {
      // Mock partial failure - some roles created, others fail
      roleRepository.findOne
        .mockResolvedValueOnce(null) // Admin doesn't exist
        .mockResolvedValueOnce(null) // Operator doesn't exist
        .mockResolvedValueOnce(null); // Viewer doesn't exist

      const adminRole = { ...mockRole, name: 'Admin', is_system_role: true };
      const operatorRole = { ...mockRole, name: 'Operator', is_system_role: true };

      roleRepository.create
        .mockReturnValueOnce(adminRole)
        .mockReturnValueOnce(operatorRole)
        .mockImplementation(() => {
          throw new Error('Database constraint violation');
        });

      roleRepository.save
        .mockResolvedValueOnce(adminRole)
        .mockResolvedValueOnce(operatorRole);

      // Should fail when trying to create the third role
      await expect(
        service.createSystemRoles('tenant-id'),
      ).rejects.toThrow('Database constraint violation');
    });

    it('should handle transaction rollback scenarios', async () => {
      const customRole = { ...mockRole, is_system_role: false };
      roleRepository.findOne.mockResolvedValue(customRole);
      
      // Mock successful user role deletion but failed permission deletion
      userRoleRepository.delete.mockResolvedValue({ affected: 1, raw: {} });
      rolePermissionRepository.delete.mockRejectedValue(new Error('Transaction rolled back'));
      
      // Mock getUsersWithRole to return empty array (won't be called due to earlier error)
      userRoleRepository.find.mockResolvedValue([]);

      await expect(
        service.deleteRole('role-id', 'tenant-id'),
      ).rejects.toThrow('Transaction rolled back');
    });
  });

  describe('Edge Cases - Data Consistency Issues', () => {
    it('should handle inconsistent role data', async () => {
      // Mock role with missing required fields
      const inconsistentRole = {
        id: 'role-id',
        name: null, // Missing name
        tenant_id: 'tenant-id',
        is_system_role: false,
      };
      
      roleRepository.findOne.mockResolvedValue(inconsistentRole);

      // Should handle gracefully and return the role as-is
      const result = await service.getRoleById('role-id', 'tenant-id');
      expect(result.name).toBeNull();
    });

    it('should handle malformed user-role data', async () => {
      // Mock query returning malformed data
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          null, // Null role
          undefined, // Undefined role
          { id: 'role-id' }, // Role missing required fields
          mockRole, // Valid role
        ]),
      };
      
      roleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserRoles('user-id', 'tenant-id');
      
      // Should return all results including malformed ones
      expect(result).toHaveLength(4);
      expect(result[3]).toEqual(mockRole);
    });

    it('should handle duplicate role assignments', async () => {
      const roleWithCorrectTenant = { ...mockRole, tenant_id: 'tenant-id' };
      roleRepository.findOne.mockResolvedValue(roleWithCorrectTenant);
      
      // Mock finding existing assignment first time, then not finding it
      userRoleRepository.findOne
        .mockResolvedValueOnce(mockUserRole) // First check finds existing
        .mockResolvedValueOnce(null); // Second check doesn't find it (race condition)

      await expect(
        service.assignRoleToUser('user-id', 'role-id', 'tenant-id'),
      ).rejects.toThrow(ConflictException);
    });

    it('should handle concurrent role modifications', async () => {
      const originalRole = { ...mockRole, name: 'OriginalName' };
      const updatedRole = { ...mockRole, name: 'UpdatedName' };
      
      roleRepository.findOne.mockResolvedValue(originalRole);
      
      // Mock concurrent modification - role name changed between find and save
      roleRepository.findOne.mockResolvedValueOnce(updatedRole);
      
      // Should still allow update if no name conflict
      roleRepository.save.mockResolvedValue({ ...updatedRole, description: 'New description' });

      const result = await service.updateRole('role-id', 'tenant-id', { description: 'New description' });
      expect(result.description).toBe('New description');
    });
  });
});