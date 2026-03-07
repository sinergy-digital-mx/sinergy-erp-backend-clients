import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VendorProductPriceService } from './vendor-product-price.service';
import { VendorProductPriceRepository } from '../repositories/vendor-product-price.repository';
import { UoMRepository } from '../repositories/uom.repository';
import { VendorProductPrice } from '../../../entities/products/vendor-product-price.entity';
import { UoM } from '../../../entities/products/uom.entity';

describe('VendorProductPriceService', () => {
  let service: VendorProductPriceService;
  let vendorPriceRepository: VendorProductPriceRepository;
  let uomRepository: UoMRepository;

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

  const mockPrice: VendorProductPrice = {
    id: '1',
    vendor_id: 'vendor-1',
    product_id: 'product-1',
    uom_id: '1',
    price: 100,
    created_at: new Date(),
    updated_at: new Date(),
    vendor: null,
    product: null,
    uom: mockUoM,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorProductPriceService,
        {
          provide: VendorProductPriceRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByProduct: jest.fn(),
            findByVendor: jest.fn(),
            findByVendorProductUoM: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: UoMRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VendorProductPriceService>(VendorProductPriceService);
    vendorPriceRepository = module.get<VendorProductPriceRepository>(VendorProductPriceRepository);
    uomRepository = module.get<UoMRepository>(UoMRepository);
  });

  describe('createPrice', () => {
    it('should create a price with valid data', async () => {
      jest.spyOn(uomRepository, 'findById').mockResolvedValue(mockUoM);
      jest.spyOn(vendorPriceRepository, 'create').mockResolvedValue(mockPrice);

      const result = await service.createPrice('vendor-1', 'product-1', '1', 100);

      expect(result).toEqual(mockPrice);
    });

    it('should throw BadRequestException if price is negative', async () => {
      jest.spyOn(uomRepository, 'findById').mockResolvedValue(mockUoM);

      await expect(service.createPrice('vendor-1', 'product-1', '1', -10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if UoM not found', async () => {
      jest.spyOn(uomRepository, 'findById').mockResolvedValue(null);

      await expect(service.createPrice('vendor-1', 'product-1', '1', 100)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if UoM does not belong to product', async () => {
      const wrongUoM = { ...mockUoM, product_id: 'product-2' };
      jest.spyOn(uomRepository, 'findById').mockResolvedValue(wrongUoM);

      await expect(service.createPrice('vendor-1', 'product-1', '1', 100)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPrice', () => {
    it('should return a price by id', async () => {
      jest.spyOn(vendorPriceRepository, 'findById').mockResolvedValue(mockPrice);

      const result = await service.getPrice('1');

      expect(result).toEqual(mockPrice);
    });

    it('should throw NotFoundException if price not found', async () => {
      jest.spyOn(vendorPriceRepository, 'findById').mockResolvedValue(null);

      await expect(service.getPrice('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPricesByProduct', () => {
    it('should return all prices for a product', async () => {
      jest.spyOn(vendorPriceRepository, 'findByProduct').mockResolvedValue([mockPrice]);

      const result = await service.getPricesByProduct('product-1');

      expect(result).toEqual([mockPrice]);
    });
  });

  describe('getPricesByVendor', () => {
    it('should return all prices for a vendor', async () => {
      jest.spyOn(vendorPriceRepository, 'findByVendor').mockResolvedValue([mockPrice]);

      const result = await service.getPricesByVendor('vendor-1');

      expect(result).toEqual([mockPrice]);
    });
  });

  describe('getPriceByVendorProductUoM', () => {
    it('should return a price by vendor, product, and UoM', async () => {
      jest.spyOn(vendorPriceRepository, 'findByVendorProductUoM').mockResolvedValue(mockPrice);

      const result = await service.getPriceByVendorProductUoM('vendor-1', 'product-1', '1');

      expect(result).toEqual(mockPrice);
    });

    it('should throw NotFoundException if price not found', async () => {
      jest.spyOn(vendorPriceRepository, 'findByVendorProductUoM').mockResolvedValue(null);

      await expect(service.getPriceByVendorProductUoM('vendor-1', 'product-1', '1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePrice', () => {
    it('should update a price', async () => {
      jest.spyOn(vendorPriceRepository, 'findById').mockResolvedValue(mockPrice);
      jest.spyOn(vendorPriceRepository, 'update').mockResolvedValue({ ...mockPrice, price: 150 });

      const result = await service.updatePrice('1', 150);

      expect(result.price).toBe(150);
    });

    it('should throw BadRequestException if price is negative', async () => {
      jest.spyOn(vendorPriceRepository, 'findById').mockResolvedValue(mockPrice);

      await expect(service.updatePrice('1', -10)).rejects.toThrow(BadRequestException);
    });
  });

  describe('deletePrice', () => {
    it('should delete a price', async () => {
      jest.spyOn(vendorPriceRepository, 'findById').mockResolvedValue(mockPrice);
      jest.spyOn(vendorPriceRepository, 'delete').mockResolvedValue(undefined);

      await service.deletePrice('1');

      expect(vendorPriceRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if price not found', async () => {
      jest.spyOn(vendorPriceRepository, 'findById').mockResolvedValue(null);

      await expect(service.deletePrice('1')).rejects.toThrow(NotFoundException);
    });
  });
});
