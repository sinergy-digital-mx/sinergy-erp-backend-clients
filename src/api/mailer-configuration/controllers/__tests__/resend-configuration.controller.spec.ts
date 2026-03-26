import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MailerConfigurationController } from '../mailer-configuration.controller';
import { MailerConfigurationService } from '../../services/mailer-configuration.service';
import { TenantContextService } from '../../../rbac/services/tenant-context.service';
import { PermissionGuard } from '../../../rbac/guards/permission.guard';
import { PermissionService } from '../../../rbac/services/permission.service';
import { MailerVendor } from '../../enums/mailer-vendor.enum';
import { CreateMailerConfigurationDto } from '../../dto/create-mailer-configuration.dto';
import { UpdateMailerConfigurationDto } from '../../dto/update-mailer-configuration.dto';

describe('MailerConfigurationController - Permission Checks', () => {
  let controller: MailerConfigurationController;
  let mockService: jest.Mocked<MailerConfigurationService>;
  let mockTenantContext: jest.Mocked<TenantContextService>;
  let mockPermissionService: jest.Mocked<PermissionService>;
  let permissionGuard: PermissionGuard;

  const tenantId = 'tenant-123';
  const userId = 'user-123';
  const configId = 'config-123';

  const mockConfig = {
    id: configId,
    tenant_id: tenantId,
    name: 'Test Config',
    vendor: MailerVendor.RESEND,
    vendorConfig: { apiKey: 'encrypted-key' },
    is_active: false,
    is_fallback: false,
    is_valid: true,
    created_at: new Date(),
    created_by: userId,
    updated_at: new Date(),
    updated_by: userId,
    tenant: null,
  };

  const mockRequest = {
    user: {
      tenant_id: tenantId,
      user_id: userId,
    },
  };

  beforeEach(async () => {
    mockService = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTenant: jest.fn(),
      findActive: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      setActive: jest.fn(),
      setFallback: jest.fn(),
      clearFallback: jest.fn(),
      getActiveForModule: jest.fn(),
      validateConfiguration: jest.fn(),
    } as any;

    mockTenantContext = {
      setTenantContext: jest.fn(),
      getCurrentTenantId: jest.fn().mockReturnValue(tenantId),
      getCurrentUserId: jest.fn().mockReturnValue(userId),
      hasContext: jest.fn().mockReturnValue(true),
      clearContext: jest.fn(),
      validateContext: jest.fn().mockReturnValue(true),
    } as any;

    mockPermissionService = {
      hasPermission: jest.fn(),
      validateUserTenantAccess: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailerConfigurationController],
      providers: [
        {
          provide: MailerConfigurationService,
          useValue: mockService,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContext,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
        {
          provide: PermissionGuard,
          useValue: new PermissionGuard(
            {
              getAllAndOverride: jest.fn().mockReturnValue([]),
            } as any,
            mockPermissionService,
            mockTenantContext,
          ),
        },
      ],
    }).compile();

    controller = module.get<MailerConfigurationController>(
      MailerConfigurationController,
    );
    permissionGuard = module.get<PermissionGuard>(PermissionGuard);
  });

  describe('Create - Permission Check', () => {
    it('should allow create when user has mailer_configurations:Create permission', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      mockService.create.mockResolvedValue(mockConfig as any);

      const result = await controller.create(dto, mockRequest);

      expect(mockService.create).toHaveBeenCalledWith(tenantId, dto, userId);
      expect(result).toBeDefined();
    });

    it('should deny create when user lacks mailer_configurations:Create permission', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      mockPermissionService.hasPermission.mockResolvedValue(false);
      mockService.create.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(controller.create(dto, mockRequest)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return 403 Forbidden when Create permission is denied', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      mockService.create.mockRejectedValue(
        new ForbiddenException('User does not have permission: mailer_configurations:Create'),
      );

      try {
        await controller.create(dto, mockRequest);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('permission');
      }
    });
  });

  describe('Read - Permission Check', () => {
    it('should allow read when user has mailer_configurations:Read permission', async () => {
      mockService.findById.mockResolvedValue(mockConfig as any);

      const result = await controller.findOne(configId, mockRequest);

      expect(mockService.findById).toHaveBeenCalledWith(tenantId, configId);
      expect(result).toBeDefined();
    });

    it('should deny read when user lacks mailer_configurations:Read permission', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(false);
      mockService.findById.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(
        controller.findOne(configId, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return 403 Forbidden when Read permission is denied', async () => {
      mockService.findById.mockRejectedValue(
        new ForbiddenException('User does not have permission: mailer_configurations:Read'),
      );

      try {
        await controller.findOne(configId, mockRequest);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('permission');
      }
    });

    it('should allow read on list when user has mailer_configurations:Read permission', async () => {
      mockService.findByTenant.mockResolvedValue({
        data: [mockConfig as any],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await controller.findAll({ page: 1, limit: 10 }, mockRequest);

      expect(mockService.findByTenant).toHaveBeenCalledWith(tenantId, expect.any(Object));
      expect(result.data).toHaveLength(1);
    });

    it('should deny read on list when user lacks mailer_configurations:Read permission', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(false);
      mockService.findByTenant.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(
        controller.findAll({ page: 1, limit: 10 }, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow read on active configuration when user has mailer_configurations:Read permission', async () => {
      const activeConfig = { ...mockConfig, is_active: true };
      mockService.findActive.mockResolvedValue(activeConfig as any);

      const result = await controller.getActive(mockRequest);

      expect(mockService.findActive).toHaveBeenCalledWith(tenantId);
      expect(result).toBeDefined();
    });

    it('should deny read on active configuration when user lacks mailer_configurations:Read permission', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(false);
      mockService.findActive.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(controller.getActive(mockRequest)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Update - Permission Check', () => {
    it('should allow update when user has mailer_configurations:Update permission', async () => {
      const dto: UpdateMailerConfigurationDto = {
        name: 'Updated Config',
      };

      const updatedConfig = { ...mockConfig, name: 'Updated Config' };
      mockService.update.mockResolvedValue(updatedConfig as any);

      const result = await controller.update(configId, dto, mockRequest);

      expect(mockService.update).toHaveBeenCalledWith(
        tenantId,
        configId,
        dto,
        userId,
      );
      expect(result).toBeDefined();
    });

    it('should deny update when user lacks mailer_configurations:Update permission', async () => {
      const dto: UpdateMailerConfigurationDto = {
        name: 'Updated Config',
      };

      mockPermissionService.hasPermission.mockResolvedValue(false);
      mockService.update.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(
        controller.update(configId, dto, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return 403 Forbidden when Update permission is denied', async () => {
      const dto: UpdateMailerConfigurationDto = {
        name: 'Updated Config',
      };

      mockService.update.mockRejectedValue(
        new ForbiddenException('User does not have permission: mailer_configurations:Update'),
      );

      try {
        await controller.update(configId, dto, mockRequest);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('permission');
      }
    });

    it('should allow setActive when user has mailer_configurations:Update permission', async () => {
      const activeConfig = { ...mockConfig, is_active: true };
      mockService.setActive.mockResolvedValue(activeConfig as any);

      const result = await controller.setActive(configId, mockRequest);

      expect(mockService.setActive).toHaveBeenCalledWith(
        tenantId,
        configId,
        userId,
      );
      expect(result).toBeDefined();
    });

    it('should deny setActive when user lacks mailer_configurations:Update permission', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(false);
      mockService.setActive.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(
        controller.setActive(configId, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow setFallback when user has mailer_configurations:Update permission', async () => {
      const fallbackConfig = { ...mockConfig, is_fallback: true };
      mockService.setFallback.mockResolvedValue(fallbackConfig as any);

      const result = await controller.setFallback(configId, mockRequest);

      expect(mockService.setFallback).toHaveBeenCalledWith(
        tenantId,
        configId,
        userId,
      );
      expect(result).toBeDefined();
    });

    it('should deny setFallback when user lacks mailer_configurations:Update permission', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(false);
      mockService.setFallback.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(
        controller.setFallback(configId, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow clearFallback when user has mailer_configurations:Update permission', async () => {
      mockService.clearFallback.mockResolvedValue(undefined);

      await controller.clearFallback(mockRequest);

      expect(mockService.clearFallback).toHaveBeenCalledWith(tenantId, userId);
    });

    it('should deny clearFallback when user lacks mailer_configurations:Update permission', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(false);
      mockService.clearFallback.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(controller.clearFallback(mockRequest)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Delete - Permission Check', () => {
    it('should allow delete when user has mailer_configurations:Delete permission', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await controller.remove(configId, mockRequest);

      expect(mockService.delete).toHaveBeenCalledWith(tenantId, configId, userId);
    });

    it('should deny delete when user lacks mailer_configurations:Delete permission', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(false);
      mockService.delete.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(
        controller.remove(configId, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return 403 Forbidden when Delete permission is denied', async () => {
      mockService.delete.mockRejectedValue(
        new ForbiddenException('User does not have permission: mailer_configurations:Delete'),
      );

      try {
        await controller.remove(configId, mockRequest);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('permission');
      }
    });
  });

  describe('Permission Enforcement Across All Operations', () => {
    it('should enforce Create permission on POST /mailer-configurations', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      mockService.create.mockResolvedValue(mockConfig as any);

      await controller.create(dto, mockRequest);

      expect(mockService.create).toHaveBeenCalled();
    });

    it('should enforce Read permission on GET /mailer-configurations', async () => {
      mockService.findByTenant.mockResolvedValue({
        data: [mockConfig as any],
        total: 1,
        page: 1,
        limit: 10,
      });

      await controller.findAll({ page: 1, limit: 10 }, mockRequest);

      expect(mockService.findByTenant).toHaveBeenCalled();
    });

    it('should enforce Read permission on GET /mailer-configurations/:id', async () => {
      mockService.findById.mockResolvedValue(mockConfig as any);

      await controller.findOne(configId, mockRequest);

      expect(mockService.findById).toHaveBeenCalled();
    });

    it('should enforce Update permission on PATCH /mailer-configurations/:id', async () => {
      const dto: UpdateMailerConfigurationDto = { name: 'Updated' };
      mockService.update.mockResolvedValue(mockConfig as any);

      await controller.update(configId, dto, mockRequest);

      expect(mockService.update).toHaveBeenCalled();
    });

    it('should enforce Delete permission on DELETE /mailer-configurations/:id', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await controller.remove(configId, mockRequest);

      expect(mockService.delete).toHaveBeenCalled();
    });
  });

  describe('Permission Checks with Missing Tenant Context', () => {
    it('should throw error when tenant context is missing on create', async () => {
      mockTenantContext.getCurrentTenantId.mockReturnValue(null);

      const dto: CreateMailerConfigurationDto = {
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      await expect(controller.create(dto, mockRequest)).rejects.toThrow();
    });

    it('should throw error when user context is missing on create', async () => {
      mockTenantContext.getCurrentUserId.mockReturnValue(null);

      const dto: CreateMailerConfigurationDto = {
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      await expect(controller.create(dto, mockRequest)).rejects.toThrow();
    });

    it('should throw error when tenant context is missing on read', async () => {
      mockTenantContext.getCurrentTenantId.mockReturnValue(null);

      await expect(controller.findOne(configId, mockRequest)).rejects.toThrow();
    });

    it('should throw error when tenant context is missing on update', async () => {
      mockTenantContext.getCurrentTenantId.mockReturnValue(null);

      const dto: UpdateMailerConfigurationDto = { name: 'Updated' };

      await expect(
        controller.update(configId, dto, mockRequest),
      ).rejects.toThrow();
    });

    it('should throw error when tenant context is missing on delete', async () => {
      mockTenantContext.getCurrentTenantId.mockReturnValue(null);

      await expect(controller.remove(configId, mockRequest)).rejects.toThrow();
    });
  });

  describe('Permission Checks with Different Tenant IDs', () => {
    it('should verify tenant isolation on read', async () => {
      const differentTenantId = 'tenant-456';
      mockTenantContext.getCurrentTenantId.mockReturnValue(differentTenantId);

      mockService.findById.mockRejectedValue(
        new ForbiddenException('Access denied - different tenant'),
      );

      await expect(
        controller.findOne(configId, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should verify tenant isolation on update', async () => {
      const differentTenantId = 'tenant-456';
      mockTenantContext.getCurrentTenantId.mockReturnValue(differentTenantId);

      const dto: UpdateMailerConfigurationDto = { name: 'Updated' };
      mockService.update.mockRejectedValue(
        new ForbiddenException('Access denied - different tenant'),
      );

      await expect(
        controller.update(configId, dto, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should verify tenant isolation on delete', async () => {
      const differentTenantId = 'tenant-456';
      mockTenantContext.getCurrentTenantId.mockReturnValue(differentTenantId);

      mockService.delete.mockRejectedValue(
        new ForbiddenException('Access denied - different tenant'),
      );

      await expect(
        controller.remove(configId, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Permission Checks - Specific Error Messages', () => {
    it('should return descriptive error for Create permission denial', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      mockService.create.mockRejectedValue(
        new ForbiddenException(
          'User does not have permission: mailer_configurations:Create',
        ),
      );

      try {
        await controller.create(dto, mockRequest);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('mailer_configurations:Create');
      }
    });

    it('should return descriptive error for Read permission denial', async () => {
      mockService.findById.mockRejectedValue(
        new ForbiddenException(
          'User does not have permission: mailer_configurations:Read',
        ),
      );

      try {
        await controller.findOne(configId, mockRequest);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('mailer_configurations:Read');
      }
    });

    it('should return descriptive error for Update permission denial', async () => {
      const dto: UpdateMailerConfigurationDto = { name: 'Updated' };
      mockService.update.mockRejectedValue(
        new ForbiddenException(
          'User does not have permission: mailer_configurations:Update',
        ),
      );

      try {
        await controller.update(configId, dto, mockRequest);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('mailer_configurations:Update');
      }
    });

    it('should return descriptive error for Delete permission denial', async () => {
      mockService.delete.mockRejectedValue(
        new ForbiddenException(
          'User does not have permission: mailer_configurations:Delete',
        ),
      );

      try {
        await controller.remove(configId, mockRequest);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('mailer_configurations:Delete');
      }
    });
  });
});
