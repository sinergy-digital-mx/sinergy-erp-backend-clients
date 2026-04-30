// Unit tests for PosConfiguration entity validation
// Tests entity creation with valid and invalid data
// Tests relationship constraints and field validation
// Requirements: 1.1, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4

import { validate } from 'class-validator';
import { PosConfiguration } from '../pos-configuration.entity';
import { BillingBranch } from '../billing-branch.entity';

describe('PosConfiguration Entity - Unit Tests', () => {
  
  describe('Entity Creation and Validation', () => {
    it('should create a valid PosConfiguration with all required fields', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 'POS-001';
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      config.modelo = 'HP EliteDesk 800';
      config.status = 1;

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
      expect(config.code).toBe('POS-001');
      expect(config.sucursal).toBe('123e4567-e89b-12d3-a456-426614174002');
      expect(config.modelo).toBe('HP EliteDesk 800');
      expect(config.status).toBe(1);
    });

    it('should create a valid PosConfiguration without optional modelo field', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 'POS-002';
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      config.status = 1;

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
      expect(config.modelo).toBeUndefined();
    });

    it('should require status to be explicitly set for validation', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 'POS-003';
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      // status not set - should fail validation
      
      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'status')).toBe(true);
      // Note: Default values are applied by the database, not the entity constructor
    });
  });

  describe('Code Field Validation', () => {
    it('should fail validation with empty code', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = '';
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      config.status = 1;

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'code')).toBe(true);
    });

    it('should fail validation with non-string code', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 123 as any; // Invalid type
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      config.status = 1;

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'code')).toBe(true);
    });
  });

  describe('Sucursal (Branch) Field Validation', () => {
    it('should fail validation with empty sucursal', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 'POS-004';
      config.type = 'VENTAS';
      config.sucursal = '';
      config.status = 1;

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'sucursal')).toBe(true);
    });

    it('should fail validation with invalid UUID format for sucursal', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 'POS-005';
      config.type = 'VENTAS';
      config.sucursal = 'not-a-valid-uuid';
      config.status = 1;

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'sucursal')).toBe(true);
    });

    it('should accept valid UUID format for sucursal', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 'POS-006';
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      config.status = 1;

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Modelo Field Validation', () => {
    it('should accept valid string for modelo', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 'POS-007';
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      config.modelo = 'Dell OptiPlex 7090';
      config.status = 1;

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with non-string modelo', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 'POS-008';
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      config.modelo = 12345 as any; // Invalid type
      config.status = 1;

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'modelo')).toBe(true);
    });

    it('should accept undefined modelo (optional field)', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 'POS-009';
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      config.status = 1;
      // modelo is not set

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Status Field Validation', () => {
    it('should accept status value of 1 (active)', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 'POS-010';
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      config.status = 1;

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should accept status value of 0 (inactive)', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 'POS-011';
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      config.status = 0;

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid status value', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 'POS-012';
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      config.status = 2; // Invalid value

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'status')).toBe(true);
    });

    it('should fail validation with negative status value', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 'POS-013';
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      config.status = -1; // Invalid value

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'status')).toBe(true);
    });
  });

  describe('Tenant ID Field Validation', () => {
    it('should fail validation with empty tenant_id', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '';
      config.code = 'POS-014';
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      config.status = 1;

      const errors = await validate(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'tenant_id')).toBe(true);
    });

    it('should accept valid tenant_id', async () => {
      const config = new PosConfiguration();
      config.id = '123e4567-e89b-12d3-a456-426614174000';
      config.tenant_id = '123e4567-e89b-12d3-a456-426614174001';
      config.code = 'POS-015';
      config.type = 'VENTAS';
      config.sucursal = '123e4567-e89b-12d3-a456-426614174002';
      config.status = 1;

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Entity Relationships', () => {
    it('should have ManyToOne relationship with BillingBranch', () => {
      const config = new PosConfiguration();
      const branch = new BillingBranch();
      
      config.branch = branch;
      
      expect(config.branch).toBe(branch);
      expect(config.branch).toBeInstanceOf(BillingBranch);
    });

    it('should allow setting branch relationship', () => {
      const config = new PosConfiguration();
      const branch = new BillingBranch();
      branch.id = '123e4567-e89b-12d3-a456-426614174002';
      branch.code = 'BRANCH-001';
      
      config.branch = branch;
      config.sucursal = branch.id;
      
      expect(config.branch.id).toBe(config.sucursal);
      expect(config.branch.code).toBe('BRANCH-001');
    });
  });

  describe('Timestamp Fields', () => {
    it('should have created_at and updated_at fields', () => {
      const config = new PosConfiguration();
      
      expect(config).toHaveProperty('created_at');
      expect(config).toHaveProperty('updated_at');
    });

    it('should accept Date objects for timestamp fields', () => {
      const config = new PosConfiguration();
      const now = new Date();
      
      config.created_at = now;
      config.updated_at = now;
      
      expect(config.created_at).toBe(now);
      expect(config.updated_at).toBe(now);
    });
  });

  describe('Entity Structure', () => {
    it('should have all required properties defined', () => {
      const config = new PosConfiguration();
      
      expect(config).toHaveProperty('id');
      expect(config).toHaveProperty('tenant_id');
      expect(config).toHaveProperty('code');
      expect(config).toHaveProperty('type');
      expect(config).toHaveProperty('sucursal');
      expect(config).toHaveProperty('modelo');
      expect(config).toHaveProperty('status');
      expect(config).toHaveProperty('branch');
      expect(config).toHaveProperty('created_at');
      expect(config).toHaveProperty('updated_at');
    });
  });
});
