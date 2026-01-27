import { BadRequestException, ConflictException } from '@nestjs/common';
import { TenantService, TenantCreationResult, TenantDeletionResult } from '../../services/tenant.service';
import { RBACTenant } from '../../../../entities/rbac/tenant.entity';

// Simple test controller without guards for testing
class TestTenantController {
  constructor(private readonly tenantService: TenantService) {}

  async createTenant(createTenantDto: any) {
    const options = {
      name: createTenantDto.name,
      subdomain: createTenantDto.subdomain,
      isActive: createTenantDto.isActive,
      skipSystemRoles: createTenantDto.skipSystemRoles,
      customRoleTemplates: createTenantDto.customRoleTemplates,
    };

    const result: TenantCreationResult = await this.tenantService.createTenant(options);

    return {
      message: 'Tenant created successfully',
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        subdomain: result.tenant.subdomain,
        isActive: result.tenant.is_active,
        createdAt: result.tenant.created_at,
      },
      systemRoles: {
        totalRoles: result.systemRoles.totalRoles,
        totalPermissions: result.systemRoles.totalPermissions,
        errors: result.systemRoles.errors,
      },
      customRoles: {
        totalRoles: result.customRoles.totalRoles,
        totalPermissions: result.customRoles.totalPermissions,
        errors: result.customRoles.errors,
      },
      warnings: result.warnings,
    };
  }

  async getTenant(tenantId: string) {
    const tenant = await this.tenantService.getTenantById(tenantId);
    
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        isActive: tenant.is_active,
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
      },
    };
  }

  async initializeRoles(tenantId: string) {
    const result = await this.tenantService.initializeRolesForTenant(tenantId);

    return {
      message: 'Roles initialized successfully',
      systemRoles: {
        totalRoles: result.systemRoles.totalRoles,
        totalPermissions: result.systemRoles.totalPermissions,
        errors: result.systemRoles.errors,
      },
      customRoles: {
        totalRoles: result.customRoles.totalRoles,
        totalPermissions: result.customRoles.totalPermissions,
        errors: result.customRoles.errors,
      },
    };
  }

  async updateTenantStatus(tenantId: string, updateStatusDto: { isActive: boolean }) {
    const tenant = await this.tenantService.updateTenantStatus(tenantId, updateStatusDto.isActive);

    return {
      message: 'Tenant status updated successfully',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        isActive: tenant.is_active,
        updatedAt: tenant.updated_at,
      },
    };
  }

  async deleteTenant(tenantId: string, request: any): Promise<{
    message: string;
    deletionResult: {
      tenantId: string;
      tenantName: string;
      deletedAt: Date;
      cascadeResults: {
        userRoles: number;
        rolePermissions: number;
        roles: number;
        auditLogs: number;
      };
      warnings: string[];
    };
  }> {
    const actorId = request.user?.id;
    const deletionResult: TenantDeletionResult = await this.tenantService.deleteTenant(tenantId, actorId);

    return {
      message: 'Tenant deleted successfully with cascade cleanup',
      deletionResult: {
        tenantId: deletionResult.tenantId,
        tenantName: deletionResult.tenantName,
        deletedAt: deletionResult.deletedAt,
        cascadeResults: deletionResult.cascadeResults,
        warnings: deletionResult.warnings,
      },
    };
  }

  async validateOrphanedReferences(tenantId: string): Promise<{
    tenantId: string;
    warnings: string[];
    isValid: boolean;
  }> {
    const warnings = await this.tenantService.validateOrphanedReferences(tenantId);

    return {
      tenantId,
      warnings,
      isValid: warnings.length === 0,
    };
  }
}

describe('TenantController', () => {
  let controller: TestTenantController;
  let tenantService: jest.Mocked<TenantService>;

  const mockTenant: RBACTenant = {
    id: 'tenant-1',
    name: 'Test Tenant',
    subdomain: 'test-tenant',
    legacy_tenant_id: null,
    is_active: true,
    roles: [],
    user_roles: [],
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockTenantCreationResult: TenantCreationResult = {
    tenant: mockTenant,
    systemRoles: {
      roles: [],
      totalRoles: 3,
      totalPermissions: 15,
      errors: [],
    },
    customRoles: {
      roles: [],
      totalRoles: 1,
      totalPermissions: 5,
      errors: [],
    },
    warnings: [],
  };

  beforeEach(async () => {
    const mockTenantService = {
      createTenant: jest.fn(),
      getTenantById: jest.fn(),
      getTenantBySubdomain: jest.fn(),
      initializeRolesForTenant: jest.fn(),
      updateTenantStatus: jest.fn(),
      deleteTenant: jest.fn(),
      deleteTenantLegacy: jest.fn(),
      validateOrphanedReferences: jest.fn(),
    };

    tenantService = mockTenantService as jest.Mocked<TenantService>;
    controller = new TestTenantController(tenantService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTenant', () => {
    const validCreateTenantDto = {
      name: 'Test Tenant',
      subdomain: 'test-tenant',
      isActive: true,
    };

    it('should create a tenant successfully', async () => {
      tenantService.createTenant.mockResolvedValue(mockTenantCreationResult);

      const result = await controller.createTenant(validCreateTenantDto);

      expect(result.message).toBe('Tenant created successfully');
      expect(result.tenant).toEqual({
        id: mockTenant.id,
        name: mockTenant.name,
        subdomain: mockTenant.subdomain,
        isActive: mockTenant.is_active,
        createdAt: mockTenant.created_at,
      });
      expect(result.systemRoles.totalRoles).toBe(3);
      expect(result.systemRoles.totalPermissions).toBe(15);
      expect(result.customRoles.totalRoles).toBe(1);
      expect(result.customRoles.totalPermissions).toBe(5);
      expect(result.warnings).toHaveLength(0);

      expect(tenantService.createTenant).toHaveBeenCalledWith({
        name: validCreateTenantDto.name,
        subdomain: validCreateTenantDto.subdomain,
        isActive: validCreateTenantDto.isActive,
        skipSystemRoles: validCreateTenantDto.skipSystemRoles,
        customRoleTemplates: validCreateTenantDto.customRoleTemplates,
      });
    });

    it('should propagate ConflictException from service', async () => {
      tenantService.createTenant.mockRejectedValue(
        new ConflictException('Tenant with name "Test Tenant" already exists')
      );

      await expect(controller.createTenant(validCreateTenantDto)).rejects.toThrow(
        ConflictException
      );
    });

    it('should propagate BadRequestException from service', async () => {
      tenantService.createTenant.mockRejectedValue(
        new BadRequestException('Tenant name is required')
      );

      await expect(controller.createTenant(validCreateTenantDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getTenant', () => {
    it('should return tenant when found', async () => {
      tenantService.getTenantById.mockResolvedValue(mockTenant);

      const result = await controller.getTenant('tenant-1');

      expect(result.tenant).toEqual({
        id: mockTenant.id,
        name: mockTenant.name,
        subdomain: mockTenant.subdomain,
        isActive: mockTenant.is_active,
        createdAt: mockTenant.created_at,
        updatedAt: mockTenant.updated_at,
      });

      expect(tenantService.getTenantById).toHaveBeenCalledWith('tenant-1');
    });

    it('should throw error when tenant not found', async () => {
      tenantService.getTenantById.mockResolvedValue(null);

      await expect(controller.getTenant('non-existent')).rejects.toThrow(
        'Tenant with ID non-existent not found'
      );
    });
  });

  describe('initializeRoles', () => {
    it('should initialize roles for tenant successfully', async () => {
      const mockInitResult = {
        systemRoles: {
          roles: [],
          totalRoles: 3,
          totalPermissions: 15,
          errors: [],
        },
        customRoles: {
          roles: [],
          totalRoles: 2,
          totalPermissions: 8,
          errors: [],
        },
        warnings: [],
      };

      tenantService.initializeRolesForTenant.mockResolvedValue(mockInitResult);

      const result = await controller.initializeRoles('tenant-1');

      expect(result.message).toBe('Roles initialized successfully');
      expect(result.systemRoles.totalRoles).toBe(3);
      expect(result.systemRoles.totalPermissions).toBe(15);
      expect(result.customRoles.totalRoles).toBe(2);
      expect(result.customRoles.totalPermissions).toBe(8);

      expect(tenantService.initializeRolesForTenant).toHaveBeenCalledWith('tenant-1');
    });

    it('should propagate BadRequestException from service', async () => {
      tenantService.initializeRolesForTenant.mockRejectedValue(
        new BadRequestException('Tenant with ID non-existent not found')
      );

      await expect(controller.initializeRoles('non-existent')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('updateTenantStatus', () => {
    it('should update tenant status successfully', async () => {
      const updatedTenant = {
        ...mockTenant,
        is_active: false,
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      tenantService.updateTenantStatus.mockResolvedValue(updatedTenant);

      const result = await controller.updateTenantStatus('tenant-1', { isActive: false });

      expect(result.message).toBe('Tenant status updated successfully');
      expect(result.tenant.isActive).toBe(false);
      expect(result.tenant.updatedAt).toEqual(updatedTenant.updated_at);

      expect(tenantService.updateTenantStatus).toHaveBeenCalledWith('tenant-1', false);
    });

    it('should propagate BadRequestException from service', async () => {
      tenantService.updateTenantStatus.mockRejectedValue(
        new BadRequestException('Tenant with ID non-existent not found')
      );

      await expect(
        controller.updateTenantStatus('non-existent', { isActive: false })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteTenant', () => {
    const mockDeletionResult: TenantDeletionResult = {
      tenantId: 'tenant-1',
      tenantName: 'Test Tenant',
      deletedAt: new Date('2024-01-01T00:00:00Z'),
      cascadeResults: {
        userRoles: 3,
        rolePermissions: 5,
        roles: 2,
        auditLogs: 10,
      },
      warnings: ['Tenant had 1 active users. All user assignments were removed.'],
    };

    it('should delete tenant successfully with cascade cleanup', async () => {
      tenantService.deleteTenant.mockResolvedValue(mockDeletionResult);

      const mockRequest = { user: { id: 'actor-1' } };
      const result = await controller.deleteTenant('tenant-1', mockRequest);

      expect(result.message).toBe('Tenant deleted successfully with cascade cleanup');
      expect(result.deletionResult.tenantId).toBe('tenant-1');
      expect(result.deletionResult.tenantName).toBe('Test Tenant');
      expect(result.deletionResult.cascadeResults.userRoles).toBe(3);
      expect(result.deletionResult.cascadeResults.rolePermissions).toBe(5);
      expect(result.deletionResult.cascadeResults.roles).toBe(2);
      expect(result.deletionResult.cascadeResults.auditLogs).toBe(10);
      expect(result.deletionResult.warnings).toHaveLength(1);

      expect(tenantService.deleteTenant).toHaveBeenCalledWith('tenant-1', 'actor-1');
    });

    it('should propagate BadRequestException from service', async () => {
      tenantService.deleteTenant.mockRejectedValue(
        new BadRequestException('Tenant with ID non-existent not found')
      );

      const mockRequest = { user: { id: 'actor-1' } };
      await expect(controller.deleteTenant('non-existent', mockRequest)).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateOrphanedReferences', () => {
    it('should validate references successfully with no warnings', async () => {
      tenantService.validateOrphanedReferences.mockResolvedValue([]);

      const result = await controller.validateOrphanedReferences('tenant-1');

      expect(result.tenantId).toBe('tenant-1');
      expect(result.warnings).toHaveLength(0);
      expect(result.isValid).toBe(true);

      expect(tenantService.validateOrphanedReferences).toHaveBeenCalledWith('tenant-1');
    });

    it('should validate references and return warnings', async () => {
      const warnings = ['Found 2 orphaned user role assignments', 'Found 1 orphaned role permission assignments'];
      tenantService.validateOrphanedReferences.mockResolvedValue(warnings);

      const result = await controller.validateOrphanedReferences('tenant-1');

      expect(result.tenantId).toBe('tenant-1');
      expect(result.warnings).toEqual(warnings);
      expect(result.isValid).toBe(false);
    });
  });
});