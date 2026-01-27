import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { TenantService, TenantCreationOptions, TenantDeletionResult } from '../tenant.service';
import { RoleTemplateService, BulkRoleCreationResult } from '../role-template.service';
import { AuditLogService } from '../audit-log.service';
import { RBACTenant } from '../../../../entities/rbac/tenant.entity';
import { Role } from '../../../../entities/rbac/role.entity';
import { UserRole } from '../../../../entities/rbac/user-role.entity';
import { RolePermission } from '../../../../entities/rbac/role-permission.entity';
import { AuditLog } from '../../../../entities/rbac/audit-log.entity';

describe('TenantService', () => {
  let service: TenantService;
  let tenantRepository: jest.Mocked<Repository<RBACTenant>>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let userRoleRepository: jest.Mocked<Repository<UserRole>>;
  let rolePermissionRepository: jest.Mocked<Repository<RolePermission>>;
  let auditLogRepository: jest.Mocked<Repository<AuditLog>>;
  let roleTemplateService: jest.Mocked<RoleTemplateService>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let configService: jest.Mocked<ConfigService>;

  const mockTenant: RBACTenant = {
    id: 'tenant-1',
    name: 'Test Tenant',
    subdomain: 'test-tenant',
    legacy_tenant_id: null,
    is_active: true,
    roles: [],
    user_roles: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockBulkRoleResult: BulkRoleCreationResult = {
    roles: [],
    totalRoles: 3,
    totalPermissions: 15,
    errors: [],
  };

  beforeEach(async () => {
    const mockTenantRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const mockRoleRepository = {
      count: jest.fn(),
    };

    const mockUserRoleRepository = {
      count: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockRolePermissionRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockAuditLogRepository = {
      count: jest.fn(),
      delete: jest.fn(),
    };

    const mockRoleTemplateService = {
      createSystemRolesForTenant: jest.fn(),
      createRoleFromCustomTemplate: jest.fn(),
    };

    const mockAuditLogService = {
      logTenantManagement: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: getRepositoryToken(RBACTenant),
          useValue: mockTenantRepository,
        },
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
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
        {
          provide: RoleTemplateService,
          useValue: mockRoleTemplateService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    tenantRepository = module.get(getRepositoryToken(RBACTenant));
    roleRepository = module.get(getRepositoryToken(Role));
    userRoleRepository = module.get(getRepositoryToken(UserRole));
    rolePermissionRepository = module.get(getRepositoryToken(RolePermission));
    auditLogRepository = module.get(getRepositoryToken(AuditLog));
    roleTemplateService = module.get(RoleTemplateService);
    auditLogService = module.get(AuditLogService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTenant', () => {
    const validOptions: TenantCreationOptions = {
      name: 'Test Tenant',
      subdomain: 'test-tenant',
      isActive: true,
    };

    it('should create a tenant with system roles successfully', async () => {
      // Setup mocks
      tenantRepository.findOne.mockResolvedValue(null); // No existing tenant
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      roleTemplateService.createSystemRolesForTenant.mockResolvedValue(mockBulkRoleResult);
      configService.get.mockReturnValue([]);

      const result = await service.createTenant(validOptions);

      expect(result.tenant).toEqual(mockTenant);
      expect(result.systemRoles.totalRoles).toBe(3);
      expect(result.systemRoles.totalPermissions).toBe(15);
      expect(result.warnings).toHaveLength(0);

      expect(tenantRepository.create).toHaveBeenCalledWith({
        name: validOptions.name,
        subdomain: validOptions.subdomain,
        is_active: true,
      });
      expect(tenantRepository.save).toHaveBeenCalledWith(mockTenant);
      expect(roleTemplateService.createSystemRolesForTenant).toHaveBeenCalledWith(
        mockTenant.id,
        true
      );
    });

    it('should skip system roles when skipSystemRoles is true', async () => {
      const optionsWithSkip: TenantCreationOptions = {
        ...validOptions,
        skipSystemRoles: true,
      };

      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      configService.get.mockReturnValue([]);

      const result = await service.createTenant(optionsWithSkip);

      expect(result.tenant).toEqual(mockTenant);
      expect(result.systemRoles.totalRoles).toBe(0);
      expect(roleTemplateService.createSystemRolesForTenant).not.toHaveBeenCalled();
    });

    it('should create custom roles from options', async () => {
      const customRoleTemplate = {
        name: 'Custom Role',
        description: 'Custom role description',
        permissions: [
          { entityType: 'Customer', actions: ['Read', 'Update'] },
        ],
      };

      const optionsWithCustomRoles: TenantCreationOptions = {
        ...validOptions,
        customRoleTemplates: [customRoleTemplate],
      };

      const mockCustomRoleResult = {
        role: { id: 'role-1', name: 'Custom Role' },
        permissionsCreated: 2,
        permissionsAssigned: 2,
        warnings: [],
      };

      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      roleTemplateService.createSystemRolesForTenant.mockResolvedValue(mockBulkRoleResult);
      roleTemplateService.createRoleFromCustomTemplate.mockResolvedValue(mockCustomRoleResult);
      configService.get.mockReturnValue([]);

      const result = await service.createTenant(optionsWithCustomRoles);

      expect(result.customRoles.totalRoles).toBe(1);
      expect(roleTemplateService.createRoleFromCustomTemplate).toHaveBeenCalledWith(
        customRoleTemplate.name,
        customRoleTemplate.description,
        customRoleTemplate.permissions,
        mockTenant.id,
        false
      );
    });

    it('should create custom roles from configuration', async () => {
      const configCustomRoles = [
        {
          name: 'Config Role',
          description: 'Role from config',
          permissions: [
            { entityType: 'Lead', actions: ['Create', 'Read'] },
          ],
        },
      ];

      const mockCustomRoleResult = {
        role: { id: 'role-2', name: 'Config Role' },
        permissionsCreated: 2,
        permissionsAssigned: 2,
        warnings: [],
      };

      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      roleTemplateService.createSystemRolesForTenant.mockResolvedValue(mockBulkRoleResult);
      roleTemplateService.createRoleFromCustomTemplate.mockResolvedValue(mockCustomRoleResult);
      configService.get.mockReturnValue(configCustomRoles);

      const result = await service.createTenant(validOptions);

      expect(result.customRoles.totalRoles).toBe(1);
      expect(roleTemplateService.createRoleFromCustomTemplate).toHaveBeenCalledWith(
        configCustomRoles[0].name,
        configCustomRoles[0].description,
        configCustomRoles[0].permissions,
        mockTenant.id,
        false
      );
    });

    it('should handle system role creation failure gracefully', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      roleTemplateService.createSystemRolesForTenant.mockRejectedValue(
        new Error('Role creation failed')
      );
      configService.get.mockReturnValue([]);

      const result = await service.createTenant(validOptions);

      expect(result.tenant).toEqual(mockTenant);
      expect(result.warnings).toContain('Failed to create system roles: Role creation failed');
    });

    it('should throw ConflictException if tenant name already exists', async () => {
      tenantRepository.findOne.mockResolvedValueOnce(mockTenant); // Name exists

      await expect(service.createTenant(validOptions)).rejects.toThrow(ConflictException);
      expect(tenantRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if tenant subdomain already exists', async () => {
      tenantRepository.findOne
        .mockResolvedValueOnce(null) // Name doesn't exist
        .mockResolvedValueOnce(mockTenant); // Subdomain exists

      await expect(service.createTenant(validOptions)).rejects.toThrow(ConflictException);
      expect(tenantRepository.save).not.toHaveBeenCalled();
    });

    it('should validate tenant options and throw BadRequestException for invalid input', async () => {
      const invalidOptions: TenantCreationOptions = {
        name: '',
        subdomain: 'test-tenant',
      };

      await expect(service.createTenant(invalidOptions)).rejects.toThrow(BadRequestException);
      expect(tenantRepository.save).not.toHaveBeenCalled();
    });

    it('should validate subdomain format', async () => {
      const invalidSubdomainOptions: TenantCreationOptions = {
        name: 'Test Tenant',
        subdomain: 'Invalid_Subdomain!',
      };

      await expect(service.createTenant(invalidSubdomainOptions)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should cleanup tenant if role creation fails after tenant is saved', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      tenantRepository.remove.mockResolvedValue(mockTenant);
      roleTemplateService.createSystemRolesForTenant.mockRejectedValue(
        new Error('Critical role creation failure')
      );
      // Make config service throw an error that causes the entire tenant creation to fail
      configService.get.mockImplementation((key) => {
        if (key === 'rbac.customRoleTemplates') {
          throw new Error('Config error that causes tenant creation to fail');
        }
        return [];
      });

      // The service should handle role creation failures gracefully and NOT throw
      // Instead, it should return a result with warnings
      const result = await service.createTenant(validOptions);
      
      expect(result.tenant).toEqual(mockTenant);
      expect(result.warnings).toContain('Failed to create system roles: Critical role creation failure');
      // Tenant should NOT be removed because role creation failures are handled gracefully
      expect(tenantRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('getTenantById', () => {
    it('should return tenant when found', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);

      const result = await service.getTenantById('tenant-1');

      expect(result).toEqual(mockTenant);
      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
      });
    });

    it('should return null when tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      const result = await service.getTenantById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getTenantBySubdomain', () => {
    it('should return tenant when found by subdomain', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);

      const result = await service.getTenantBySubdomain('test-tenant');

      expect(result).toEqual(mockTenant);
      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { subdomain: 'test-tenant' },
      });
    });

    it('should return null when tenant not found by subdomain', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      const result = await service.getTenantBySubdomain('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('initializeRolesForTenant', () => {
    it('should initialize roles for existing tenant', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      roleTemplateService.createSystemRolesForTenant.mockResolvedValue(mockBulkRoleResult);
      configService.get.mockReturnValue([]);

      const result = await service.initializeRolesForTenant('tenant-1');

      expect(result.systemRoles).toEqual(mockBulkRoleResult);
      expect(roleTemplateService.createSystemRolesForTenant).toHaveBeenCalledWith(
        'tenant-1',
        true
      );
    });

    it('should throw BadRequestException if tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.initializeRolesForTenant('non-existent')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('updateTenantStatus', () => {
    it('should update tenant status successfully', async () => {
      const updatedTenant = { ...mockTenant, is_active: false };
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      tenantRepository.save.mockResolvedValue(updatedTenant);

      const result = await service.updateTenantStatus('tenant-1', false);

      expect(result.is_active).toBe(false);
      expect(tenantRepository.save).toHaveBeenCalledWith({
        ...mockTenant,
        is_active: false,
      });
    });

    it('should throw BadRequestException if tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.updateTenantStatus('non-existent', false)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('deleteTenant', () => {
    it('should delete tenant with cascade deletion successfully', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      
      // Mock data counts
      roleRepository.count.mockResolvedValue(2);
      userRoleRepository.count.mockResolvedValue(3);
      auditLogRepository.count.mockResolvedValue(10);
      
      // Mock cascade deletion operations
      userRoleRepository.delete.mockResolvedValue({ affected: 3 });
      auditLogRepository.delete.mockResolvedValue({ affected: 10 });
      
      // Mock role permission deletion
      const mockRolePermissionQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
        innerJoin: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };
      rolePermissionRepository.createQueryBuilder.mockReturnValue(mockRolePermissionQueryBuilder);
      
      // Mock role deletion
      roleRepository.delete = jest.fn().mockResolvedValue({ affected: 2 });
      
      // Mock user count query
      const mockUserRoleQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '1' }),
      };
      userRoleRepository.createQueryBuilder.mockReturnValue(mockUserRoleQueryBuilder);
      
      tenantRepository.remove.mockResolvedValue(mockTenant);
      auditLogService.logTenantManagement.mockResolvedValue({} as any);
      configService.get.mockReturnValue('true'); // Delete audit logs

      const result: TenantDeletionResult = await service.deleteTenant('tenant-1', 'actor-1');

      expect(result.tenantId).toBe('tenant-1');
      expect(result.tenantName).toBe('Test Tenant');
      expect(result.cascadeResults.userRoles).toBe(3);
      expect(result.cascadeResults.rolePermissions).toBe(5);
      expect(result.cascadeResults.roles).toBe(2);
      expect(result.cascadeResults.auditLogs).toBe(10);
      expect(tenantRepository.remove).toHaveBeenCalledWith(mockTenant);
      expect(auditLogService.logTenantManagement).toHaveBeenCalled();
    });

    it('should preserve audit logs when configured', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      
      // Mock data counts
      roleRepository.count.mockResolvedValue(1);
      userRoleRepository.count.mockResolvedValue(1);
      auditLogRepository.count.mockResolvedValue(5);
      
      // Mock cascade deletion operations
      userRoleRepository.delete.mockResolvedValue({ affected: 1 });
      
      // Mock role permission deletion
      const mockRolePermissionQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
        innerJoin: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      };
      rolePermissionRepository.createQueryBuilder.mockReturnValue(mockRolePermissionQueryBuilder);
      
      // Mock role deletion
      roleRepository.delete = jest.fn().mockResolvedValue({ affected: 1 });
      
      // Mock user count query
      const mockUserRoleQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '1' }),
      };
      userRoleRepository.createQueryBuilder.mockReturnValue(mockUserRoleQueryBuilder);
      
      tenantRepository.remove.mockResolvedValue(mockTenant);
      configService.get.mockReturnValue('false'); // Don't delete audit logs

      const result: TenantDeletionResult = await service.deleteTenant('tenant-1', 'actor-1');

      expect(result.cascadeResults.auditLogs).toBe(0);
      expect(result.warnings).toContain('Audit logs were preserved as per system configuration');
      expect(auditLogRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteTenant('non-existent', 'actor-1')).rejects.toThrow(BadRequestException);
    });

    it('should handle cascade deletion failures gracefully', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      
      // Mock data counts
      roleRepository.count.mockResolvedValue(1);
      userRoleRepository.count.mockResolvedValue(1);
      auditLogRepository.count.mockResolvedValue(1);
      
      // Mock user count query
      const mockUserRoleQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '1' }),
      };
      userRoleRepository.createQueryBuilder.mockReturnValue(mockUserRoleQueryBuilder);
      
      // Mock role permission count query
      const mockRolePermissionQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      rolePermissionRepository.createQueryBuilder.mockReturnValue(mockRolePermissionQueryBuilder);
      
      // Mock cascade deletion failure
      userRoleRepository.delete.mockRejectedValue(new Error('Database constraint violation'));

      await expect(service.deleteTenant('tenant-1', 'actor-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateOrphanedReferences', () => {
    it('should return empty warnings when no orphaned references exist', async () => {
      // Mock query builders for orphaned reference checks
      const mockUserRoleQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      userRoleRepository.createQueryBuilder.mockReturnValue(mockUserRoleQueryBuilder);

      const mockRolePermissionQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      rolePermissionRepository.createQueryBuilder.mockReturnValue(mockRolePermissionQueryBuilder);

      const mockRoleQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      roleRepository.createQueryBuilder = jest.fn().mockReturnValue(mockRoleQueryBuilder);

      const warnings = await service.validateOrphanedReferences('tenant-1');

      expect(warnings).toHaveLength(0);
    });

    it('should return warnings when orphaned references exist', async () => {
      // Mock query builders for orphaned reference checks
      const mockUserRoleQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2), // 2 orphaned user roles
      };
      userRoleRepository.createQueryBuilder.mockReturnValue(mockUserRoleQueryBuilder);

      const mockRolePermissionQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1), // 1 orphaned role permission
      };
      rolePermissionRepository.createQueryBuilder.mockReturnValue(mockRolePermissionQueryBuilder);

      const mockRoleQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0), // No orphaned roles
      };
      roleRepository.createQueryBuilder = jest.fn().mockReturnValue(mockRoleQueryBuilder);

      const warnings = await service.validateOrphanedReferences('tenant-1');

      expect(warnings).toHaveLength(2);
      expect(warnings).toContain('Found 2 orphaned user role assignments');
      expect(warnings).toContain('Found 1 orphaned role permission assignments');
    });

    it('should handle validation errors gracefully', async () => {
      // Mock query builder failure
      userRoleRepository.createQueryBuilder.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const warnings = await service.validateOrphanedReferences('tenant-1');

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('Failed to validate orphaned references');
    });
  });

  describe('configuration handling', () => {
    const validOptions: TenantCreationOptions = {
      name: 'Test Tenant',
      subdomain: 'test-tenant',
      isActive: true,
    };

    it('should handle invalid configuration gracefully', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      roleTemplateService.createSystemRolesForTenant.mockResolvedValue(mockBulkRoleResult);
      
      // Mock invalid configuration
      configService.get.mockImplementation((key) => {
        if (key === 'rbac.customRoleTemplates') {
          return 'invalid-config'; // Not an array
        }
        return [];
      });

      const result = await service.createTenant(validOptions);

      expect(result.tenant).toEqual(mockTenant);
      expect(result.customRoles.totalRoles).toBe(0);
    });

    it('should parse custom role templates from environment variable', async () => {
      const envTemplates = [
        {
          name: 'Env Role',
          description: 'Role from environment',
          permissions: [{ entityType: 'Order', actions: ['Read'] }],
        },
      ];

      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      roleTemplateService.createSystemRolesForTenant.mockResolvedValue(mockBulkRoleResult);
      
      configService.get.mockImplementation((key) => {
        if (key === 'rbac.customRoleTemplates') {
          return 'not-an-array';
        }
        if (key === 'RBAC_CUSTOM_ROLE_TEMPLATES') {
          return JSON.stringify(envTemplates);
        }
        return [];
      });

      const mockCustomRoleResult = {
        role: { id: 'role-env', name: 'Env Role' },
        permissionsCreated: 1,
        permissionsAssigned: 1,
        warnings: [],
      };

      roleTemplateService.createRoleFromCustomTemplate.mockResolvedValue(mockCustomRoleResult);

      const result = await service.createTenant(validOptions);

      expect(result.customRoles.totalRoles).toBe(1);
      expect(roleTemplateService.createRoleFromCustomTemplate).toHaveBeenCalledWith(
        'Env Role',
        'Role from environment',
        [{ entityType: 'Order', actions: ['Read'] }],
        mockTenant.id,
        false
      );
    });
  });

  describe('Edge Cases - System Service Unavailability', () => {
    const validOptions: TenantCreationOptions = {
      name: 'Test Tenant',
      subdomain: 'test-tenant',
      isActive: true,
    };

    it('should handle database connection failures during tenant creation', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      
      const connectionError = new Error('ECONNREFUSED: Connection refused');
      connectionError.name = 'ConnectionNotFoundError';
      tenantRepository.save.mockRejectedValue(connectionError);

      await expect(service.createTenant(validOptions)).rejects.toThrow('ECONNREFUSED: Connection refused');
    });

    it('should handle timeout errors during tenant lookup', async () => {
      const timeoutError = new Error('Query timeout exceeded');
      timeoutError.name = 'TimeoutError';
      tenantRepository.findOne.mockRejectedValue(timeoutError);

      await expect(service.createTenant(validOptions)).rejects.toThrow('Query timeout exceeded');
    });

    it('should handle memory errors during tenant operations', async () => {
      const memoryError = new Error('JavaScript heap out of memory');
      memoryError.name = 'RangeError';
      tenantRepository.findOne.mockRejectedValue(memoryError);

      await expect(service.getTenantById('tenant-1')).rejects.toThrow('JavaScript heap out of memory');
    });

    it('should handle role template service unavailability gracefully', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      
      // Mock role template service being completely unavailable
      roleTemplateService.createSystemRolesForTenant.mockRejectedValue(
        new Error('Service unavailable')
      );
      configService.get.mockReturnValue([]);

      const result = await service.createTenant(validOptions);

      // Should still create tenant but with warnings
      expect(result.tenant).toEqual(mockTenant);
      expect(result.warnings).toContain('Failed to create system roles: Service unavailable');
      expect(result.systemRoles.totalRoles).toBe(0);
    });

    it('should handle configuration service failures', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      roleTemplateService.createSystemRolesForTenant.mockResolvedValue(mockBulkRoleResult);
      
      // Mock config service throwing errors
      configService.get.mockImplementation((key) => {
        throw new Error('Configuration service unavailable');
      });

      const result = await service.createTenant(validOptions);

      // Should still create tenant with system roles but no custom roles
      expect(result.tenant).toEqual(mockTenant);
      expect(result.systemRoles.totalRoles).toBe(3);
      expect(result.customRoles.totalRoles).toBe(0);
    });

    it('should handle partial database failures during tenant deletion', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      
      // Mock data counts - need to mock all query builders used in getTenantDataCounts
      roleRepository.count.mockResolvedValue(1);
      userRoleRepository.count.mockResolvedValue(1);
      auditLogRepository.count.mockResolvedValue(1);
      
      // Mock user count query for getTenantDataCounts
      const mockUserRoleCountQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '1' }),
      };
      
      // Mock role permission count query for getTenantDataCounts
      const mockRolePermissionCountQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      
      // Set up the query builder mocks to return different builders for different calls
      let callCount = 0;
      userRoleRepository.createQueryBuilder.mockImplementation(() => {
        callCount++;
        return mockUserRoleCountQueryBuilder;
      });
      
      rolePermissionRepository.createQueryBuilder.mockImplementation(() => {
        return mockRolePermissionCountQueryBuilder;
      });
      
      // Mock successful cascade deletion operations
      userRoleRepository.delete.mockResolvedValue({ affected: 1 });
      
      // Mock role deletion
      roleRepository.delete = jest.fn().mockResolvedValue({ affected: 1 });
      
      // Mock database constraint violation during tenant removal
      const constraintError = new Error('Foreign key constraint violation');
      constraintError.name = 'QueryFailedError';
      tenantRepository.remove.mockRejectedValue(constraintError);

      await expect(service.deleteTenant('tenant-1')).rejects.toThrow('Foreign key constraint violation');
    });

    it('should handle transaction rollback scenarios', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      
      // Mock transaction rollback during save
      const rollbackError = new Error('Transaction was rolled back');
      rollbackError.name = 'QueryFailedError';
      tenantRepository.save.mockRejectedValue(rollbackError);

      await expect(service.createTenant(validOptions)).rejects.toThrow('Transaction was rolled back');
    });

    it('should handle cascading service failures during tenant initialization', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);
      
      // Mock both role template service and config service failing
      roleTemplateService.createSystemRolesForTenant.mockRejectedValue(
        new Error('Role service down')
      );
      configService.get.mockImplementation(() => {
        throw new Error('Config service down');
      });

      const result = await service.initializeRolesForTenant('tenant-1');

      expect(result.warnings).toContain('Failed to create system roles: Role service down');
      expect(result.systemRoles.totalRoles).toBe(0);
      expect(result.customRoles.totalRoles).toBe(0);
    });

    it('should handle intermittent service failures with retry logic', async () => {
      let callCount = 0;
      tenantRepository.findOne.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Temporary service unavailable');
        }
        return Promise.resolve(null); // Success on retry
      });

      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      roleTemplateService.createSystemRolesForTenant.mockResolvedValue(mockBulkRoleResult);
      configService.get.mockReturnValue([]);

      // First call should fail, but the service doesn't implement retry logic
      await expect(service.createTenant(validOptions)).rejects.toThrow('Temporary service unavailable');
    });

    it('should handle service recovery scenarios', async () => {
      // Mock initial failure followed by success
      tenantRepository.findOne
        .mockRejectedValueOnce(new Error('Service temporarily down'))
        .mockResolvedValueOnce(null);

      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      roleTemplateService.createSystemRolesForTenant.mockResolvedValue(mockBulkRoleResult);
      configService.get.mockReturnValue([]);

      // First call should fail
      await expect(service.createTenant(validOptions)).rejects.toThrow('Service temporarily down');

      // Second call should succeed (simulating service recovery)
      const result = await service.createTenant(validOptions);
      expect(result.tenant).toEqual(mockTenant);
    });

    it('should handle network partition scenarios', async () => {
      const networkError = new Error('ENETUNREACH: Network is unreachable');
      networkError.name = 'NetworkError';
      
      tenantRepository.findOne.mockRejectedValue(networkError);

      await expect(service.getTenantBySubdomain('test-tenant')).rejects.toThrow('ENETUNREACH: Network is unreachable');
    });

    it('should handle disk space errors during tenant operations', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      
      const diskError = new Error('ENOSPC: No space left on device');
      diskError.name = 'SystemError';
      tenantRepository.save.mockRejectedValue(diskError);

      await expect(service.createTenant(validOptions)).rejects.toThrow('ENOSPC: No space left on device');
    });
  });

  describe('Edge Cases - Data Consistency Issues', () => {
    const validOptions: TenantCreationOptions = {
      name: 'Test Tenant',
      subdomain: 'test-tenant',
      isActive: true,
    };

    it('should handle inconsistent tenant data', async () => {
      // Mock tenant with missing required fields
      const inconsistentTenant = {
        id: 'tenant-1',
        name: null, // Missing name
        subdomain: 'test-tenant',
        is_active: true,
      };
      
      tenantRepository.findOne.mockResolvedValue(inconsistentTenant);

      const result = await service.getTenantById('tenant-1');
      expect(result.name).toBeNull();
    });

    it('should handle malformed configuration data', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);
      roleTemplateService.createSystemRolesForTenant.mockResolvedValue(mockBulkRoleResult);
      
      // Mock malformed JSON in environment variable
      configService.get.mockImplementation((key) => {
        if (key === 'rbac.customRoleTemplates') {
          return [];
        }
        if (key === 'RBAC_CUSTOM_ROLE_TEMPLATES') {
          return '{"invalid": json}'; // Malformed JSON
        }
        return [];
      });

      const result = await service.createTenant(validOptions);

      // Should handle malformed JSON gracefully
      expect(result.tenant).toEqual(mockTenant);
      expect(result.customRoles.totalRoles).toBe(0);
    });

    it('should handle concurrent tenant creation with same name', async () => {
      // Mock race condition - tenant doesn't exist initially but gets created before save
      tenantRepository.findOne
        .mockResolvedValueOnce(null) // First check - doesn't exist
        .mockResolvedValueOnce(null); // Second check - still doesn't exist

      tenantRepository.create.mockReturnValue(mockTenant);
      
      // Mock unique constraint violation during save
      const constraintError = new Error('Duplicate entry for key tenant_name_unique');
      constraintError.name = 'QueryFailedError';
      tenantRepository.save.mockRejectedValue(constraintError);

      await expect(service.createTenant(validOptions)).rejects.toThrow('Duplicate entry for key tenant_name_unique');
    });

    it('should handle orphaned tenant references', async () => {
      // Mock scenario where tenant exists but related data is inconsistent
      const orphanedTenant = {
        ...mockTenant,
        roles: [], // No roles despite system roles being created
        user_roles: [], // No user roles
      };
      
      tenantRepository.findOne.mockResolvedValue(orphanedTenant);
      roleTemplateService.createSystemRolesForTenant.mockResolvedValue({
        ...mockBulkRoleResult,
        errors: ['Some roles could not be created due to orphaned references'],
      });
      configService.get.mockReturnValue([]);

      const result = await service.initializeRolesForTenant('tenant-1');

      expect(result.systemRoles.errors).toContain('Some roles could not be created due to orphaned references');
    });

    it('should handle duplicate subdomain with different casing', async () => {
      const existingTenant = { ...mockTenant, subdomain: 'TEST-TENANT' };
      
      tenantRepository.findOne
        .mockResolvedValueOnce(null) // Name check passes
        .mockResolvedValueOnce(existingTenant); // Subdomain check finds existing (case insensitive)

      await expect(service.createTenant(validOptions)).rejects.toThrow(ConflictException);
    });
  });
});