import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { PosSession } from '../../entities/pos/pos-session.entity';
import { PosConfiguration } from '../../entities/billing/pos-configuration.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { S3Service } from '../../common/services/s3.service';
import { BatchFilterDto } from './dto/batch-filter.dto';
import { BatchResponseDto } from './dto/batch-response.dto';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockRepository: any;
  let mockProductPriceRepository: any;
  let mockPosSessionRepository: any;
  let mockPosConfigurationRepository: any;
  let mockWarehouseRepository: any;
  let mockS3Service: any;

  const mockTenantId = '550e8400-e29b-41d4-a716-446655440000';
  const mockUserId = 'user-123';

  const mockInventoryBatch: InventoryBatch = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    tenant_id: mockTenantId,
    batch_number: 'BATCH-001',
    warehouse_id: '550e8400-e29b-41d4-a716-446655440010',
    warehouse: { id: '550e8400-e29b-41d4-a716-446655440010', name: 'Main Warehouse' } as any,
    product_id: '550e8400-e29b-41d4-a716-446655440020',
    product: { id: '550e8400-e29b-41d4-a716-446655440020', name: 'Product A', sku: 'SKU-001' } as any,
    uom_id: '550e8400-e29b-41d4-a716-446655440030',
    uom: { id: '550e8400-e29b-41d4-a716-446655440030', name: 'Unit' } as any,
    quantity: 100,
    purchase_order_batch_id: '550e8400-e29b-41d4-a716-446655440040',
    purchase_order_batch: {} as any,
    purchase_order_detail_id: '550e8400-e29b-41d4-a716-446655440050',
    purchase_order_detail: {} as any,
    created_by: mockUserId,
    created_at: new Date('2024-01-01'),
    tenant: {} as any,
  };

  beforeEach(async () => {
    mockRepository = {
      createQueryBuilder: jest.fn(),
    };
    mockProductPriceRepository = {
      createQueryBuilder: jest.fn(),
    };
    mockPosSessionRepository = {
      findOne: jest.fn(),
    };
    mockPosConfigurationRepository = {
      findOne: jest.fn(),
    };
    mockWarehouseRepository = {
      find: jest.fn(),
    };
    mockS3Service = {
      getSignedUrl: jest.fn().mockResolvedValue('https://signed.example/photo.jpg'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(InventoryBatch),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(ProductPrice),
          useValue: mockProductPriceRepository,
        },
        {
          provide: getRepositoryToken(PosSession),
          useValue: mockPosSessionRepository,
        },
        {
          provide: getRepositoryToken(PosConfiguration),
          useValue: mockPosConfigurationRepository,
        },
        {
          provide: getRepositoryToken(Warehouse),
          useValue: mockWarehouseRepository,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated list of batches for tenant', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockInventoryBatch], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters: BatchFilterDto = { page: 1, limit: 20 };
      const result = await service.findAll(mockTenantId, filters);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'batch.tenant_id = :tenantId',
        { tenantId: mockTenantId },
      );
    });

    it('should apply batch_number filter', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockInventoryBatch], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters: BatchFilterDto = { batch_number: 'BATCH-001', page: 1, limit: 20 };
      await service.findAll(mockTenantId, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(batch.batch_number) LIKE LOWER(:batch_number)',
        { batch_number: '%BATCH-001%' },
      );
    });

    it('should apply product_id filter', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockInventoryBatch], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const productId = '550e8400-e29b-41d4-a716-446655440020';
      const filters: BatchFilterDto = { product_id: productId, page: 1, limit: 20 };
      await service.findAll(mockTenantId, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'batch.product_id = :product_id',
        { product_id: productId },
      );
    });

    it('should apply warehouse_id filter', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockInventoryBatch], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const warehouseId = '550e8400-e29b-41d4-a716-446655440010';
      const filters: BatchFilterDto = { warehouse_id: warehouseId, page: 1, limit: 20 };
      await service.findAll(mockTenantId, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'batch.warehouse_id = :warehouse_id',
        { warehouse_id: warehouseId },
      );
    });

    it('should apply date range filters', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockInventoryBatch], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters: BatchFilterDto = {
        created_from: '2024-01-01',
        created_to: '2024-12-31',
        page: 1,
        limit: 20,
      };
      await service.findAll(mockTenantId, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'batch.created_at >= :created_from',
        { created_from: new Date('2024-01-01') },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'batch.created_at <= :created_to',
        { created_to: new Date('2024-12-31') },
      );
    });

    it('should apply sorting', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockInventoryBatch], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters: BatchFilterDto = { sort_by: 'batch_number', sort_order: 'ASC', page: 1, limit: 20 };
      await service.findAll(mockTenantId, filters);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('batch.batch_number', 'ASC');
    });

    it('should apply pagination', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockInventoryBatch], 50]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters: BatchFilterDto = { page: 2, limit: 10 };
      const result = await service.findAll(mockTenantId, filters);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5);
    });

    it('should load all relations', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockInventoryBatch], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters: BatchFilterDto = { page: 1, limit: 20 };
      await service.findAll(mockTenantId, filters);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('batch.product', 'product');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('batch.warehouse', 'warehouse');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('batch.uom', 'uom');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'batch.purchase_order_batch',
        'purchase_order_batch',
      );
    });

    it('should return empty list when no batches found', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters: BatchFilterDto = { page: 1, limit: 20 };
      const result = await service.findAll(mockTenantId, filters);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should enforce tenant isolation', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockInventoryBatch], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const differentTenantId = '550e8400-e29b-41d4-a716-446655440099';
      const filters: BatchFilterDto = { page: 1, limit: 20 };
      await service.findAll(differentTenantId, filters);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'batch.tenant_id = :tenantId',
        { tenantId: differentTenantId },
      );
    });
  });

  describe('findById', () => {
    it('should return a single batch by ID', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockInventoryBatch),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const batchId = '550e8400-e29b-41d4-a716-446655440001';
      const result = await service.findById(batchId, mockTenantId);

      expect(result).toBeDefined();
      expect(result.id).toBe(batchId);
      expect(result.batch_number).toBe('BATCH-001');
    });

    it('should throw NotFoundException when batch does not exist', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const batchId = '550e8400-e29b-41d4-a716-446655440999';

      await expect(service.findById(batchId, mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should enforce tenant isolation', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockInventoryBatch),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const batchId = '550e8400-e29b-41d4-a716-446655440001';
      await service.findById(batchId, mockTenantId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'batch.id = :id AND batch.tenant_id = :tenantId',
        { id: batchId, tenantId: mockTenantId },
      );
    });

    it('should load all relations', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockInventoryBatch),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const batchId = '550e8400-e29b-41d4-a716-446655440001';
      await service.findById(batchId, mockTenantId);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('batch.product', 'product');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('batch.warehouse', 'warehouse');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('batch.uom', 'uom');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'batch.purchase_order_batch',
        'purchase_order_batch',
      );
    });

    it('should include all batch details in response', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockInventoryBatch),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const batchId = '550e8400-e29b-41d4-a716-446655440001';
      const result = await service.findById(batchId, mockTenantId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('batch_number');
      expect(result).toHaveProperty('warehouse_id');
      expect(result).toHaveProperty('warehouse_name');
      expect(result).toHaveProperty('product_id');
      expect(result).toHaveProperty('product_name');
      expect(result).toHaveProperty('product_sku');
      expect(result).toHaveProperty('uom_id');
      expect(result).toHaveProperty('uom_name');
      expect(result).toHaveProperty('quantity');
      expect(result).toHaveProperty('created_by');
      expect(result).toHaveProperty('created_at');
    });
  });

  describe('findByPurchaseOrderId', () => {
    it('should return all batches for a purchase order', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockInventoryBatch], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const poId = '550e8400-e29b-41d4-a716-446655440040';
      const filters: BatchFilterDto = { page: 1, limit: 20 };
      const result = await service.findByPurchaseOrderId(poId, mockTenantId, filters);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'batch.purchase_order_batch_id = :poId',
        { poId },
      );
    });

    it('should apply filters to PO batches', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockInventoryBatch], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const poId = '550e8400-e29b-41d4-a716-446655440040';
      const filters: BatchFilterDto = { batch_number: 'BATCH-001', page: 1, limit: 20 };
      await service.findByPurchaseOrderId(poId, mockTenantId, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(batch.batch_number) LIKE LOWER(:batch_number)',
        { batch_number: '%BATCH-001%' },
      );
    });

    it('should apply pagination to PO batches', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockInventoryBatch], 50]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const poId = '550e8400-e29b-41d4-a716-446655440040';
      const filters: BatchFilterDto = { page: 3, limit: 15 };
      const result = await service.findByPurchaseOrderId(poId, mockTenantId, filters);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(30);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(15);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(15);
    });

    it('should enforce tenant isolation for PO batches', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockInventoryBatch], 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const poId = '550e8400-e29b-41d4-a716-446655440040';
      const filters: BatchFilterDto = { page: 1, limit: 20 };
      await service.findByPurchaseOrderId(poId, mockTenantId, filters);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'batch.tenant_id = :tenantId',
        { tenantId: mockTenantId },
      );
    });

    it('should return empty list when no batches for PO', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const poId = '550e8400-e29b-41d4-a716-446655440040';
      const filters: BatchFilterDto = { page: 1, limit: 20 };
      const result = await service.findByPurchaseOrderId(poId, mockTenantId, filters);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('calculateTotalQuantity', () => {
    it('should calculate total quantity from batches', () => {
      const batches: BatchResponseDto[] = [
        { ...mockInventoryBatch, quantity: '100.000' } as any,
        { ...mockInventoryBatch, id: '2', quantity: '50.000' } as any,
        { ...mockInventoryBatch, id: '3', quantity: '25.500' } as any,
      ];

      const total = service.calculateTotalQuantity(batches);

      expect(total).toBe(175.5);
    });

    it('should return 0 for empty batch list', () => {
      const total = service.calculateTotalQuantity([]);

      expect(total).toBe(0);
    });

    it('should handle null batch list', () => {
      const total = service.calculateTotalQuantity(null as any);

      expect(total).toBe(0);
    });

    it('should handle batches with non-numeric quantities', () => {
      const batches: BatchResponseDto[] = [
        { ...mockInventoryBatch, quantity: '100.000' } as any,
        { ...mockInventoryBatch, id: '2', quantity: 'invalid' } as any,
      ];

      const total = service.calculateTotalQuantity(batches);

      expect(total).toBe(100);
    });
  });

  describe('Response Mapping', () => {
    it('should map InventoryBatch entity to BatchResponseDto', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockInventoryBatch),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const batchId = '550e8400-e29b-41d4-a716-446655440001';
      const result = await service.findById(batchId, mockTenantId);

      expect(result.id).toBe(mockInventoryBatch.id);
      expect(result.batch_number).toBe(mockInventoryBatch.batch_number);
      expect(result.warehouse_id).toBe(mockInventoryBatch.warehouse_id);
      expect(result.warehouse_name).toBe(mockInventoryBatch.warehouse.name);
      expect(result.product_id).toBe(mockInventoryBatch.product_id);
      expect(result.product_name).toBe(mockInventoryBatch.product.name);
      expect(result.product_sku).toBe(mockInventoryBatch.product.sku);
      expect(result.uom_id).toBe(mockInventoryBatch.uom_id);
      expect(result.uom_name).toBe(mockInventoryBatch.uom.name);
      expect(result.quantity).toBe(mockInventoryBatch.quantity.toString());
      expect(result.created_by).toBe(mockInventoryBatch.created_by);
      expect(result.created_at).toBe(mockInventoryBatch.created_at);
    });
  });
});
