import { Test, TestingModule } from '@nestjs/testing';
import { MailerConfigurationController } from '../mailer-configuration.controller';
import { MailerConfigurationService } from '../../services/mailer-configuration.service';
import { MailerVendor } from '../../enums/mailer-vendor.enum';
import { CreateMailerConfigurationDto } from '../../dto/create-mailer-configuration.dto';
import { UpdateMailerConfigurationDto } from '../../dto/update-mailer-configuration.dto';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('MailerConfigurationController', () => {
  let controller: MailerConfigurationController;
  let mockService: jest.Mocked<MailerConfigurationService>;

  const mockConfig = {
    id: 'config-123',
    tenantId: 'tenant-123',
    name: 'Test Config',
    vendor: MailerVendor.RESEND,
    vendorConfig: { apiKey: 'encrypted-key' },
    isActive: false,
    isFallback: false,
    isValid: true,
    createdAt: new Date(),
    createdBy: 'user-123',
    updatedAt: new Date(),
    updatedBy: 'user-123',
  };

  const mockRequest = {
    user: {
      tenant_id: 'tenant-123',
      user_id: 'user-123',
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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailerConfigurationController],
      providers: [
        {
          provide: MailerConfigurationService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MailerConfigurationController>(
      MailerConfigurationController,
    );
  });

  describe('create', () => {
    it('should create a new configuration', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      mockService.create.mockResolvedValue(mockConfig);

      const result = await controller.create(dto, mockRequest);

      expect(mockService.create).toHaveBeenCalledWith(
        'tenant-123',
        dto,
        'user-123',
      );
      expect(result).toBeDefined();
    });

    it('should return 400 for invalid input', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: '' },
      };

      mockService.create.mockRejectedValue(
        new BadRequestException('Invalid configuration'),
      );

      await expect(controller.create(dto, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated configurations', async () => {
      mockService.findByTenant.mockResolvedValue({
        data: [mockConfig],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await controller.findAll(
        { page: 1, limit: 10 },
        mockRequest,
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by vendor', async () => {
      mockService.findByTenant.mockResolvedValue({
        data: [mockConfig],
        total: 1,
        page: 1,
        limit: 10,
      });

      await controller.findAll(
        { page: 1, limit: 10, vendor: MailerVendor.RESEND },
        mockRequest,
      );

      expect(mockService.findByTenant).toHaveBeenCalled();
    });

    it('should filter by active status', async () => {
      mockService.findByTenant.mockResolvedValue({
        data: [{ ...mockConfig, isActive: true }],
        total: 1,
        page: 1,
        limit: 10,
      });

      await controller.findAll(
        { page: 1, limit: 10, isActive: true },
        mockRequest,
      );

      expect(mockService.findByTenant).toHaveBeenCalled();
    });
  });

  describe('getActive', () => {
    it('should return active configuration', async () => {
      const activeConfig = { ...mockConfig, isActive: true };
      mockService.findActive.mockResolvedValue(activeConfig);

      const result = await controller.getActive(mockRequest);

      expect(result.isActive).toBe(true);
    });

    it('should return 404 if no active configuration', async () => {
      mockService.findActive.mockRejectedValue(
        new NotFoundException('No active configuration'),
      );

      await expect(controller.getActive(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should return configuration by ID', async () => {
      mockService.findById.mockResolvedValue(mockConfig);

      const result = await controller.findOne('config-123', mockRequest);

      expect(mockService.findById).toHaveBeenCalledWith('tenant-123', 'config-123');
      expect(result).toEqual(mockConfig);
    });

    it('should return 404 if not found', async () => {
      mockService.findById.mockRejectedValue(
        new NotFoundException('Configuration not found'),
      );

      await expect(
        controller.findOne('config-123', mockRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return 403 for cross-tenant access', async () => {
      mockService.findById.mockRejectedValue(
        new ForbiddenException('Access denied'),
      );

      await expect(
        controller.findOne('config-123', mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update configuration', async () => {
      const dto: UpdateMailerConfigurationDto = {
        name: 'Updated Config',
      };

      const updatedConfig = { ...mockConfig, name: 'Updated Config' };
      mockService.update.mockResolvedValue(updatedConfig);

      const result = await controller.update('config-123', dto, mockRequest);

      expect(mockService.update).toHaveBeenCalledWith(
        'tenant-123',
        'config-123',
        dto,
        'user-123',
      );
      expect(result.name).toBe('Updated Config');
    });

    it('should return 404 if configuration not found', async () => {
      mockService.update.mockRejectedValue(
        new NotFoundException('Configuration not found'),
      );

      await expect(
        controller.update('config-123', {}, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete configuration', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await controller.remove('config-123', mockRequest);

      expect(mockService.delete).toHaveBeenCalledWith(
        'tenant-123',
        'config-123',
        'user-123',
      );
    });

    it('should return 404 if configuration not found', async () => {
      mockService.delete.mockRejectedValue(
        new NotFoundException('Configuration not found'),
      );

      await expect(
        controller.remove('config-123', mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setActive', () => {
    it('should set configuration as active', async () => {
      const activeConfig = { ...mockConfig, isActive: true };
      mockService.setActive.mockResolvedValue(activeConfig);

      const result = await controller.setActive('config-123', mockRequest);

      expect(mockService.setActive).toHaveBeenCalledWith(
        'tenant-123',
        'config-123',
        'user-123',
      );
      expect(result.isActive).toBe(true);
    });

    it('should return 400 if configuration is invalid', async () => {
      mockService.setActive.mockRejectedValue(
        new BadRequestException('Configuration is invalid'),
      );

      await expect(
        controller.setActive('config-123', mockRequest),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('setFallback', () => {
    it('should set configuration as fallback', async () => {
      const fallbackConfig = { ...mockConfig, isFallback: true };
      mockService.setFallback.mockResolvedValue(fallbackConfig);

      const result = await controller.setFallback('config-123', mockRequest);

      expect(mockService.setFallback).toHaveBeenCalledWith(
        'tenant-123',
        'config-123',
        'user-123',
      );
      expect(result.isFallback).toBe(true);
    });
  });

  describe('clearFallback', () => {
    it('should clear fallback configuration', async () => {
      mockService.clearFallback.mockResolvedValue(undefined);

      await controller.clearFallback(mockRequest);

      expect(mockService.clearFallback).toHaveBeenCalledWith(
        'tenant-123',
        'user-123',
      );
    });
  });

  describe('Permission checks', () => {
    it('should verify Create permission on create', async () => {
      const dto: CreateMailerConfigurationDto = {
        name: 'Test Config',
        vendor: MailerVendor.RESEND,
        vendorConfig: { apiKey: 'test-key' },
      };

      mockService.create.mockResolvedValue(mockConfig);

      await controller.create(dto, mockRequest);

      expect(mockService.create).toHaveBeenCalled();
    });

    it('should verify Read permission on findAll', async () => {
      mockService.findByTenant.mockResolvedValue({
        data: [mockConfig],
        total: 1,
        page: 1,
        limit: 10,
      });

      await controller.findAll({ page: 1, limit: 10 }, mockRequest);

      expect(mockService.findByTenant).toHaveBeenCalled();
    });

    it('should verify Update permission on update', async () => {
      mockService.update.mockResolvedValue(mockConfig);

      await controller.update('config-123', {}, mockRequest);

      expect(mockService.update).toHaveBeenCalled();
    });

    it('should verify Delete permission on remove', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await controller.remove('config-123', mockRequest);

      expect(mockService.delete).toHaveBeenCalled();
    });
  });

  describe('Response formatting', () => {
    it('should return properly formatted configuration', async () => {
      mockService.findById.mockResolvedValue(mockConfig);

      const result = await controller.findOne('config-123', mockRequest);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('vendor');
      expect(result).toHaveProperty('isActive');
    });

    it('should return paginated response with metadata', async () => {
      mockService.findByTenant.mockResolvedValue({
        data: [mockConfig],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await controller.findAll(
        { page: 1, limit: 10 },
        mockRequest,
      );

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
    });
  });
});
