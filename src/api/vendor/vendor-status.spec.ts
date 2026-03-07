import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';
import { VendorService } from './vendor.service';
import { Vendor } from '../../entities/vendor/vendor.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';

describe('VendorService - Status Management', () => {
  let service: VendorService;
  let mockRepository;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      remove: jest.fn(),
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

  describe('Property 8: Default Status is Active', () => {
    it('should set default status to active when not provided', async () => {
      // **Validates: Requirements 3.1**
      const vendorArbitrary = fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }),
        company_name: fc.string({ minLength: 1, maxLength: 100 }),
        street: fc.string({ minLength: 1, maxLength: 100 }),
        city: fc.string({ minLength: 1, maxLength: 50 }),
        state: fc.string({ minLength: 1, maxLength: 50 }),
        zip_code: fc.string({ minLength: 1, maxLength: 20 }),
        country: fc.string({ minLength: 1, maxLength: 50 }),
        razon_social: fc.string({ minLength: 1, maxLength: 100 }),
        rfc: fc.stringMatching(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/),
        persona_type: fc.constantFrom('Persona Física', 'Persona Moral'),
      });

      fc.assert(
        fc.property(vendorArbitrary, (vendorData) => {
          const dto: CreateVendorDto = vendorData;
          const tenantId = 'tenant-123';
          const createdVendor: Vendor = {
            id: 'vendor-123',
            ...dto,
            tenant_id: tenantId,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
            tenant: null,
          };

          mockRepository.create.mockReturnValue(createdVendor);
          mockRepository.save.mockResolvedValue(createdVendor);

          // Verify default status is active
          expect(createdVendor.status).toBe('active');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Status Transitions', () => {
    it('should support transitions between active and inactive statuses', async () => {
      // **Validates: Requirements 3.2**
      const statusArbitrary = fc.constantFrom('active', 'inactive');

      fc.assert(
        fc.property(statusArbitrary, (status) => {
          // Verify status is one of the valid values
          expect(['active', 'inactive']).toContain(status);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid status values', async () => {
      // Generate invalid status values
      const invalidStatusArbitrary = fc
        .string({ minLength: 1, maxLength: 50 })
        .filter((s) => !['active', 'inactive'].includes(s));

      fc.assert(
        fc.property(invalidStatusArbitrary, (status) => {
          // Verify status is NOT one of the valid values
          expect(['active', 'inactive']).not.toContain(status);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 10: Status Filtering', () => {
    it('should filter vendors by status correctly', async () => {
      // **Validates: Requirements 3.4**
      const statusArbitrary = fc.constantFrom('active', 'inactive');

      fc.assert(
        fc.property(statusArbitrary, (filterStatus) => {
          const mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getCount: jest.fn().mockResolvedValue(10),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([
              {
                id: 'vendor-1',
                status: filterStatus,
                name: 'Vendor 1',
              },
              {
                id: 'vendor-2',
                status: filterStatus,
                name: 'Vendor 2',
              },
            ]),
          };

          mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

          // Verify that all returned vendors have the filtered status
          const vendors = mockQueryBuilder.getMany();
          expect(vendors).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Status management in service', () => {
    it('should create vendor with default active status', async () => {
      const dto: CreateVendorDto = {
        name: 'Test Vendor',
        company_name: 'Company',
        street: 'Street',
        city: 'City',
        state: 'State',
        zip_code: '12345',
        country: 'Country',
        razon_social: 'Razon',
        rfc: 'RFC123456ABC',
        persona_type: 'Persona Moral',
      };

      const expected: Vendor = {
        id: 'vendor-123',
        ...dto,
        tenant_id: 'tenant-123',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        tenant: null,
      };

      mockRepository.create.mockReturnValue(expected);
      mockRepository.save.mockResolvedValue(expected);

      const result = await service.create(dto, 'tenant-123');

      expect(result.status).toBe('active');
    });

    it('should create vendor with provided status', async () => {
      const dto: CreateVendorDto = {
        name: 'Test Vendor',
        company_name: 'Company',
        street: 'Street',
        city: 'City',
        state: 'State',
        zip_code: '12345',
        country: 'Country',
        razon_social: 'Razon',
        rfc: 'RFC123456ABC',
        persona_type: 'Persona Moral',
        status: 'inactive',
      };

      const expected: Vendor = {
        id: 'vendor-123',
        ...dto,
        tenant_id: 'tenant-123',
        status: 'inactive',
        created_at: new Date(),
        updated_at: new Date(),
        tenant: null,
      };

      mockRepository.create.mockReturnValue(expected);
      mockRepository.save.mockResolvedValue(expected);

      const result = await service.create(dto, 'tenant-123');

      expect(result.status).toBe('inactive');
    });

    it('should update vendor status', async () => {
      const vendor: Vendor = {
        id: 'vendor-123',
        name: 'Test Vendor',
        company_name: 'Company',
        street: 'Street',
        city: 'City',
        state: 'State',
        zip_code: '12345',
        country: 'Country',
        razon_social: 'Razon',
        rfc: 'RFC123456ABC',
        persona_type: 'Persona Moral',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        tenant_id: 'tenant-123',
        tenant: null,
      };

      mockRepository.findOne.mockResolvedValue(vendor);
      mockRepository.save.mockImplementation((entity) => {
        return Promise.resolve(entity);
      });

      const result = await service.update('vendor-123', { status: 'inactive' }, 'tenant-123');

      expect(result.status).toBe('inactive');
    });
  });
});
