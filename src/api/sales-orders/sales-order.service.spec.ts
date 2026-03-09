import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SalesOrderService } from './sales-order.service';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';
import * as fc from 'fast-check';

describe('SalesOrderService', () => {
  let service: SalesOrderService;
  let repository: Repository<SalesOrder>;
  let queryBuilder: Partial<SelectQueryBuilder<SalesOrder>>;

  beforeEach(async () => {
    // Mock query builder
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOrderService,
        {
          provide: getRepositoryToken(SalesOrder),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => queryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<SalesOrderService>(SalesOrderService);
    repository = module.get<Repository<SalesOrder>>(
      getRepositoryToken(SalesOrder),
    );
  });

  describe('findAll', () => {
    const tenantId = 'test-tenant-id';

    it('should return paginated results with default parameters', async () => {
      const mockOrders: SalesOrder[] = [
        {
          id: '1',
          tenant_id: tenantId,
          name: 'Order 1',
          description: 'Test',
          status: 'draft',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        } as SalesOrder,
      ];

      (queryBuilder.getCount as jest.Mock).mockResolvedValue(1);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await service.findAll(tenantId);

      expect(result).toEqual({
        data: mockOrders,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'sales_order.tenant_id = :tenantId',
        { tenantId },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'sales_order.created_at',
        'DESC',
      );
    });

    it('should normalize page to 1 when less than 1', async () => {
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(0);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(tenantId, { page: 0 });

      expect(result.page).toBe(1);
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    });

    it('should normalize limit to 1 when less than 1', async () => {
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(0);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(tenantId, { limit: 0 });

      expect(result.limit).toBe(1);
      expect(queryBuilder.take).toHaveBeenCalledWith(1);
    });

    it('should cap limit at 100 when greater than 100', async () => {
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(0);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(tenantId, { limit: 150 });

      expect(result.limit).toBe(100);
      expect(queryBuilder.take).toHaveBeenCalledWith(100);
    });

    it('should apply search filter case-insensitively', async () => {
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(0);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(tenantId, { search: 'Order' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(sales_order.name) LIKE LOWER(:search)',
        { search: '%Order%' },
      );
    });

    it('should apply status filter exactly', async () => {
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(0);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(tenantId, { status: 'confirmed' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'sales_order.status = :status',
        { status: 'confirmed' },
      );
    });

    it('should apply both search and status filters', async () => {
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(0);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(tenantId, {
        search: 'Order',
        status: 'confirmed',
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });

    it('should calculate pagination metadata correctly', async () => {
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(45);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(tenantId, { page: 2, limit: 20 });

      expect(result.total).toBe(45);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(3);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it('should set hasNext to false on last page', async () => {
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(45);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(tenantId, { page: 3, limit: 20 });

      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    it('should set hasPrev to false on first page', async () => {
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(45);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(tenantId, { page: 1, limit: 20 });

      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('should calculate skip correctly for pagination', async () => {
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(100);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(tenantId, { page: 3, limit: 25 });

      expect(queryBuilder.skip).toHaveBeenCalledWith(50); // (3-1) * 25
      expect(queryBuilder.take).toHaveBeenCalledWith(25);
    });
  });

  describe('findOne', () => {
    const tenantId = 'test-tenant-id';
    const orderId = 'test-order-id';

    beforeEach(() => {
      repository.findOneOrFail = jest.fn();
    });

    it('should return a sales order when found', async () => {
      const mockOrder = {
        id: orderId,
        tenant_id: tenantId,
        name: 'Order 1',
        description: 'Test order',
        status: 'draft',
        metadata: { key: 'value' },
        created_at: new Date(),
        updated_at: new Date(),
      } as unknown as SalesOrder;

      (repository.findOneOrFail as jest.Mock).mockResolvedValue(mockOrder);

      const result = await service.findOne(orderId, tenantId);

      expect(result).toEqual(mockOrder);
      expect(repository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: orderId, tenant_id: tenantId },
      });
    });

    it('should throw error when order not found', async () => {
      (repository.findOneOrFail as jest.Mock).mockRejectedValue(
        new Error('EntityNotFoundError'),
      );

      await expect(service.findOne(orderId, tenantId)).rejects.toThrow();
      expect(repository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: orderId, tenant_id: tenantId },
      });
    });

    it('should throw error when order belongs to different tenant', async () => {
      const differentTenantId = 'different-tenant-id';

      (repository.findOneOrFail as jest.Mock).mockRejectedValue(
        new Error('EntityNotFoundError'),
      );

      await expect(
        service.findOne(orderId, differentTenantId),
      ).rejects.toThrow();
      expect(repository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: orderId, tenant_id: differentTenantId },
      });
    });

    it('should return all fields including metadata', async () => {
      const mockOrder = {
        id: orderId,
        tenant_id: tenantId,
        name: 'Complete Order',
        description: 'Full description',
        status: 'confirmed',
        metadata: { custom: 'data', priority: 'high' },
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
      } as unknown as SalesOrder;

      (repository.findOneOrFail as jest.Mock).mockResolvedValue(mockOrder);

      const result = await service.findOne(orderId, tenantId);

      expect(result.id).toBe(orderId);
      expect(result.tenant_id).toBe(tenantId);
      expect(result.name).toBe('Complete Order');
      expect(result.description).toBe('Full description');
      expect(result.status).toBe('confirmed');
      expect(result.metadata).toEqual({ custom: 'data', priority: 'high' });
      expect(result.created_at).toEqual(new Date('2024-01-01'));
      expect(result.updated_at).toEqual(new Date('2024-01-02'));
    });
  });

  describe('findAll - Property-Based Tests', () => {
    const tenantId = 'test-tenant-id';

    beforeEach(() => {
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(0);
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);
    });

    // Feature: sales-orders, Property 11: Pagination Bounds Enforcement
    it('should enforce pagination bounds for any input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -100, max: 200 }),
          fc.integer({ min: -100, max: 200 }),
          async (page, limit) => {
            const result = await service.findAll(tenantId, { page, limit });

            expect(result.page).toBeGreaterThanOrEqual(1);
            expect(result.limit).toBeGreaterThanOrEqual(1);
            expect(result.limit).toBeLessThanOrEqual(100);
          },
        ),
        { numRuns: 100 },
      );
    });

    // Feature: sales-orders, Property 12: Pagination Metadata Completeness
    it('should return complete pagination metadata for any valid input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          async (page, limit, total) => {
            (queryBuilder.getCount as jest.Mock).mockResolvedValue(total);

            const result = await service.findAll(tenantId, { page, limit });

            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('page');
            expect(result).toHaveProperty('limit');
            expect(result).toHaveProperty('totalPages');
            expect(result).toHaveProperty('hasNext');
            expect(result).toHaveProperty('hasPrev');

            expect(result.total).toBe(total);
            expect(result.page).toBe(page);
            expect(result.limit).toBe(limit);
            expect(result.totalPages).toBe(Math.ceil(total / limit));
            expect(result.hasNext).toBe(page < Math.ceil(total / limit));
            expect(result.hasPrev).toBe(page > 1);
          },
        ),
        { numRuns: 100 },
      );
    });

    // Feature: sales-orders, Property 10: Pagination Defaults
    it('should apply default pagination when no parameters provided', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(undefined), async () => {
          const result = await service.findAll(tenantId);

          expect(result.page).toBe(1);
          expect(result.limit).toBe(20);
        }),
        { numRuns: 10 },
      );
    });

    // Feature: sales-orders, Property 14: Search Filter Behavior
    it('should apply search filter with proper wildcards', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (searchTerm) => {
            await service.findAll(tenantId, { search: searchTerm });

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
              'LOWER(sales_order.name) LIKE LOWER(:search)',
              { search: `%${searchTerm}%` },
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    // Feature: sales-orders, Property 15: Status Filter Behavior
    it('should apply exact status filter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'draft',
            'confirmed',
            'processing',
            'completed',
            'cancelled',
          ),
          async (status) => {
            await service.findAll(tenantId, { status });

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
              'sales_order.status = :status',
              { status },
            );
          },
        ),
        { numRuns: 50 },
      );
    });

    // Feature: sales-orders, Property 3: Tenant Isolation
    it('should always filter by tenant_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            page: fc.option(fc.integer({ min: 1, max: 10 }), {
              nil: undefined,
            }),
            limit: fc.option(fc.integer({ min: 1, max: 100 }), {
              nil: undefined,
            }),
            search: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
            status: fc.option(
              fc.constantFrom(
                'draft',
                'confirmed',
                'processing',
                'completed',
                'cancelled',
              ),
              { nil: undefined },
            ),
          }),
          async (testTenantId, query) => {
            await service.findAll(testTenantId, query);

            expect(queryBuilder.where).toHaveBeenCalledWith(
              'sales_order.tenant_id = :tenantId',
              { tenantId: testTenantId },
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('update', () => {
    const tenantId = 'test-tenant-id';
    const orderId = 'test-order-id';

    beforeEach(() => {
      repository.findOneOrFail = jest.fn();
      repository.save = jest.fn();
    });

  it('should update a sales order with partial data', async () => {
    const existingOrder = {
      id: orderId,
      tenant_id: tenantId,
      name: 'Original Order',
      description: 'Original description',
      status: 'draft',
      metadata: {},
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    } as unknown as SalesOrder;

    const updateDto = {
      name: 'Updated Order',
      status: 'confirmed',
    };

    const updatedOrder = {
      ...existingOrder,
      ...updateDto,
      updated_at: new Date('2024-01-02'),
    };

    (repository.findOneOrFail as jest.Mock).mockResolvedValue(existingOrder);
    (repository.save as jest.Mock).mockResolvedValue(updatedOrder);

    const result = await service.update(orderId, updateDto, tenantId);

    expect(repository.findOneOrFail).toHaveBeenCalledWith({
      where: { id: orderId, tenant_id: tenantId },
    });
    expect(repository.save).toHaveBeenCalled();
    expect(result.name).toBe('Updated Order');
    expect(result.status).toBe('confirmed');
  });

  it('should throw error when order not found', async () => {
    const updateDto = { name: 'Updated Order' };

    (repository.findOneOrFail as jest.Mock).mockRejectedValue(
      new Error('EntityNotFoundError'),
    );

    await expect(
      service.update(orderId, updateDto, tenantId),
    ).rejects.toThrow();
    expect(repository.findOneOrFail).toHaveBeenCalledWith({
      where: { id: orderId, tenant_id: tenantId },
    });
  });

  it('should throw error when order belongs to different tenant', async () => {
    const differentTenantId = 'different-tenant-id';
    const updateDto = { name: 'Updated Order' };

    (repository.findOneOrFail as jest.Mock).mockRejectedValue(
      new Error('EntityNotFoundError'),
    );

    await expect(
      service.update(orderId, updateDto, differentTenantId),
    ).rejects.toThrow();
    expect(repository.findOneOrFail).toHaveBeenCalledWith({
      where: { id: orderId, tenant_id: differentTenantId },
    });
  });

  it('should apply partial updates using Object.assign', async () => {
    const existingOrder = {
      id: orderId,
      tenant_id: tenantId,
      name: 'Original Order',
      description: 'Original description',
      status: 'draft',
      metadata: { key: 'value' },
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    } as unknown as SalesOrder;

    const updateDto = {
      description: 'Updated description',
    };

    (repository.findOneOrFail as jest.Mock).mockResolvedValue(existingOrder);
    (repository.save as jest.Mock).mockImplementation((order) =>
      Promise.resolve(order),
    );

    await service.update(orderId, updateDto, tenantId);

    const savedOrder = (repository.save as jest.Mock).mock.calls[0][0];
    expect(savedOrder.name).toBe('Original Order'); // unchanged
    expect(savedOrder.description).toBe('Updated description'); // updated
    expect(savedOrder.status).toBe('draft'); // unchanged
    expect(savedOrder.metadata).toEqual({ key: 'value' }); // unchanged
  });

  it('should update all fields when all are provided', async () => {
    const existingOrder = {
      id: orderId,
      tenant_id: tenantId,
      name: 'Original Order',
      description: 'Original description',
      status: 'draft',
      metadata: {},
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    } as unknown as SalesOrder;

    const updateDto = {
      name: 'Completely Updated Order',
      description: 'Completely updated description',
      status: 'completed',
      metadata: { updated: true },
    };

    (repository.findOneOrFail as jest.Mock).mockResolvedValue(existingOrder);
    (repository.save as jest.Mock).mockImplementation((order) =>
      Promise.resolve(order),
    );

    await service.update(orderId, updateDto, tenantId);

    const savedOrder = (repository.save as jest.Mock).mock.calls[0][0];
    expect(savedOrder.name).toBe('Completely Updated Order');
    expect(savedOrder.description).toBe('Completely updated description');
    expect(savedOrder.status).toBe('completed');
    expect(savedOrder.metadata).toEqual({ updated: true });
  });
});

  describe('remove', () => {
    const tenantId = 'test-tenant-id';
    const orderId = 'test-order-id';

    beforeEach(() => {
      repository.findOneOrFail = jest.fn();
      repository.remove = jest.fn();
    });

    it('should remove a sales order when found', async () => {
      const mockOrder = {
        id: orderId,
        tenant_id: tenantId,
        name: 'Order to Delete',
        description: 'Test order',
        status: 'draft',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      } as unknown as SalesOrder;

      (repository.findOneOrFail as jest.Mock).mockResolvedValue(mockOrder);
      (repository.remove as jest.Mock).mockResolvedValue(mockOrder);

      await service.remove(orderId, tenantId);

      expect(repository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: orderId, tenant_id: tenantId },
      });
      expect(repository.remove).toHaveBeenCalledWith(mockOrder);
    });

    it('should throw error when order not found', async () => {
      (repository.findOneOrFail as jest.Mock).mockRejectedValue(
        new Error('EntityNotFoundError'),
      );

      await expect(service.remove(orderId, tenantId)).rejects.toThrow();
      expect(repository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: orderId, tenant_id: tenantId },
      });
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('should throw error when order belongs to different tenant', async () => {
      const differentTenantId = 'different-tenant-id';

      (repository.findOneOrFail as jest.Mock).mockRejectedValue(
        new Error('EntityNotFoundError'),
      );

      await expect(
        service.remove(orderId, differentTenantId),
      ).rejects.toThrow();
      expect(repository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: orderId, tenant_id: differentTenantId },
      });
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('should perform hard delete using repository.remove', async () => {
      const mockOrder = {
        id: orderId,
        tenant_id: tenantId,
        name: 'Order to Delete',
        description: 'Test order',
        status: 'draft',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      } as unknown as SalesOrder;

      (repository.findOneOrFail as jest.Mock).mockResolvedValue(mockOrder);
      (repository.remove as jest.Mock).mockResolvedValue(mockOrder);

      await service.remove(orderId, tenantId);

      expect(repository.remove).toHaveBeenCalledTimes(1);
      expect(repository.remove).toHaveBeenCalledWith(mockOrder);
    });

    it('should return void', async () => {
      const mockOrder = {
        id: orderId,
        tenant_id: tenantId,
        name: 'Order to Delete',
        description: 'Test order',
        status: 'draft',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      } as unknown as SalesOrder;

      (repository.findOneOrFail as jest.Mock).mockResolvedValue(mockOrder);
      (repository.remove as jest.Mock).mockResolvedValue(mockOrder);

      const result = await service.remove(orderId, tenantId);

      expect(result).toBeUndefined();
    });
  });
});

  describe('create - Property-Based Tests', () => {
    beforeEach(() => {
      // Mock repository.create to return the input with an id
      (repository.create as jest.Mock).mockImplementation((data) => ({
        ...data,
        id: 'generated-uuid',
      }));

      // Mock repository.save to return the input with timestamps
      (repository.save as jest.Mock).mockImplementation((entity) => {
        const now = new Date();
        return Promise.resolve({
          ...entity,
          created_at: now,
          updated_at: now,
        });
      });
    });

    // **Validates: Requirements 1.3, 1.4, 2.6**
    it('Property 1: Automatic Timestamp Creation - should automatically set timestamps on creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ maxLength: 500 }), {
              nil: undefined,
            }),
            status: fc.option(
              fc.constantFrom(
                'draft',
                'confirmed',
                'processing',
                'completed',
                'cancelled',
              ),
              { nil: undefined },
            ),
            metadata: fc.option(
              fc.dictionary(fc.string(), fc.anything()),
              { nil: undefined },
            ),
          }),
          fc.uuid(),
          async (dto, tenantId) => {
            const before = new Date();
            const result = await service.create(dto, tenantId);
            const after = new Date();

            // Verify timestamps are defined
            expect(result.created_at).toBeDefined();
            expect(result.updated_at).toBeDefined();

            // Verify timestamps are within reasonable delta (within test execution time)
            expect(result.created_at.getTime()).toBeGreaterThanOrEqual(
              before.getTime() - 1000,
            ); // 1 second tolerance
            expect(result.created_at.getTime()).toBeLessThanOrEqual(
              after.getTime() + 1000,
            );
            expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(
              before.getTime() - 1000,
            );
            expect(result.updated_at.getTime()).toBeLessThanOrEqual(
              after.getTime() + 1000,
            );

            // Verify created_at and updated_at are the same on creation
            expect(result.created_at.getTime()).toBe(
              result.updated_at.getTime(),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    // **Validates: Requirements 1.3, 1.4, 2.2, 2.6, 8.5, 12.3**
    it('Property 2: Automatic Tenant Assignment - should assign tenant_id from authenticated user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ maxLength: 500 }), {
              nil: undefined,
            }),
            status: fc.option(
              fc.constantFrom(
                'draft',
                'confirmed',
                'processing',
                'completed',
                'cancelled',
              ),
              { nil: undefined },
            ),
            metadata: fc.option(
              fc.dictionary(fc.string(), fc.anything()),
              { nil: undefined },
            ),
          }),
          fc.uuid(),
          async (dto, tenantId) => {
            const result = await service.create(dto, tenantId);

            // Verify tenant_id is set to the provided tenantId
            expect(result.tenant_id).toBe(tenantId);

            // Verify repository.create was called with tenant_id
            expect(repository.create).toHaveBeenCalledWith({
              ...dto,
              tenant_id: tenantId,
            });

            // Verify repository.save was called
            expect(repository.save).toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
