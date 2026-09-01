import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductVendorCost } from '../../../../entities/products/product-vendor-cost.entity';
import { ProductPrice } from '../../../../entities/products/product-price.entity';
import { PriceList } from '../../../../entities/products/price-list.entity';
import { Vendor } from '../../../../entities/vendor/vendor.entity';
import { ProductVendorImportService } from '../product-vendor-import.service';
import { buildVendorImportTemplate } from '../../utils/product-vendor-import-excel.util';

describe('ProductVendorImportService', () => {
  let service: ProductVendorImportService;
  let vendorCostRepo: {
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
  };
  let productPriceRepo: {
    find: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let priceListRepo: { findOne: jest.Mock };
  let vendorRepo: { findOne: jest.Mock };

  const orgId = 'org-1';
  const vendorId = 'vendor-1';
  const priceListId = 'list-1';

  const vendor = { id: vendorId, name: 'Maderas Norte', tenant_id: orgId };
  const priceList = { id: priceListId, name: 'Mostrador', tenant_id: orgId };

  const encinoCost = {
    id: 'cost-1',
    product_id: 'prod-1',
    vendor_id: vendorId,
    product_uom_id: 'uom-1',
    cost: 10,
    currency: 'MXN',
    iva_percentage: 16,
    ieps_percentage: 0,
    product: { id: 'prod-1', sku: 'ENC16', name: 'ENCINO', is_active: true, tenant_id: orgId },
    product_uom: { id: 'uom-1', is_base: true, uom: { name: 'Pieza' } },
  };

  function mockCostQuery(costs: unknown[]) {
    const qb = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(costs),
    };
    vendorCostRepo.createQueryBuilder.mockReturnValue(qb);
    return qb;
  }

  function excelFile(buffer: Buffer, name = 'template.xlsx'): Express.Multer.File {
    return {
      buffer,
      originalname: name,
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fieldname: 'file',
      size: buffer.length,
    } as Express.Multer.File;
  }

  beforeEach(async () => {
    vendorCostRepo = {
      createQueryBuilder: jest.fn(),
      save: jest.fn(async (entity) => entity),
    };
    productPriceRepo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (entity) => ({ id: entity.id ?? 'price-new', ...entity })),
      create: jest.fn((entity) => entity),
    };
    priceListRepo = { findOne: jest.fn() };
    vendorRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductVendorImportService,
        { provide: getRepositoryToken(ProductVendorCost), useValue: vendorCostRepo },
        { provide: getRepositoryToken(ProductPrice), useValue: productPriceRepo },
        { provide: getRepositoryToken(PriceList), useValue: priceListRepo },
        { provide: getRepositoryToken(Vendor), useValue: vendorRepo },
      ],
    }).compile();

    service = module.get(ProductVendorImportService);
  });

  it('previewCosts cuenta productos y renglones', async () => {
    vendorRepo.findOne.mockResolvedValue(vendor);
    mockCostQuery([encinoCost, { ...encinoCost, id: 'cost-2', product_uom_id: 'uom-2' }]);

    const preview = await service.previewCosts(orgId, vendorId);
    expect(preview).toEqual({
      vendor_id: vendorId,
      vendor_name: 'Maderas Norte',
      product_count: 1,
      row_count: 2,
    });
  });

  it('previewCosts 404 si el proveedor no es de la organización', async () => {
    vendorRepo.findOne.mockResolvedValue(null);
    await expect(service.previewCosts(orgId, vendorId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('importCosts actualiza solo filas con nuevo costo', async () => {
    vendorRepo.findOne.mockResolvedValue(vendor);
    mockCostQuery([encinoCost]);

    const buffer = await buildVendorImportTemplate({
      kind: 'cost',
      title: 'Costos',
      subtitle: '',
      contextLines: [],
      rows: [
        {
          sku: 'ENC16',
          name: 'ENCINO',
          uom: 'Pieza',
          currency: 'MXN',
          current_value: 10,
          new_value: 12.5,
          _id: 'cost-1',
          _product_id: 'prod-1',
          _product_uom_id: 'uom-1',
        },
        {
          sku: 'ENC16',
          name: 'ENCINO',
          uom: 'Pieza',
          currency: 'MXN',
          current_value: 10,
          new_value: null,
          _id: 'cost-1',
          _product_id: 'prod-1',
          _product_uom_id: 'uom-1',
        },
      ],
    });

    const result = await service.importCosts(orgId, vendorId, excelFile(buffer));
    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.errors).toEqual([]);
    expect(vendorCostRepo.save).toHaveBeenCalledTimes(1);
    expect(vendorCostRepo.save.mock.calls[0][0].cost).toBe(12.5);
    expect(vendorCostRepo.save.mock.calls[0][0].iva_unit_total).toBe(2);
  });

  it('importCosts no toca SKUs de otro proveedor', async () => {
    vendorRepo.findOne.mockResolvedValue(vendor);
    mockCostQuery([encinoCost]);

    const buffer = await buildVendorImportTemplate({
      kind: 'cost',
      title: 'Costos',
      subtitle: '',
      contextLines: [],
      rows: [
        {
          sku: 'AJENO',
          name: 'Otro',
          uom: 'Pieza',
          current_value: 1,
          new_value: 9,
          _id: '',
          _product_id: '',
          _product_uom_id: '',
        },
      ],
    });

    const result = await service.importCosts(orgId, vendorId, excelFile(buffer));
    expect(result.updated).toBe(0);
    expect(result.errors[0].message).toMatch(/no pertenece/);
    expect(vendorCostRepo.save).not.toHaveBeenCalled();
  });

  it('importPrices crea precio si el producto del proveedor no lo tenía', async () => {
    vendorRepo.findOne.mockResolvedValue(vendor);
    priceListRepo.findOne.mockResolvedValue(priceList);
    mockCostQuery([encinoCost]);
    productPriceRepo.find.mockResolvedValue([]);

    const buffer = await buildVendorImportTemplate({
      kind: 'price',
      title: 'Precios',
      subtitle: '',
      contextLines: [],
      rows: [
        {
          sku: 'ENC16',
          name: 'ENCINO',
          uom: 'Pieza',
          price_list: 'Mostrador',
          current_value: null,
          new_value: 99,
          _id: '',
          _product_id: 'prod-1',
          _product_uom_id: 'uom-1',
          _price_list_id: priceListId,
        },
      ],
    });

    const result = await service.importPrices(orgId, vendorId, priceListId, excelFile(buffer));
    expect(result.created).toBe(1);
    expect(result.updated).toBe(0);
    expect(productPriceRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: 'prod-1',
        price_list_id: priceListId,
        product_uom_id: 'uom-1',
        price: 99,
        iva_percentage: 16,
      }),
    );
  });

  it('rechaza archivo que no es xlsx', async () => {
    vendorRepo.findOne.mockResolvedValue(vendor);
    await expect(
      service.importCosts(orgId, vendorId, excelFile(Buffer.from('nope'), 'costos.csv')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
