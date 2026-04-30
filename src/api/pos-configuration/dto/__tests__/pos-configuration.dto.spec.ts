import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePosConfigurationDto } from '../create-pos-configuration.dto';
import { UpdatePosConfigurationDto } from '../update-pos-configuration.dto';
import { QueryPosConfigurationDto } from '../query-pos-configuration.dto';

describe('POS Configuration DTOs', () => {
  describe('CreatePosConfigurationDto', () => {
    it('should validate a valid DTO', async () => {
      const dto = plainToInstance(CreatePosConfigurationDto, {
        code: 'Computadora 1',
        type: 'VENTAS',
        sucursal: '550e8400-e29b-41d4-a716-446655440000',
        modelo: 'Dell OptiPlex 7090',
        status: 1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when code is empty', async () => {
      const dto = plainToInstance(CreatePosConfigurationDto, {
        code: '',
        type: 'VENTAS',
        sucursal: '550e8400-e29b-41d4-a716-446655440000',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('code');
    });

    it('should fail validation when sucursal is not a UUID', async () => {
      const dto = plainToInstance(CreatePosConfigurationDto, {
        code: 'Computadora 1',
        type: 'VENTAS',
        sucursal: 'invalid-uuid',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('sucursal');
    });

    it('should fail validation when status is not 0 or 1', async () => {
      const dto = plainToInstance(CreatePosConfigurationDto, {
        code: 'Computadora 1',
        type: 'VENTAS',
        sucursal: '550e8400-e29b-41d4-a716-446655440000',
        status: 2,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
    });

    it('should fail validation when type is not valid', async () => {
      const dto = plainToInstance(CreatePosConfigurationDto, {
        code: 'Computadora 1',
        type: 'CAJA',
        sucursal: '550e8400-e29b-41d4-a716-446655440000',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('type');
    });

    it('should allow optional fields to be omitted', async () => {
      const dto = plainToInstance(CreatePosConfigurationDto, {
        code: 'Computadora 1',
        type: 'COBRANZA',
        sucursal: '550e8400-e29b-41d4-a716-446655440000',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('UpdatePosConfigurationDto', () => {
    it('should validate a valid partial update', async () => {
      const dto = plainToInstance(UpdatePosConfigurationDto, {
        code: 'Updated Computer',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should allow all fields to be optional', async () => {
      const dto = plainToInstance(UpdatePosConfigurationDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('QueryPosConfigurationDto', () => {
    it('should validate valid query parameters', async () => {
      const dto = plainToInstance(QueryPosConfigurationDto, {
        page: '1',
        limit: '20',
        search: 'Computadora',
        status: '1',
        sucursal: '550e8400-e29b-41d4-a716-446655440000',
        type: 'VENTAS',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.status).toBe(1);
    });

    it('should fail validation when page is less than 1', async () => {
      const dto = plainToInstance(QueryPosConfigurationDto, {
        page: '0',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when limit exceeds 100', async () => {
      const dto = plainToInstance(QueryPosConfigurationDto, {
        limit: '101',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when status is not 0 or 1', async () => {
      const dto = plainToInstance(QueryPosConfigurationDto, {
        status: '2',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when type is invalid', async () => {
      const dto = plainToInstance(QueryPosConfigurationDto, {
        type: 'OTRO',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should allow all query parameters to be optional', async () => {
      const dto = plainToInstance(QueryPosConfigurationDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
