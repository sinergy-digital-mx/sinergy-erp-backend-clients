import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { InventoryTransferLine } from '../../entities/inventory/inventory-transfer-line.entity';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { ProductDiscount } from '../../entities/products/product-discount.entity';
import { ProductUoM } from '../../entities/products/product-uom.entity';
import { ProductVendorCost } from '../../entities/products/product-vendor-cost.entity';
import { User } from '../../entities/users/user.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { S3Service } from '../../common/services/s3.service';
import { BatchFilterDto } from './dto/batch-filter.dto';
import { BatchResponseDto } from './dto/batch-response.dto';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockRepository: any;
  let mockProductPriceRepository: any;
  let mockProductVendorCostRepository: any;
  let mockWarehouseRepository: any;
  let mockFiscalConfigRepository: any;
  let mockBillingBranchRepository: any;
  let mockTransferLineRepository: any;
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
    initial_quantity: 100,
    available_quantity: 100,
    purchase_order_batch_id: '550e8400-e29b-41d4-a716-446655440040',
    purchase_order_batch: { folio: 'OC-000012', pedimento_number: '162430010001234' } as any,
    purchase_order_detail_id: '550e8400-e29b-41d4-a716-446655440050',
    purchase_order_detail: {} as any,
    created_by: mockUserId,
    created_at: new Date('2024-01-01'),
    tenant: {} as any,
  };

  const mockBatchListQueryBuilder = (
    data: InventoryBatch[] = [mockInventoryBatch],
    total = data.length,
  ) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(total),
    getMany: jest.fn().mockResolvedValue(data),
  });

  beforeEach(async () => {
    mockRepository = {
      createQueryBuilder: jest.fn(),
    };
    mockProductPriceRepository = {
      createQueryBuilder: jest.fn(),
    };
    mockProductVendorCostRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };
    mockWarehouseRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    mockFiscalConfigRepository = {
      find: jest.fn(),
    };
    mockBillingBranchRepository = {
      createQueryBuilder: jest.fn(),
    };
    mockTransferLineRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };
    mockS3Service = {
      getSignedUrl: jest.fn().mockResolvedValue('https://signed.example/photo.jpg'),
    };

    const emptyRepo = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(InventoryBatch),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(InventoryTransferLine),
          useValue: mockTransferLineRepository,
        },
        {
          provide: getRepositoryToken(ProductPrice),
          useValue: mockProductPriceRepository,
        },
        {
          provide: getRepositoryToken(ProductDiscount),
          useValue: emptyRepo,
        },
        {
          provide: getRepositoryToken(ProductUoM),
          useValue: emptyRepo,
        },
        {
          provide: getRepositoryToken(ProductVendorCost),
          useValue: mockProductVendorCostRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: emptyRepo,
        },
        {
          provide: getRepositoryToken(Warehouse),
          useValue: mockWarehouseRepository,
        },
        {
          provide: getRepositoryToken(FiscalConfiguration),
          useValue: mockFiscalConfigRepository,
        },
        {
          provide: getRepositoryToken(BillingBranch),
          useValue: mockBillingBranchRepository,
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
      const mockQueryBuilder = mockBatchListQueryBuilder();

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
      const mockQueryBuilder = mockBatchListQueryBuilder();

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters: BatchFilterDto = { batch_number: 'BATCH-001', page: 1, limit: 20 };
      await service.findAll(mockTenantId, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(batch.batch_number) LIKE LOWER(:batch_number)',
        { batch_number: '%BATCH-001%' },
      );
    });

    it('should apply product_id filter', async () => {
      const mockQueryBuilder = mockBatchListQueryBuilder();

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const productId = '550e8400-e29b-41d4-a716-446655440020';
      const filters: BatchFilterDto = { product_id: productId, page: 1, limit: 20 };
      await service.findAll(mockTenantId, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'batch.product_id = :product_id',
        { product_id: productId },
      );
    });

    it('should reject warehouse_id without sucursal', async () => {
      const mockQueryBuilder = mockBatchListQueryBuilder();

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const warehouseId = '550e8400-e29b-41d4-a716-446655440010';
      const filters: BatchFilterDto = { warehouse_id: warehouseId, page: 1, limit: 20 };

      await expect(service.findAll(mockTenantId, filters)).rejects.toThrow(BadRequestException);
    });

    it('should reject billing_branch_id without razón social', async () => {
      const mockQueryBuilder = mockBatchListQueryBuilder();

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters: BatchFilterDto = {
        billing_branch_id: '550e8400-e29b-41d4-a716-446655440011',
        page: 1,
        limit: 20,
      };

      await expect(service.findAll(mockTenantId, filters)).rejects.toThrow(
        'Selecciona una razón social antes de filtrar por sucursal',
      );
    });

    it('should apply fiscal + branch + warehouse cascade', async () => {
      const mockQueryBuilder = mockBatchListQueryBuilder();
      const mockBranchQuery = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440011' }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockBillingBranchRepository.createQueryBuilder.mockReturnValue(mockBranchQuery);
      mockWarehouseRepository.findOne.mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440010',
        billing_branch_id: '550e8400-e29b-41d4-a716-446655440011',
      });

      const fiscalId = '550e8400-e29b-41d4-a716-446655440099';
      const branchId = '550e8400-e29b-41d4-a716-446655440011';
      const warehouseId = '550e8400-e29b-41d4-a716-446655440010';
      const filters: BatchFilterDto = {
        fiscal_configuration_id: fiscalId,
        billing_branch_id: branchId,
        warehouse_id: warehouseId,
        page: 1,
        limit: 20,
      };

      await service.findAll(mockTenantId, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'billing_branch.fiscal_configuration_id = :fiscalConfigurationId',
        { fiscalConfigurationId: fiscalId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'warehouse.billing_branch_id = :billingBranchId',
        { billingBranchId: branchId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'batch.warehouse_id = :warehouse_id',
        { warehouse_id: warehouseId },
      );
    });

    it('should apply date range filters', async () => {
      const mockQueryBuilder = mockBatchListQueryBuilder();

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
      const mockQueryBuilder = mockBatchListQueryBuilder();

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters: BatchFilterDto = { sort_by: 'batch_number', sort_order: 'ASC', page: 1, limit: 20 };
      await service.findAll(mockTenantId, filters);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('batch.batch_number', 'ASC');
    });

    it('should apply pagination', async () => {
      const mockQueryBuilder = mockBatchListQueryBuilder([mockInventoryBatch], 50);

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
      const mockQueryBuilder = mockBatchListQueryBuilder();

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters: BatchFilterDto = { page: 1, limit: 20 };
      await service.findAll(mockTenantId, filters);

      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('batch.product', 'product');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('batch.warehouse', 'warehouse');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('batch.uom', 'uom');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'batch.purchase_order_batch',
        'purchase_order_batch',
      );
    });

    it('should return empty list when no batches found', async () => {
      const mockQueryBuilder = mockBatchListQueryBuilder([], 0);

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const filters: BatchFilterDto = { page: 1, limit: 20 };
      const result = await service.findAll(mockTenantId, filters);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should enforce tenant isolation', async () => {
      const mockQueryBuilder = mockBatchListQueryBuilder();

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
      expect(result).toHaveProperty('available_quantity');
      expect(result).toHaveProperty('purchase_order_folio');
      expect(result).toHaveProperty('pedimento_number');
      expect(result.pedimento_number).toBe('162430010001234');
    });
  });

  describe('findByPurchaseOrderId', () => {
    it('should return all batches for a purchase order', async () => {
      const mockQueryBuilder = mockBatchListQueryBuilder();

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
      const mockQueryBuilder = mockBatchListQueryBuilder();

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
      const mockQueryBuilder = mockBatchListQueryBuilder([mockInventoryBatch], 50);

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
      const mockQueryBuilder = mockBatchListQueryBuilder();

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
      const mockQueryBuilder = mockBatchListQueryBuilder([], 0);

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
      expect(result.available_quantity).toBe('100.000');
      expect(result.created_by).toBe(mockInventoryBatch.created_by);
      expect(result.created_at).toBe(mockInventoryBatch.created_at);
    });
  });

  describe('getLocationTree', () => {
    it('should nest warehouses under branches under razones sociales', async () => {
      mockFiscalConfigRepository.find.mockResolvedValue([
        {
          id: 'fiscal-1',
          razon_social: 'MADERERIA ZONA NORTE',
          rfc: 'MZN010101XXX',
          status: 'active',
        },
        {
          id: 'fiscal-2',
          razon_social: 'MADERAS FINAS Y HERRAJES',
          rfc: 'MFH210729R84',
          status: 'active',
        },
      ]);

      const mockBranchQuery = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'branch-1', fiscal_configuration_id: 'fiscal-1', code: 'Tijuana', status: 1 },
        ]),
      };
      mockBillingBranchRepository.createQueryBuilder.mockReturnValue(mockBranchQuery);
      mockWarehouseRepository.find.mockResolvedValue([
        { id: 'wh-1', name: 'Mostrador', status: 'active', billing_branch_id: 'branch-1' },
        { id: 'wh-orphan', name: 'Sin sucursal', status: 'active', billing_branch_id: null },
      ]);

      const result = await service.getLocationTree(mockTenantId);

      expect(mockFiscalConfigRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: mockTenantId },
        order: { created_at: 'DESC' },
      });
      expect(result.data).toHaveLength(2);
      expect(result.data[0].razon_social).toBe('MADERERIA ZONA NORTE');
      expect(result.data[1].razon_social).toBe('MADERAS FINAS Y HERRAJES');
      expect(result.data[0].branches).toHaveLength(1);
      expect(result.data[0].branches[0].name).toBe('Tijuana');
      expect(result.data[0].branches[0].warehouses).toEqual([
        { id: 'wh-1', name: 'Mostrador', status: 'active' },
      ]);
    });
  });

  describe('getStats', () => {
    const chainableQuery = (overrides: Record<string, any> = {}) => ({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({}),
      getRawMany: jest.fn().mockResolvedValue([]),
      ...overrides,
    });

    it('should return zeros when there is no inventory', async () => {
      mockRepository.createQueryBuilder
        .mockReturnValueOnce(chainableQuery({
          getRawOne: jest.fn().mockResolvedValue({
            total_batches: '0',
            batches_with_stock: '0',
            total_products: '0',
            products_with_stock: '0',
            total_warehouses: '0',
            total_available_quantity: '0',
            total_initial_quantity: '0',
          }),
        }))
        .mockReturnValueOnce(chainableQuery({
          getRawMany: jest.fn().mockResolvedValue([]),
        }));

      const result = await service.getStats(mockTenantId, {});

      expect(result.total_batches).toBe(0);
      expect(result.total_cost).toBe('0.00');
      expect(result.total_sale_value).toBe('0.00');
      expect(result.gross_margin).toBe('0.00');
      expect(result.gross_margin_percentage).toBe('0.00');
      expect(result.average_unit_price).toBe('0.00');
    });

    it('should compute cost vs sale value, average price and margins', async () => {
      mockRepository.createQueryBuilder
        .mockReturnValueOnce(chainableQuery({
          getRawOne: jest.fn().mockResolvedValue({
            total_batches: '10',
            batches_with_stock: '8',
            total_products: '2',
            products_with_stock: '2',
            total_warehouses: '1',
            total_available_quantity: '100',
            total_initial_quantity: '120',
          }),
        }))
        .mockReturnValueOnce(chainableQuery({
          getRawMany: jest.fn().mockResolvedValue([
            {
              product_id: 'prod-1',
              uom_id: 'uom-1',
              qty: '100',
              po_cost: '2000',
              qty_with_po_cost: '100',
              batches: '10',
            },
          ]),
        }));

      mockProductPriceRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            product_id: 'prod-1',
            product_uom: { uom_catalog_id: 'uom-1' },
            price: 50,
            iva_percentage: 16,
            ieps_percentage: 0,
            total: 58,
            price_list_id: 'pl-1',
            price_list: { name: 'General' },
          },
        ]),
      });

      const result = await service.getStats(mockTenantId, {});

      expect(result.total_batches).toBe(10);
      expect(result.batches_with_stock).toBe(8);
      expect(result.batches_depleted).toBe(2);
      expect(result.total_cost).toBe('2000.00');
      expect(result.total_sale_value).toBe('5000.00');
      expect(result.average_unit_cost).toBe('20.00');
      expect(result.average_unit_price).toBe('50.00');
      expect(result.gross_margin).toBe('3000.00');
      expect(result.gross_margin_percentage).toBe('60.00');
      expect(result.products_without_price).toBe(0);
    });

    it('should count products without a price list', async () => {
      mockRepository.createQueryBuilder
        .mockReturnValueOnce(chainableQuery({
          getRawOne: jest.fn().mockResolvedValue({
            total_batches: '1',
            batches_with_stock: '1',
            total_products: '1',
            products_with_stock: '1',
            total_warehouses: '1',
            total_available_quantity: '10',
            total_initial_quantity: '10',
          }),
        }))
        .mockReturnValueOnce(chainableQuery({
          getRawMany: jest.fn().mockResolvedValue([
            {
              product_id: 'prod-2',
              uom_id: 'uom-2',
              qty: '10',
              po_cost: '100',
              qty_with_po_cost: '10',
              batches: '1',
            },
          ]),
        }));

      mockProductPriceRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getStats(mockTenantId, {});

      expect(result.total_sale_value).toBe('0.00');
      expect(result.products_without_price).toBe(1);
      expect(result.quantity_without_price).toBe('10.000');
      expect(result.gross_margin).toBe('-100.00');
      expect(result.gross_margin_percentage).toBe('0.00');
    });

    it('should use vendor average cost when the batch has no purchase order', async () => {
      mockRepository.createQueryBuilder
        .mockReturnValueOnce(chainableQuery({
          getRawOne: jest.fn().mockResolvedValue({
            total_batches: '2536',
            batches_with_stock: '2536',
            total_products: '1',
            products_with_stock: '1',
            total_warehouses: '3',
            total_available_quantity: '100',
            total_initial_quantity: '100',
          }),
        }))
        .mockReturnValueOnce(chainableQuery({
          getRawMany: jest.fn().mockResolvedValue([
            {
              product_id: 'prod-imp',
              uom_id: 'uom-pieza',
              qty: '100',
              po_cost: '0',
              qty_with_po_cost: '0',
              batches: '2536',
            },
          ]),
        }));

      mockProductPriceRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            product_id: 'prod-imp',
            product_uom: { uom_catalog_id: 'uom-pieza' },
            price: 80,
            iva_percentage: 16,
            ieps_percentage: 0,
            total: 92.8,
            price_list_id: 'pl-1',
            price_list: { name: 'General' },
          },
        ]),
      });

      mockProductVendorCostRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            product_id: 'prod-imp',
            cost: 20,
            product_uom: { uom_catalog_id: 'uom-pieza', factor: 1 },
          },
        ]),
      });

      const result = await service.getStats(mockTenantId, {});

      expect(result.total_cost).toBe('2000.00');
      expect(result.average_unit_cost).toBe('20.00');
      expect(result.total_sale_value).toBe('8000.00');
      expect(result.gross_margin).toBe('6000.00');
      expect(result.gross_margin_percentage).toBe('75.00');
      expect(result.batches_without_cost).toBe(0);
    });

    it('should reject warehouse filter without branch', async () => {
      await expect(
        service.getStats(mockTenantId, {
          warehouse_id: '550e8400-e29b-41d4-a716-446655440010',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
