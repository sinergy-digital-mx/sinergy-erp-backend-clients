import { Test, TestingModule } from '@nestjs/testing';
import { PosConfigurationController } from '../pos-configuration.controller';
import { PosConfigurationService } from '../pos-configuration.service';
import { CreatePosConfigurationDto } from '../dto/create-pos-configuration.dto';
import { UpdatePosConfigurationDto } from '../dto/update-pos-configuration.dto';
import { QueryPosConfigurationDto } from '../dto/query-pos-configuration.dto';
import { NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../../rbac/guards/permission.guard';

describe('PosConfigurationController', () => {
  let controller: PosConfigurationController;
  let service: PosConfigurationService;

  const mockPosConfigurationService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockRequest = {
    user: {
      tenantId: 'test-tenant-id',
      userId: 'test-user-id',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosConfigurationController],
      providers: [
        {
          provide: PosConfigurationService,
          useValue: mockPosConfigurationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PosConfigurationController>(PosConfigurationController);
    service = module.get<PosConfigurationService>(PosConfigurationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new POS configuration', async () => {
      const dto: CreatePosConfigurationDto = {
        code: 'POS-001',
        type: 'VENTAS',
        sucursal: 'branch-uuid',
        modelo: 'Model X',
        status: 1,
      };

      const expectedResult = {
        id: 'config-uuid',
        ...dto,
        tenant_id: mockRequest.user.tenantId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPosConfigurationService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(dto, mockRequest.user.tenantId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated POS configurations', async () => {
      const query: QueryPosConfigurationDto = {
        page: 1,
        limit: 20,
      };

      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      mockPosConfigurationService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query, mockRequest);

      expect(service.findAll).toHaveBeenCalledWith(mockRequest.user.tenantId, query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single POS configuration', async () => {
      const id = 'config-uuid';
      const expectedResult = {
        id,
        code: 'POS-001',
        type: 'VENTAS',
        sucursal: 'branch-uuid',
        modelo: 'Model X',
        status: 1,
        tenant_id: mockRequest.user.tenantId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPosConfigurationService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id, mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(id, mockRequest.user.tenantId);
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when configuration not found', async () => {
      const id = 'non-existent-id';
      mockPosConfigurationService.findOne.mockRejectedValue(
        new NotFoundException(`POS Configuration with ID ${id} not found`)
      );

      await expect(controller.findOne(id, mockRequest)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a POS configuration', async () => {
      const id = 'config-uuid';
      const dto: UpdatePosConfigurationDto = {
        code: 'POS-001-UPDATED',
        status: 0,
      };

      const expectedResult = {
        id,
        code: dto.code,
        type: 'VENTAS',
        sucursal: 'branch-uuid',
        modelo: 'Model X',
        status: dto.status,
        tenant_id: mockRequest.user.tenantId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPosConfigurationService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, dto, mockRequest);

      expect(service.update).toHaveBeenCalledWith(id, dto, mockRequest.user.tenantId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a POS configuration', async () => {
      const id = 'config-uuid';
      mockPosConfigurationService.remove.mockResolvedValue(undefined);

      await controller.remove(id, mockRequest);

      expect(service.remove).toHaveBeenCalledWith(id, mockRequest.user.tenantId);
    });
  });

  describe('RBAC Permission Checks', () => {
    // **Validates: Requirements 6.2, 6.3, 6.4**
    
    it('should have @RequirePermissions decorator on create endpoint with correct entity type and action', () => {
      const metadata = Reflect.getMetadata('permissions', controller.create);
      expect(metadata).toBeDefined();
      expect(metadata).toEqual([{ entityType: 'pos_configurations', action: 'Create' }]);
    });

    it('should have @RequirePermissions decorator on findAll endpoint with correct entity type and action', () => {
      const metadata = Reflect.getMetadata('permissions', controller.findAll);
      expect(metadata).toBeDefined();
      expect(metadata).toEqual([{ entityType: 'pos_configurations', action: 'Read' }]);
    });

    it('should have @RequirePermissions decorator on findOne endpoint with correct entity type and action', () => {
      const metadata = Reflect.getMetadata('permissions', controller.findOne);
      expect(metadata).toBeDefined();
      expect(metadata).toEqual([{ entityType: 'pos_configurations', action: 'Read' }]);
    });

    it('should have @RequirePermissions decorator on update endpoint with correct entity type and action', () => {
      const metadata = Reflect.getMetadata('permissions', controller.update);
      expect(metadata).toBeDefined();
      expect(metadata).toEqual([{ entityType: 'pos_configurations', action: 'Update' }]);
    });

    it('should have @RequirePermissions decorator on remove endpoint with correct entity type and action', () => {
      const metadata = Reflect.getMetadata('permissions', controller.remove);
      expect(metadata).toBeDefined();
      expect(metadata).toEqual([{ entityType: 'pos_configurations', action: 'Delete' }]);
    });

    it('should have PermissionGuard applied at controller level', () => {
      const guards = Reflect.getMetadata('__guards__', PosConfigurationController);
      expect(guards).toBeDefined();
      expect(guards).toContain(PermissionGuard);
    });

    it('should have JwtAuthGuard applied at controller level', () => {
      const guards = Reflect.getMetadata('__guards__', PosConfigurationController);
      expect(guards).toBeDefined();
      expect(guards).toContain(JwtAuthGuard);
    });
  });
});
