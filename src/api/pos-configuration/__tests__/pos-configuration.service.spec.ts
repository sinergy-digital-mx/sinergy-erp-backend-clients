import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PosConfigurationService } from '../pos-configuration.service';
import { PosConfiguration } from '../../../entities/billing/pos-configuration.entity';
import { BillingBranch } from '../../../entities/billing/billing-branch.entity';
import { CreatePosConfigurationDto } from '../dto/create-pos-configuration.dto';
import { UpdatePosConfigurationDto } from '../dto/update-pos-configuration.dto';
import { QueryPosConfigurationDto } from '../dto/query-pos-configuration.dto';

describe('PosConfigurationService', () => {
  let service: PosConfigurationService;
  let posRepo: Repository<PosConfiguration>;
  let branchRepo: Repository<BillingBranch>;

  const mockPosRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockBranchRepository = {
    findOne: jest.fn(),
  };

  const mockTenantId = 'tenant-123';
  const mockBranchId = 'branch-456';
  const mockConfigId = 'config-789';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosConfigurationService,
        {
          provide: getRepositoryToken(PosConfiguration),
          useValue: mockPosRepository,
        },
        {
          provide: getRepositoryToken(BillingBranch),
          useValue: mockBranchRepository,
        },
      ],
    }).compile();

    service = module.get<PosConfigurationService>(PosConfigurationService);
    posRepo = module.get<Repository<PosConfiguration>>(getRepositoryToken(PosConfiguration));
    branchRepo = module.get<Repository<BillingBranch>>(getRepositoryToken(BillingBranch));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreatePosConfigurationDto = {
      code: 'Computadora 1',
      sucursal: mockBranchId,
      modelo: 'Dell OptiPlex 7090',
      status: 1,
    };

    it('should create a POS configuration with valid branch', async () => {
      const mockBranch = {
        id: mockBranchId,
        fiscal_configuration: { tenant_id: mockTenantId },
      };

      const mockConfig = {
        id: mockConfigId,
        ...createDto,
        tenant_id: mockTenantId,
      };

      mockBranchRepository.findOne.mockResolvedValue(mockBranch);
      mockPosRepository.create.mockReturnValue(mockConfig);
      mockPosRepository.save.mockResolvedValue(mockConfig);

      const result = await service.create(createDto, mockTenantId);

      expect(mockBranchRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockBranchId },
        relations: ['fiscal_configuration'],
      });
      expect(mockPosRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenant_id: mockTenantId,
        status: 1,
      });
      expect(result).toEqual(mockConfig);
    });

    it('should throw BadRequestException if branch does not exist', async () => {
      mockBranchRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, mockTenantId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto, mockTenantId)).rejects.toThrow(
        `Invalid branch reference: branch with ID "${mockBranchId}" does not exist`,
      );
    });

    it('should throw BadRequestException if branch belongs to different tenant', async () => {
      const mockBranch = {
        id: mockBranchId,
        fiscal_configuration: { tenant_id: 'different-tenant' },
      };

      mockBranchRepository.findOne.mockResolvedValue(mockBranch);

      await expect(service.create(createDto, mockTenantId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto, mockTenantId)).rejects.toThrow(
        `Invalid branch reference: branch with ID "${mockBranchId}" does not belong to your organization`,
      );
    });

    it('should default status to 1 if not provided', async () => {
      const dtoWithoutStatus = {
        code: 'Computadora 1',
        sucursal: mockBranchId,
      };

      const mockBranch = {
        id: mockBranchId,
        fiscal_configuration: { tenant_id: mockTenantId },
      };

      mockBranchRepository.findOne.mockResolvedValue(mockBranch);
      mockPosRepository.create.mockReturnValue({ ...dtoWithoutStatus, status: 1 });
      mockPosRepository.save.mockResolvedValue({ ...dtoWithoutStatus, status: 1 });

      await service.create(dtoWithoutStatus, mockTenantId);

      expect(mockPosRepository.create).toHaveBeenCalledWith({
        ...dtoWithoutStatus,
        tenant_id: mockTenantId,
        status: 1,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated results with tenant isolation', async () => {
      const mockConfigs = [
        { id: '1', code: 'Config 1', tenant_id: mockTenantId },
        { id: '2', code: 'Config 2', tenant_id: mockTenantId },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        getMany: jest.fn().mockResolvedValue(mockConfigs),
      };

      mockPosRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockTenantId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'config.tenant_id = :tenantId',
        { tenantId: mockTenantId },
      );
      expect(result).toEqual({
        data: mockConfigs,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should apply search filter', async () => {
      const query: QueryPosConfigurationDto = { search: 'Computadora' };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockPosRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll(mockTenantId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(config.code) LIKE LOWER(:search)',
        { search: '%Computadora%' },
      );
    });

    it('should apply status filter', async () => {
      const query: QueryPosConfigurationDto = { status: 1 };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockPosRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll(mockTenantId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'config.status = :status',
        { status: 1 },
      );
    });

    it('should apply branch filter', async () => {
      const query: QueryPosConfigurationDto = { sucursal: mockBranchId };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockPosRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll(mockTenantId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'config.sucursal = :sucursal',
        { sucursal: mockBranchId },
      );
    });

    it('should enforce maximum limit of 100', async () => {
      const query: QueryPosConfigurationDto = { limit: 200 };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockPosRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockTenantId, query);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
      expect(result.limit).toBe(100);
    });

    it('should use default limit of 20 when not specified', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockPosRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockTenantId);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result.limit).toBe(20);
    });

    it('should calculate pagination metadata correctly', async () => {
      const mockConfigs = Array.from({ length: 20 }, (_, i) => ({
        id: `config-${i}`,
        code: `Config ${i}`,
        tenant_id: mockTenantId,
      }));

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(150),
        getMany: jest.fn().mockResolvedValue(mockConfigs),
      };

      mockPosRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockTenantId, { page: 2, limit: 20 });

      expect(result.total).toBe(150);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(8);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it('should order results by created_at DESC', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockPosRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll(mockTenantId);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('config.created_at', 'DESC');
    });

    it('should apply multiple filters simultaneously', async () => {
      const query: QueryPosConfigurationDto = {
        search: 'Computadora',
        status: 1,
        sucursal: mockBranchId,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockPosRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll(mockTenantId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(config.code) LIKE LOWER(:search)',
        { search: '%Computadora%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'config.status = :status',
        { status: 1 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'config.sucursal = :sucursal',
        { sucursal: mockBranchId },
      );
    });

    it('should handle page less than 1 by defaulting to page 1', async () => {
      const query: QueryPosConfigurationDto = { page: 0 };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockPosRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockTenantId, query);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(result.page).toBe(1);
    });

    it('should handle limit less than 1 by using default limit 20', async () => {
      const query: QueryPosConfigurationDto = { limit: 0 };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockPosRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockTenantId, query);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result.limit).toBe(20);
    });
  });

  describe('findOne', () => {
    it('should return a configuration by id with tenant isolation', async () => {
      const mockConfig = {
        id: mockConfigId,
        code: 'Config 1',
        tenant_id: mockTenantId,
      };

      mockPosRepository.findOne.mockResolvedValue(mockConfig);

      const result = await service.findOne(mockConfigId, mockTenantId);

      expect(mockPosRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockConfigId, tenant_id: mockTenantId },
        relations: ['branch'],
      });
      expect(result).toEqual(mockConfig);
    });

    it('should throw NotFoundException if configuration not found', async () => {
      mockPosRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockConfigId, mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(mockConfigId, mockTenantId)).rejects.toThrow(
        `POS Configuration with ID "${mockConfigId}" not found or does not belong to your organization`,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdatePosConfigurationDto = {
      code: 'Updated Config',
      modelo: 'HP EliteDesk 800',
    };

    it('should update a configuration', async () => {
      const mockConfig = {
        id: mockConfigId,
        code: 'Old Config',
        sucursal: mockBranchId,
        tenant_id: mockTenantId,
      };

      const updatedConfig = { ...mockConfig, ...updateDto };

      mockPosRepository.findOne.mockResolvedValue(mockConfig);
      mockPosRepository.save.mockResolvedValue(updatedConfig);

      const result = await service.update(mockConfigId, updateDto, mockTenantId);

      expect(mockPosRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockConfigId, tenant_id: mockTenantId },
        relations: ['branch'],
      });
      expect(mockPosRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedConfig);
    });

    it('should validate branch if sucursal is being updated', async () => {
      const newBranchId = 'new-branch-789';
      const updateDtoWithBranch: UpdatePosConfigurationDto = {
        sucursal: newBranchId,
      };

      const mockConfig = {
        id: mockConfigId,
        sucursal: mockBranchId,
        tenant_id: mockTenantId,
      };

      const mockNewBranch = {
        id: newBranchId,
        fiscal_configuration: { tenant_id: mockTenantId },
      };

      mockPosRepository.findOne.mockResolvedValue(mockConfig);
      mockBranchRepository.findOne.mockResolvedValue(mockNewBranch);
      mockPosRepository.save.mockResolvedValue({ ...mockConfig, ...updateDtoWithBranch });

      await service.update(mockConfigId, updateDtoWithBranch, mockTenantId);

      expect(mockBranchRepository.findOne).toHaveBeenCalledWith({
        where: { id: newBranchId },
        relations: ['fiscal_configuration'],
      });
    });

    it('should not validate branch if sucursal is not being updated', async () => {
      const mockConfig = {
        id: mockConfigId,
        sucursal: mockBranchId,
        tenant_id: mockTenantId,
      };

      mockPosRepository.findOne.mockResolvedValue(mockConfig);
      mockPosRepository.save.mockResolvedValue({ ...mockConfig, ...updateDto });

      await service.update(mockConfigId, updateDto, mockTenantId);

      expect(mockBranchRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if configuration not found', async () => {
      mockPosRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockConfigId, updateDto, mockTenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a configuration', async () => {
      const mockConfig = {
        id: mockConfigId,
        tenant_id: mockTenantId,
      };

      mockPosRepository.findOne.mockResolvedValue(mockConfig);
      mockPosRepository.remove.mockResolvedValue(mockConfig);

      await service.remove(mockConfigId, mockTenantId);

      expect(mockPosRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockConfigId, tenant_id: mockTenantId },
        relations: ['branch'],
      });
      expect(mockPosRepository.remove).toHaveBeenCalledWith(mockConfig);
    });

    it('should throw NotFoundException if configuration not found', async () => {
      mockPosRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockConfigId, mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if configuration is referenced by active POS operations (MySQL FK error)', async () => {
      const mockConfig = { id: mockConfigId, tenant_id: mockTenantId };
      mockPosRepository.findOne.mockResolvedValue(mockConfig);
      mockPosRepository.remove.mockRejectedValue({ code: 'ER_ROW_IS_REFERENCED_2' });

      await expect(service.remove(mockConfigId, mockTenantId)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.remove(mockConfigId, mockTenantId)).rejects.toThrow(
        `POS Configuration with ID "${mockConfigId}" cannot be deleted because it is referenced by active POS operations`,
      );
    });

    it('should throw ConflictException if configuration is referenced by active POS operations (PostgreSQL FK error)', async () => {
      const mockConfig = { id: mockConfigId, tenant_id: mockTenantId };
      mockPosRepository.findOne.mockResolvedValue(mockConfig);
      mockPosRepository.remove.mockRejectedValue({ code: '23503' });

      await expect(service.remove(mockConfigId, mockTenantId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should rethrow unexpected errors during remove', async () => {
      const mockConfig = { id: mockConfigId, tenant_id: mockTenantId };
      const unexpectedError = new Error('Unexpected DB error');
      mockPosRepository.findOne.mockResolvedValue(mockConfig);
      mockPosRepository.remove.mockRejectedValue(unexpectedError);

      await expect(service.remove(mockConfigId, mockTenantId)).rejects.toThrow(
        'Unexpected DB error',
      );
    });
  });
});
