import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductRepository } from '../repositories/product.repository';
import { Product } from '../../../entities/products/product.entity';

describe('ProductService', () => {
  let service: ProductService;
  let repository: ProductRepository;

  const mockProduct: Product = {
    id: '1',
    tenant_id: 'tenant-1',
    sku: 'SKU001',
    name: 'Test Product',
    description: 'Test Description',
    uoms: [],
    uom_relationships: [],
    vendor_prices: [],
    created_at: new Date(),
    updated_at: new Date(),
    tenant: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: ProductRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findBySku: jest.fn(),
            findByTenant: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get<ProductRepository>(ProductRepository);
  });

  describe('createProduct', () => {
    it('should create a product with valid data', async () => {
      jest.spyOn(repository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockResolvedValue(mockProduct);

      const result = await service.createProduct('tenant-1', 'SKU001', 'Test Product', 'Test Description');

      expect(result).toEqual(mockProduct);
      expect(repository.create).toHaveBeenCalledWith({
        tenant_id: 'tenant-1',
        sku: 'SKU001',
        name: 'Test Product',
        description: 'Test Description',
      });
    });

    it('should throw BadRequestException if SKU is empty', async () => {
      await expect(service.createProduct('tenant-1', '', 'Test Product')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if name is empty', async () => {
      await expect(service.createProduct('tenant-1', 'SKU001', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if SKU already exists', async () => {
      jest.spyOn(repository, 'findBySku').mockResolvedValue(mockProduct);

      await expect(service.createProduct('tenant-1', 'SKU001', 'Test Product')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getProduct', () => {
    it('should return a product by id', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockProduct);

      const result = await service.getProduct('1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.getProduct('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProductBySku', () => {
    it('should return a product by SKU', async () => {
      jest.spyOn(repository, 'findBySku').mockResolvedValue(mockProduct);

      const result = await service.getProductBySku('SKU001', 'tenant-1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(repository, 'findBySku').mockResolvedValue(null);

      await expect(service.getProductBySku('SKU001', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockProduct);
      jest.spyOn(repository, 'findBySku').mockResolvedValue(null);
      jest.spyOn(repository, 'update').mockResolvedValue({ ...mockProduct, name: 'Updated' });

      const result = await service.updateProduct('1', { name: 'Updated' }, 'tenant-1');

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.updateProduct('1', { name: 'Updated' }, 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockProduct);
      jest.spyOn(repository, 'delete').mockResolvedValue(undefined);

      await service.deleteProduct('1');

      expect(repository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.deleteProduct('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listProducts', () => {
    it('should return all products for a tenant', async () => {
      jest.spyOn(repository, 'findByTenant').mockResolvedValue([mockProduct]);

      const result = await service.listProducts('tenant-1');

      expect(result).toEqual([mockProduct]);
    });
  });
});
