import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';
import { BadRequestException } from '@nestjs/common';
import { UnitConversionService } from './unit-conversion.service';
import { ProductUoM } from '../../../entities/products';

describe('UnitConversionService', () => {
  let service: UnitConversionService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitConversionService,
        {
          provide: getRepositoryToken(ProductUoM),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UnitConversionService>(UnitConversionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Unit Tests', () => {
    describe('getBaseUom', () => {
      it('should retrieve the base UOM for a product', async () => {
        const productId = '550e8400-e29b-41d4-a716-446655440001';
        const baseUomCatalogId = '550e8400-e29b-41d4-a716-446655440010';

        mockRepository.findOne.mockResolvedValue({
          id: '550e8400-e29b-41d4-a716-446655440011',
          product_id: productId,
          uom_catalog_id: baseUomCatalogId,
          is_base: true,
          factor: 1,
        });

        const result = await service.getBaseUom(productId);

        expect(result).toBe(baseUomCatalogId);
        expect(mockRepository.findOne).toHaveBeenCalledWith({
          where: {
            product_id: productId,
            is_base: true,
          },
        });
      });

      it('should throw BadRequestException when base UOM not found', async () => {
        const productId = '550e8400-e29b-41d4-a716-446655440001';

        mockRepository.findOne.mockResolvedValue(null);

        await expect(service.getBaseUom(productId)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.getBaseUom(productId)).rejects.toThrow(
          'Unidad de medida base no encontrada para el producto',
        );
      });
    });

    describe('getConversionFactor', () => {
      it('should retrieve conversion factor for a product UOM', async () => {
        const productUomId = '550e8400-e29b-41d4-a716-446655440011';
        const factor = 1000;

        mockRepository.findOne.mockResolvedValue({
          id: productUomId,
          factor: factor,
        });

        const result = await service.getConversionFactor(productUomId);

        expect(result).toBe(factor);
        expect(mockRepository.findOne).toHaveBeenCalledWith({
          where: { id: productUomId },
        });
      });

      it('should return 1 as default factor when factor is null', async () => {
        const productUomId = '550e8400-e29b-41d4-a716-446655440011';

        mockRepository.findOne.mockResolvedValue({
          id: productUomId,
          factor: null,
        });

        const result = await service.getConversionFactor(productUomId);

        expect(result).toBe(1);
      });

      it('should throw BadRequestException when product UOM not found', async () => {
        const productUomId = '550e8400-e29b-41d4-a716-446655440011';

        mockRepository.findOne.mockResolvedValue(null);

        await expect(service.getConversionFactor(productUomId)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.getConversionFactor(productUomId)).rejects.toThrow(
          'Unidad de medida no encontrada',
        );
      });
    });

    describe('convertToBaseUnit', () => {
      it('should convert quantity from received UOM to base unit', async () => {
        const productId = '550e8400-e29b-41d4-a716-446655440001';
        const fromUomId = '550e8400-e29b-41d4-a716-446655440011';
        const quantity = 100;
        const factor = 1000;

        mockRepository.findOne.mockResolvedValue({
          id: fromUomId,
          product_id: productId,
          factor: factor,
          is_base: false,
        });

        const result = await service.convertToBaseUnit(
          quantity,
          fromUomId,
          productId,
        );

        expect(result).toBe(quantity * factor);
        expect(mockRepository.findOne).toHaveBeenCalledWith({
          where: {
            id: fromUomId,
            product_id: productId,
          },
        });
      });

      it('should return quantity as-is when UOM is already base unit', async () => {
        const productId = '550e8400-e29b-41d4-a716-446655440001';
        const fromUomId = '550e8400-e29b-41d4-a716-446655440011';
        const quantity = 100;

        mockRepository.findOne.mockResolvedValue({
          id: fromUomId,
          product_id: productId,
          factor: 1,
          is_base: true,
        });

        const result = await service.convertToBaseUnit(
          quantity,
          fromUomId,
          productId,
        );

        expect(result).toBe(quantity);
      });

      it('should throw BadRequestException when UOM does not belong to product', async () => {
        const productId = '550e8400-e29b-41d4-a716-446655440001';
        const fromUomId = '550e8400-e29b-41d4-a716-446655440011';
        const quantity = 100;

        mockRepository.findOne.mockResolvedValue(null);

        await expect(
          service.convertToBaseUnit(quantity, fromUomId, productId),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.convertToBaseUnit(quantity, fromUomId, productId),
        ).rejects.toThrow('Unidad de medida no soportada para este producto');
      });

      it('should handle decimal quantities correctly', async () => {
        const productId = '550e8400-e29b-41d4-a716-446655440001';
        const fromUomId = '550e8400-e29b-41d4-a716-446655440011';
        const quantity = 10.5;
        const factor = 100;

        mockRepository.findOne.mockResolvedValue({
          id: fromUomId,
          product_id: productId,
          factor: factor,
          is_base: false,
        });

        const result = await service.convertToBaseUnit(
          quantity,
          fromUomId,
          productId,
        );

        expect(result).toBe(1050);
      });

      it('should handle zero quantity', async () => {
        const productId = '550e8400-e29b-41d4-a716-446655440001';
        const fromUomId = '550e8400-e29b-41d4-a716-446655440011';
        const quantity = 0;
        const factor = 1000;

        mockRepository.findOne.mockResolvedValue({
          id: fromUomId,
          product_id: productId,
          factor: factor,
          is_base: false,
        });

        const result = await service.convertToBaseUnit(
          quantity,
          fromUomId,
          productId,
        );

        expect(result).toBe(0);
      });
    });
  });

  describe('Property-Based Tests', () => {
    describe('Property 9: Quantity Conversion to Base Unit', () => {
      it('should convert any valid quantity correctly', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              quantity: fc.float({ min: 0, max: 100000 }),
              factor: fc.integer({ min: 1, max: 10000 }),
            }),
            async (scenario) => {
              // Skip NaN values
              if (isNaN(scenario.quantity)) {
                return;
              }

              const productId = '550e8400-e29b-41d4-a716-446655440001';
              const fromUomId = '550e8400-e29b-41d4-a716-446655440011';

              mockRepository.findOne.mockResolvedValue({
                id: fromUomId,
                product_id: productId,
                factor: scenario.factor,
                is_base: false,
              });

              const result = await service.convertToBaseUnit(
                scenario.quantity,
                fromUomId,
                productId,
              );

              expect(result).toBeCloseTo(
                scenario.quantity * scenario.factor,
                5,
              );
            },
          ),
          { numRuns: 100 },
        );
      });

      it('should always return non-negative quantity for non-negative input', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              quantity: fc.float({ min: 0, max: 100000 }),
              factor: fc.integer({ min: 1, max: 10000 }),
            }),
            async (scenario) => {
              // Skip NaN values
              if (isNaN(scenario.quantity)) {
                return;
              }

              const productId = '550e8400-e29b-41d4-a716-446655440001';
              const fromUomId = '550e8400-e29b-41d4-a716-446655440011';

              mockRepository.findOne.mockResolvedValue({
                id: fromUomId,
                product_id: productId,
                factor: scenario.factor,
                is_base: false,
              });

              const result = await service.convertToBaseUnit(
                scenario.quantity,
                fromUomId,
                productId,
              );

              expect(result).toBeGreaterThanOrEqual(0);
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('Property 25: Unit Conversion Error Handling', () => {
      it('should reject unsupported unit conversions', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              productId: fc.uuid(),
              fromUomId: fc.uuid(),
              quantity: fc.float({ min: 0, max: 100000 }),
            }),
            async (scenario) => {
              mockRepository.findOne.mockResolvedValue(null);

              await expect(
                service.convertToBaseUnit(
                  scenario.quantity,
                  scenario.fromUomId,
                  scenario.productId,
                ),
              ).rejects.toThrow(BadRequestException);
            },
          ),
          { numRuns: 100 },
        );
      });

      it('should provide descriptive error messages for unsupported conversions', async () => {
        const productId = '550e8400-e29b-41d4-a716-446655440001';
        const fromUomId = '550e8400-e29b-41d4-a716-446655440011';

        mockRepository.findOne.mockResolvedValue(null);

        try {
          await service.convertToBaseUnit(100, fromUomId, productId);
          fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.message).toContain('Unidad de medida no soportada');
        }
      });
    });
  });
});
