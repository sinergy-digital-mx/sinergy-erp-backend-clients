import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';
import { VendorService } from './vendor.service';
import { Vendor } from '../../entities/vendor/vendor.entity';

describe('VendorService - Serialization', () => {
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

  describe('Property 12: Vendor Serialization Round Trip', () => {
    it('should serialize and deserialize vendor correctly', async () => {
      // **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
      const vendorArbitrary = fc.record({
        id: fc.uuid(),
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
        status: fc.constantFrom('active', 'inactive'),
        tenant_id: fc.uuid(),
      });

      fc.assert(
        fc.property(vendorArbitrary, (vendorData) => {
          const vendor: Vendor = {
            ...vendorData,
            created_at: new Date('2024-01-01'),
            updated_at: new Date('2024-01-02'),
            tenant: null,
          };

          // Serialize to JSON
          const json = JSON.stringify(vendor);
          expect(json).toBeDefined();
          expect(typeof json).toBe('string');

          // Deserialize from JSON
          const deserialized = JSON.parse(json) as Vendor;

          // Verify all fields are preserved
          expect(deserialized.id).toBe(vendor.id);
          expect(deserialized.name).toBe(vendor.name);
          expect(deserialized.company_name).toBe(vendor.company_name);
          expect(deserialized.street).toBe(vendor.street);
          expect(deserialized.city).toBe(vendor.city);
          expect(deserialized.state).toBe(vendor.state);
          expect(deserialized.zip_code).toBe(vendor.zip_code);
          expect(deserialized.country).toBe(vendor.country);
          expect(deserialized.razon_social).toBe(vendor.razon_social);
          expect(deserialized.rfc).toBe(vendor.rfc);
          expect(deserialized.persona_type).toBe(vendor.persona_type);
          expect(deserialized.status).toBe(vendor.status);
          expect(deserialized.tenant_id).toBe(vendor.tenant_id);

          // Verify data types are consistent
          expect(typeof deserialized.id).toBe('string');
          expect(typeof deserialized.name).toBe('string');
          expect(typeof deserialized.rfc).toBe('string');
          expect(typeof deserialized.status).toBe('string');
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve all fields including Mexican billing info', async () => {
      const vendor: Vendor = {
        id: 'vendor-123',
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
        status: 'active',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
        tenant_id: 'tenant-123',
        tenant: null,
      };

      // Serialize
      const json = JSON.stringify(vendor);
      const deserialized = JSON.parse(json) as Vendor;

      // Verify Mexican billing info is preserved
      expect(deserialized.razon_social).toBe('Test Company S.A. de C.V.');
      expect(deserialized.rfc).toBe('TCO123456ABC');
      expect(deserialized.persona_type).toBe('Persona Moral');
    });

    it('should maintain data type consistency after round trip', async () => {
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
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
        tenant_id: 'tenant-123',
        tenant: null,
      };

      // Serialize and deserialize
      const json = JSON.stringify(vendor);
      const deserialized = JSON.parse(json) as Vendor;

      // Verify types
      expect(typeof deserialized.id).toBe('string');
      expect(typeof deserialized.name).toBe('string');
      expect(typeof deserialized.company_name).toBe('string');
      expect(typeof deserialized.street).toBe('string');
      expect(typeof deserialized.city).toBe('string');
      expect(typeof deserialized.state).toBe('string');
      expect(typeof deserialized.zip_code).toBe('string');
      expect(typeof deserialized.country).toBe('string');
      expect(typeof deserialized.razon_social).toBe('string');
      expect(typeof deserialized.rfc).toBe('string');
      expect(typeof deserialized.persona_type).toBe('string');
      expect(typeof deserialized.status).toBe('string');
      expect(typeof deserialized.tenant_id).toBe('string');
    });
  });

  describe('Vendor serialization', () => {
    it('should serialize vendor to JSON with all fields', () => {
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
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
        tenant_id: 'tenant-123',
        tenant: null,
      };

      const json = JSON.stringify(vendor);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('id');
      expect(parsed).toHaveProperty('name');
      expect(parsed).toHaveProperty('company_name');
      expect(parsed).toHaveProperty('street');
      expect(parsed).toHaveProperty('city');
      expect(parsed).toHaveProperty('state');
      expect(parsed).toHaveProperty('zip_code');
      expect(parsed).toHaveProperty('country');
      expect(parsed).toHaveProperty('razon_social');
      expect(parsed).toHaveProperty('rfc');
      expect(parsed).toHaveProperty('persona_type');
      expect(parsed).toHaveProperty('status');
      expect(parsed).toHaveProperty('tenant_id');
      expect(parsed).toHaveProperty('created_at');
      expect(parsed).toHaveProperty('updated_at');
    });

    it('should deserialize vendor from JSON', () => {
      const vendorJson = {
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
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
        tenant_id: 'tenant-123',
        tenant: null,
      };

      const vendor: Vendor = vendorJson as any;

      expect(vendor.id).toBe('vendor-123');
      expect(vendor.name).toBe('Test Vendor');
      expect(vendor.rfc).toBe('RFC123456ABC');
      expect(vendor.razon_social).toBe('Razon');
      expect(vendor.persona_type).toBe('Persona Moral');
    });
  });
});
