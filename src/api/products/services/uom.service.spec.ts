import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UoMService } from './uom.service';
import { UoMRepository } from '../repositories/uom.repository';
import { UoMRelationshipRepository } from '../repositories/uom-relationship.repository';
import { VendorProductPriceRepository } from '../repositories/vendor-product-price.repository';
import { UoM } from '../../../entities/products/uom.entity';
import { UoMRelationship } from '../../../entities/products/uom-relationship.entity';

describe('UoMService', () => {
  let service: UoMService;
  let uomRepository: UoMRepository;
  let relationshipRepository: UoMRelationshipRepository;
  let vendorPriceRepository: VendorProductPriceRepository;

  const mockUoM: UoM = {
    id: '1',
    product_id: 'product-1',
    code: 'PIECE',
    name: 'Piece',
    source_relationships: [],
    target_relationships: [],
    vendor_prices: [],
    created_at: new Date(),
    updated_at: new Date(),
    product: null,
  };

  const mockUoM2: UoM = {
    id: '2',
    product_id: 'product-1',
    code: 'BOX',
    name: 'Box',
    source_relationships: [],
    target_relationships: [],
    vendor_prices: [],
    created_at: new Date(),
    updated_at: new Date(),
    product: null,
  };

  const mockRelationship: UoMRelationship = {
    id: '1',
    product_id: 'product-1',
    source_uom_id: '2',
    target_uom_id: '1',
    conversion_factor: 10,
    created_at: new Date(),
    updated_at: new Date(),
    product: null,
    source_uom: mockUoM2,
    target_uom: mockUoM,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UoMService,
        {
          provide: UoMRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByProduct: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: UoMRelationshipRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByProduct: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: VendorProductPriceRepository,
          useValue: {
            findByProduct: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UoMService>(UoMService);
    uomRepository = module.get<UoMRepository>(UoMRepository);
    relationshipRepository = module.get<UoMRelationshipRepository>(UoMRelationshipRepository);
    vendorPriceRepository = module.get<VendorProductPriceRepository>(VendorProductPriceRepository);
  });

  describe('createUoM', () => {
    it('should create a UoM with valid data', async () => {
      jest.spyOn(uomRepository, 'findByProduct').mockResolvedValue([]);
      jest.spyOn(uomRepository, 'create').mockResolvedValue(mockUoM);

      const result = await service.createUoM('product-1', 'PIECE', 'Piece');

      expect(result).toEqual(mockUoM);
    });

    it('should throw BadRequestException if code is empty', async () => {
      await expect(service.createUoM('product-1', '', 'Piece')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if name is empty', async () => {
      await expect(service.createUoM('product-1', 'PIECE', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if code already exists', async () => {
      jest.spyOn(uomRepository, 'findByProduct').mockResolvedValue([mockUoM]);

      await expect(service.createUoM('product-1', 'PIECE', 'Piece')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteUoM', () => {
    it('should delete a UoM', async () => {
      jest.spyOn(uomRepository, 'findById').mockResolvedValue(mockUoM);
      jest.spyOn(vendorPriceRepository, 'findByProduct').mockResolvedValue([]);
      jest.spyOn(relationshipRepository, 'findByProduct').mockResolvedValue([]);
      jest.spyOn(uomRepository, 'delete').mockResolvedValue(undefined);

      await service.deleteUoM('1');

      expect(uomRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw ConflictException if UoM is referenced by vendor prices', async () => {
      jest.spyOn(uomRepository, 'findById').mockResolvedValue(mockUoM);
      jest.spyOn(vendorPriceRepository, 'findByProduct').mockResolvedValue([
        { uom_id: '1' } as any,
      ]);

      await expect(service.deleteUoM('1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if UoM is referenced by relationships', async () => {
      jest.spyOn(uomRepository, 'findById').mockResolvedValue(mockUoM);
      jest.spyOn(vendorPriceRepository, 'findByProduct').mockResolvedValue([]);
      jest.spyOn(relationshipRepository, 'findByProduct').mockResolvedValue([
        { source_uom_id: '1' } as any,
      ]);

      await expect(service.deleteUoM('1')).rejects.toThrow(ConflictException);
    });
  });

  describe('createRelationship', () => {
    it('should create a relationship with valid data', async () => {
      jest.spyOn(uomRepository, 'findById').mockResolvedValue(mockUoM);
      jest.spyOn(relationshipRepository, 'create').mockResolvedValue(mockRelationship);

      const result = await service.createRelationship('product-1', '2', '1', 10);

      expect(result).toEqual(mockRelationship);
    });

    it('should throw BadRequestException if conversion factor is <= 0', async () => {
      await expect(service.createRelationship('product-1', '2', '1', 0)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if source and target are the same', async () => {
      await expect(service.createRelationship('product-1', '1', '1', 10)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('convertQuantity', () => {
    it('should return same quantity if from and to UoM are the same', async () => {
      const result = await service.convertQuantity('product-1', 100, '1', '1');

      expect(result).toBe(100);
    });

    it('should convert quantity using relationships', async () => {
      jest.spyOn(relationshipRepository, 'findByProduct').mockResolvedValue([mockRelationship]);

      const result = await service.convertQuantity('product-1', 10, '2', '1');

      expect(result).toBe(100); // 10 boxes * 10 pieces per box
    });

    it('should throw BadRequestException if no conversion path exists', async () => {
      jest.spyOn(relationshipRepository, 'findByProduct').mockResolvedValue([]);

      await expect(service.convertQuantity('product-1', 10, '1', '2')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
