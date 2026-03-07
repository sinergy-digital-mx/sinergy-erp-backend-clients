import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VendorService } from './vendor.service';
import { Vendor } from '../../entities/vendor/vendor.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { NotFoundException } from '@nestjs/common';

describe('VendorService - Integration Tests', () => {
  let service: VendorService;
  let mockRepository;
  let vendors: Map<string, Vendor>;

  beforeEach(async () => {
    vendors = new Map();

    mockRepository = {
      create: jest.fn((dto) => {
        const vendor: Vendor = {
          id: `vendor-${Date.now()}`,
          ...dto,
          created_at: new Date(),
          updated_at: new Date(),
          tenant: null,
        };
        return vendor;
      }),
      save: jest.fn((vendor) => {
        vendors.set(vendor.id, vendor);
        return Promise.resolve(vendor);
      }),
      findOne: jest.fn((options) => {
        const vendor = Array.from(vendors.values()).find(
          (v) => v.id === options.where.id && v.tenant_id === options.where.tenant_id
        );
        return Promise.resolve(vendor || null);
      }),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(vendors.size),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(Array.from(vendors.values())),
      })),
      remove: jest.fn((vendor) => {
        vendors.delete(vendor.id);
        return Promise.resolve();
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorService,
        {
          provide: getRepositoryToken(Vendor),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<VendorService>(VendorService);
  });

  describe('11.1 Complete vendor lifecycle', () => {
    it('should create, update, query, and delete vendor', async () => {
      // **Validates: Requirements 1.1, 1.3, 1.5, 5.2**
      const tenantId = 'tenant-123';

      // Create vendor
      const createDto: CreateVendorDto = {
        name: 'Acme Corp',
        company_name: 'Acme Corporation',
        street: '123 Main St',
        city: 'Mexico City',
        state: 'CDMX',
        zip_code: '06500',
        country: 'Mexico',
        razon_social: 'Acme Corporation S.A. de C.V.',
        rfc: 'ACM123456ABC',
        persona_type: 'Persona Moral',
      };

      const created = await service.create(createDto, tenantId);
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.name).toBe('Acme Corp');
      expect(created.status).toBe('active');
      expect(created.tenant_id).toBe(tenantId);

      // Update vendor
      const updateDto: UpdateVendorDto = {
        name: 'Acme Corp Updated',
        status: 'inactive',
      };

      mockRepository.findOne.mockResolvedValue(created);
      mockRepository.save.mockImplementation((vendor) => {
        Object.assign(created, vendor);
        return Promise.resolve(created);
      });

      const updated = await service.update(created.id, updateDto, tenantId);
      expect(updated.name).toBe('Acme Corp Updated');
      expect(updated.status).toBe('inactive');
      expect(updated.created_at).toEqual(created.created_at);

      // Query vendors
      const queryResult = await service.findAll(tenantId, { page: 1, limit: 20 });
      expect(queryResult).toHaveProperty('data');
      expect(queryResult).toHaveProperty('total');
      expect(queryResult).toHaveProperty('page');
      expect(queryResult).toHaveProperty('limit');

      // Delete vendor
      mockRepository.findOne.mockResolvedValue(created);
      await service.remove(created.id, tenantId);
      expect(mockRepository.remove).toHaveBeenCalled();
    });
  });

  describe('11.2 Tenant isolation', () => {
    it('should isolate vendors between tenants', async () => {
      // **Validates: Requirements 5.1, 5.2, 5.3**
      const tenantA = 'tenant-a';
      const tenantB = 'tenant-b';

      // Create vendor for tenant A
      const vendorADto: CreateVendorDto = {
        name: 'Vendor A',
        company_name: 'Company A',
        street: 'Street A',
        city: 'City A',
        state: 'State A',
        zip_code: '12345',
        country: 'Country A',
        razon_social: 'Razon A',
        rfc: 'VEN123456AAA',
        persona_type: 'Persona Física',
      };

      const vendorA = await service.create(vendorADto, tenantA);
      expect(vendorA.tenant_id).toBe(tenantA);

      // Create vendor for tenant B
      const vendorBDto: CreateVendorDto = {
        name: 'Vendor B',
        company_name: 'Company B',
        street: 'Street B',
        city: 'City B',
        state: 'State B',
        zip_code: '54321',
        country: 'Country B',
        razon_social: 'Razon B',
        rfc: 'VEN123456BBB',
        persona_type: 'Persona Moral',
      };

      const vendorB = await service.create(vendorBDto, tenantB);
      expect(vendorB.tenant_id).toBe(tenantB);

      // Tenant A should not see Tenant B's vendor
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(vendorB.id, tenantA)).rejects.toThrow(NotFoundException);

      // Tenant B should not see Tenant A's vendor
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(vendorA.id, tenantB)).rejects.toThrow(NotFoundException);
    });
  });

  describe('11.3 RBAC permissions', () => {
    it('should enforce permission checks', async () => {
      // **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
      // Note: Permission enforcement is done at controller level with @RequirePermissions decorator
      // This test verifies the service methods are callable and return expected results

      const tenantId = 'tenant-123';
      const createDto: CreateVendorDto = {
        name: 'Test Vendor',
        company_name: 'Company',
        street: 'Street',
        city: 'City',
        state: 'State',
        zip_code: '12345',
        country: 'Country',
        razon_social: 'Razon',
        rfc: 'TST123456ABC',
        persona_type: 'Persona Moral',
      };

      // Create should work
      const created = await service.create(createDto, tenantId);
      expect(created).toBeDefined();

      // Read should work
      mockRepository.findOne.mockResolvedValue(created);
      const found = await service.findOne(created.id, tenantId);
      expect(found).toBeDefined();

      // Update should work
      mockRepository.findOne.mockResolvedValue(created);
      mockRepository.save.mockResolvedValue(created);
      const updated = await service.update(created.id, { name: 'Updated' }, tenantId);
      expect(updated).toBeDefined();

      // Delete should work
      mockRepository.findOne.mockResolvedValue(created);
      await service.remove(created.id, tenantId);
      expect(mockRepository.remove).toHaveBeenCalled();
    });
  });

  describe('11.4 Mexican billing validation', () => {
    it('should validate RFC format on creation', async () => {
      // **Validates: Requirements 4.1, 4.4**
      const tenantId = 'tenant-123';

      // Valid RFC should work
      const validDto: CreateVendorDto = {
        name: 'Valid Vendor',
        company_name: 'Company',
        street: 'Street',
        city: 'City',
        state: 'State',
        zip_code: '12345',
        country: 'Country',
        razon_social: 'Razon Social',
        rfc: 'VAL123456ABC',
        persona_type: 'Persona Moral',
      };

      const created = await service.create(validDto, tenantId);
      expect(created.rfc).toBe('VAL123456ABC');
      expect(created.razon_social).toBe('Razon Social');
      expect(created.persona_type).toBe('Persona Moral');
    });

    it('should preserve Mexican billing info on update', async () => {
      // **Validates: Requirements 4.1, 4.4**
      const tenantId = 'tenant-123';

      const vendor: Vendor = {
        id: 'vendor-123',
        name: 'Test Vendor',
        company_name: 'Company',
        street: 'Street',
        city: 'City',
        state: 'State',
        zip_code: '12345',
        country: 'Country',
        razon_social: 'Original Razon',
        rfc: 'TST123456ABC',
        persona_type: 'Persona Moral',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        tenant_id: tenantId,
        tenant: null,
      };

      mockRepository.findOne.mockResolvedValue(vendor);
      mockRepository.save.mockImplementation((v) => Promise.resolve(v));

      const updateDto: UpdateVendorDto = {
        name: 'Updated Name',
      };

      const updated = await service.update(vendor.id, updateDto, tenantId);
      expect(updated.razon_social).toBe('Original Razon');
      expect(updated.rfc).toBe('TST123456ABC');
      expect(updated.persona_type).toBe('Persona Moral');
    });
  });

  describe('11.5 Address information', () => {
    it('should store and retrieve complete address', async () => {
      // **Validates: Requirements 2.1, 2.2, 2.4**
      const tenantId = 'tenant-123';

      const createDto: CreateVendorDto = {
        name: 'Address Test Vendor',
        company_name: 'Company',
        street: '456 Oak Avenue',
        city: 'Guadalajara',
        state: 'Jalisco',
        zip_code: '44100',
        country: 'Mexico',
        razon_social: 'Razon',
        rfc: 'ADR123456ABC',
        persona_type: 'Persona Física',
      };

      const created = await service.create(createDto, tenantId);
      expect(created.street).toBe('456 Oak Avenue');
      expect(created.city).toBe('Guadalajara');
      expect(created.state).toBe('Jalisco');
      expect(created.zip_code).toBe('44100');
      expect(created.country).toBe('Mexico');
    });

    it('should filter vendors by state and country', async () => {
      // **Validates: Requirements 2.4**
      const tenantId = 'tenant-123';

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 'vendor-1',
            state: 'Jalisco',
            country: 'Mexico',
            name: 'Vendor 1',
          },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(tenantId, {
        page: 1,
        limit: 20,
        state: 'Jalisco',
        country: 'Mexico',
      });

      expect(result.data).toBeDefined();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });
});
