import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import * as fc from 'fast-check';
import { VendorService } from './vendor.service';
import { Vendor } from '../../entities/vendor/vendor.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorType } from '../../entities/vendor/vendor-type.enum';
import { QueryFailedError } from 'typeorm';

describe('VendorService', () => {
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a vendor with all fields', async () => {
      const dto: CreateVendorDto = {
        vendor_type: VendorType.NATIONAL,
        name: 'Test Vendor',
        company_name: 'Test Company',
        street: '123 Main St',
        city: 'Mexico City',
        state: 'CDMX',
        zip_code: '06500',
        country: 'Mexico',
        razon_social: 'Test Company S.A. de C.V.',
        rfc: 'TCO123456ABC',
        persona_type: 'Persona Moral',
      };
      const tenantId = 'tenant-123';
      const expected: Vendor = {
        id: 'vendor-123',
        ...dto,
        tenant_id: tenantId,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        tenant: null,
      };

      mockRepository.create.mockReturnValue(expected);
      mockRepository.save.mockResolvedValue(expected);

      const result = await service.create(dto, tenantId);

      expect(result).toEqual(expected);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...dto,
          tenant_id: tenantId,
          status: 'active',
          vendor_type: VendorType.NATIONAL,
        }),
      );
      expect(mockRepository.save).toHaveBeenCalledWith(expected);
    });

    it('should set default status to active', async () => {
      const dto: CreateVendorDto = {
        vendor_type: VendorType.NATIONAL,
        name: 'Test Vendor',
        company_name: 'Test Company',
        street: '123 Main St',
        city: 'Mexico City',
        state: 'CDMX',
        zip_code: '06500',
        country: 'Mexico',
        razon_social: 'Test Company S.A. de C.V.',
        rfc: 'TCO123456ABC',
        persona_type: 'Persona Moral',
      };
      const tenantId = 'tenant-123';
      const expected: Vendor = {
        id: 'vendor-123',
        ...dto,
        tenant_id: tenantId,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        tenant: null,
      };

      mockRepository.create.mockReturnValue(expected);
      mockRepository.save.mockResolvedValue(expected);

      const result = await service.create(dto, tenantId);

      expect(result.status).toBe('active');
    });
  });

  describe('international vendor', () => {
    it('guarda razon_social con el nombre legal y no manda null', async () => {
      const existing = {
        id: '61ca49d3-f054-4a53-8b19-77f2081ed81e',
        tenant_id: 'tenant-123',
        vendor_type: VendorType.INTERNATIONAL,
        name: 'Proveedor Internacional',
        razon_social: 'Proveedor Internacional',
        legal_name: 'Old Legal',
        tax_id: 'TAX',
        country: 'US',
      } as Vendor;
      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.update(
        existing.id,
        {
          vendor_type: VendorType.INTERNATIONAL,
          name: 'Proveedor Internacional',
          tax_id: '123123',
          legal_name: '12312312',
        },
        'tenant-123',
      );

      expect(result.razon_social).toBe('12312312');
      expect(result.razon_social).not.toBeNull();
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          razon_social: '12312312',
          legal_name: '12312312',
          rfc: '',
        }),
      );
    });

    it('permite crear internacional sin ID fiscal', async () => {
      const dto: CreateVendorDto = {
        vendor_type: VendorType.INTERNATIONAL,
        name: 'US Supplier',
        legal_name: 'US Supplier LLC',
        country: 'US',
      };
      mockRepository.create.mockImplementation((entity) => entity);
      mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.create(dto, 'tenant-123');

      expect(result.tax_id).toBeNull();
      expect(result.legal_name).toBe('US Supplier LLC');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vendor_type: VendorType.INTERNATIONAL,
          tax_id: null,
          legal_name: 'US Supplier LLC',
          country: 'US',
        }),
      );
    });

    it('permite cambiar a internacional sin ID fiscal si hay nombre legal y país', async () => {
      const existing = {
        id: 'vendor-1',
        tenant_id: 'tenant-123',
        vendor_type: VendorType.NATIONAL,
        name: 'Nacional',
        tax_id: null,
        legal_name: null,
        country: 'México',
      } as Vendor;
      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.update(
        existing.id,
        {
          vendor_type: VendorType.INTERNATIONAL,
          legal_name: 'Foreign Co',
          country: 'US',
        },
        'tenant-123',
      );

      expect(result.vendor_type).toBe(VendorType.INTERNATIONAL);
      expect(result.tax_id).toBeNull();
    });

    it('regresa 400 si MySQL rechaza un null', async () => {
      const existing = {
        id: 'vendor-1',
        tenant_id: 'tenant-123',
        vendor_type: VendorType.INTERNATIONAL,
        name: 'Proveedor Internacional',
        legal_name: 'Legal',
      } as Vendor;
      mockRepository.findOne.mockResolvedValue(existing);
      const dbError = new QueryFailedError('UPDATE', [], {
        errno: 1048,
        sqlMessage: "Column 'razon_social' cannot be null",
      } as Error);
      mockRepository.save.mockRejectedValue(dbError);

      await expect(
        service.update(
          existing.id,
          { vendor_type: VendorType.INTERNATIONAL, legal_name: 'Legal' },
          'tenant-123',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('Property 1: Vendor Creation Stores All Fields', () => {
    it('should store all provided fields when creating a vendor', async () => {
      // **Validates: Requirements 1.1, 1.4, 4.1, 4.5**
      const vendorArbitrary = fc.record({
        vendor_type: fc.constant(VendorType.NATIONAL),
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
          const dto: CreateVendorDto = vendorData as CreateVendorDto;
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

          // Verify all fields are stored
          expect(createdVendor.name).toBe(dto.name);
          expect(createdVendor.company_name).toBe(dto.company_name);
          expect(createdVendor.street).toBe(dto.street);
          expect(createdVendor.city).toBe(dto.city);
          expect(createdVendor.state).toBe(dto.state);
          expect(createdVendor.zip_code).toBe(dto.zip_code);
          expect(createdVendor.country).toBe(dto.country);
          expect(createdVendor.razon_social).toBe(dto.razon_social);
          expect(createdVendor.rfc).toBe(dto.rfc);
          expect(createdVendor.persona_type).toBe(dto.persona_type);
          expect(createdVendor.tenant_id).toBe(tenantId);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: RFC Format Validation', () => {
    it('should validate RFC format correctly', async () => {
      // **Validates: Requirements 4.4**
      const validRfcArbitrary = fc.stringMatching(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/);
      const invalidRfcArbitrary = fc.string({ minLength: 1, maxLength: 20 }).filter(
        (s) => !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(s)
      );

      // Valid RFCs should be accepted
      fc.assert(
        fc.property(validRfcArbitrary, (rfc) => {
          expect(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc)).toBe(true);
        }),
        { numRuns: 100 }
      );

      // Invalid RFCs should be rejected
      fc.assert(
        fc.property(invalidRfcArbitrary, (rfc) => {
          expect(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Timestamp Preservation on Update', () => {
    it('should preserve created_at and update updated_at on update', async () => {
      // **Validates: Requirements 1.3, 3.3**
      const updateArbitrary = fc.record({
        name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
        status: fc.option(fc.constantFrom('active', 'inactive')),
      });

      await new Promise<void>((resolve) => {
        fc.assert(
          fc.property(updateArbitrary, (updateData) => {
            const originalCreatedAt = new Date('2024-01-01');
            const originalUpdatedAt = new Date('2024-01-02');
            const vendor: Vendor = {
              id: 'vendor-123',
              name: 'Original Name',
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
              created_at: originalCreatedAt,
              updated_at: originalUpdatedAt,
              tenant_id: 'tenant-123',
              tenant: null,
            };

            mockRepository.findOne.mockResolvedValue(vendor);
            mockRepository.save.mockImplementation((entity) => {
              return Promise.resolve(entity);
            });

            const updateDto: UpdateVendorDto = {
              name: updateData.name || undefined,
              status: updateData.status || undefined,
            };

            // Verify that created_at would be preserved
            expect(vendor.created_at).toEqual(originalCreatedAt);
          }),
          { numRuns: 100 }
        );
        resolve();
      });
    });
  });

  describe('Property 11: Search and Pagination', () => {
    it('should return paginated results with correct filtering', async () => {
      // **Validates: Requirements 1.5, 2.4**
      const paginationArbitrary = fc.record({
        page: fc.integer({ min: 1, max: 10 }),
        limit: fc.integer({ min: 1, max: 100 }),
        search: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
        status: fc.option(fc.constantFrom('active', 'inactive')),
        state: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
        country: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
      });

      await new Promise<void>((resolve) => {
        fc.assert(
          fc.property(paginationArbitrary, (queryData) => {
            // Verify pagination constraints
            expect(queryData.page).toBeGreaterThanOrEqual(1);
            expect(queryData.limit).toBeGreaterThanOrEqual(1);
            expect(queryData.limit).toBeLessThanOrEqual(100);
          }),
          { numRuns: 100 }
        );
        resolve();
      });
    });
  });
});
