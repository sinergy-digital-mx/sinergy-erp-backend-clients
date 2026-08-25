import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product, ProductUoM, ProductVendorCost } from '../../../entities/products';
import { VendorProductsService } from './vendor-products.service';

describe('VendorProductsService', () => {
  let service: VendorProductsService;
  let productQb: Record<string, jest.Mock>;
  let uomQb: Record<string, jest.Mock>;
  let costQb: Record<string, jest.Mock>;

  const tenantId = 'tenant-1';
  const vendorId = 'vendor-1';

  const encino = {
    id: 'prod-encino',
    name: 'ENCINO 1X6',
    sku: 'ENC16',
    tenant_id: tenantId,
    is_active: true,
  };

  const titebond = {
    id: 'prod-titebond',
    name: '1/2 LITRO TITEBOND II',
    sku: '12LPAT2',
    tenant_id: tenantId,
    is_active: true,
  };

  const encinoUom = {
    id: 'puom-encino',
    product_id: encino.id,
    uom_catalog_id: 'uom-pieza',
    factor: 1,
    is_base: true,
    uom: { name: 'Pieza' },
  };

  const titebondUom = {
    id: 'puom-1',
    product_id: titebond.id,
    uom_catalog_id: 'uom-pieza',
    factor: 1,
    is_base: true,
    uom: { name: 'Pieza' },
  };

  const titebondCost = {
    product_id: titebond.id,
    product: titebond,
    product_uom_id: titebondUom.id,
    product_uom: titebondUom,
    cost: 30,
    iva_percentage: 0,
    ieps_percentage: 0,
    currency: 'USD',
  };

  const chain = () => {
    const qb: Record<string, jest.Mock> = {};
    ['innerJoinAndSelect', 'leftJoinAndSelect', 'where', 'andWhere', 'orderBy', 'addOrderBy'].forEach(
      (method) => {
        qb[method] = jest.fn().mockReturnValue(qb);
      },
    );
    qb.getMany = jest.fn().mockResolvedValue([]);
    return qb;
  };

  beforeEach(async () => {
    productQb = chain();
    uomQb = chain();
    costQb = chain();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: { createQueryBuilder: jest.fn(() => productQb) },
        },
        {
          provide: getRepositoryToken(ProductUoM),
          useValue: { createQueryBuilder: jest.fn(() => uomQb) },
        },
        {
          provide: getRepositoryToken(ProductVendorCost),
          useValue: { createQueryBuilder: jest.fn(() => costQb) },
        },
      ],
    }).compile();

    service = module.get(VendorProductsService);
  });

  it('incluye UOMs del producto aunque no tenga costo de proveedor', async () => {
    productQb.getMany.mockResolvedValue([encino, titebond]);
    uomQb.getMany.mockResolvedValue([encinoUom, titebondUom]);
    costQb.getMany.mockResolvedValue([titebondCost]);

    const result = await service.getVendorProducts(vendorId, tenantId);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      product_id: 'prod-encino',
      has_vendor_cost: false,
    });
    expect(result[0].uoms).toEqual([
      expect.objectContaining({
        product_uom_id: 'puom-encino',
        uom_id: 'uom-pieza',
        uom_name: 'Pieza',
        cost: 0,
        currency: null,
      }),
    ]);
    expect(result[1]).toMatchObject({
      product_id: 'prod-titebond',
      has_vendor_cost: true,
    });
    expect(result[1].uoms[0]).toMatchObject({
      uom_id: 'uom-pieza',
      uom_name: 'Pieza',
      cost: 30,
      currency: 'USD',
    });
  });

  it('only_with_cost=true omite productos sin costo', async () => {
    costQb.getMany.mockResolvedValue([titebondCost]);

    const result = await service.getVendorProducts(vendorId, tenantId, {
      only_with_cost: true,
    });

    expect(result).toHaveLength(1);
    expect(result[0].product_id).toBe('prod-titebond');
    expect(result[0].has_vendor_cost).toBe(true);
    expect(productQb.getMany).not.toHaveBeenCalled();
  });

  it('include_without_cost=false equivale al catálogo solo con costo', async () => {
    costQb.getMany.mockResolvedValue([titebondCost]);

    const result = await service.getVendorProducts(vendorId, tenantId, {
      include_without_cost: false,
    });

    expect(result.map((row) => row.product_id)).toEqual(['prod-titebond']);
  });

  it('filtra por search en nombre o SKU', async () => {
    productQb.getMany.mockResolvedValue([encino]);
    uomQb.getMany.mockResolvedValue([encinoUom]);
    costQb.getMany.mockResolvedValue([]);

    const result = await service.getVendorProducts(vendorId, tenantId, {
      search: 'encino',
    });

    expect(productQb.andWhere).toHaveBeenCalled();
    expect(result).toEqual([
      expect.objectContaining({
        product_id: 'prod-encino',
        has_vendor_cost: false,
        uoms: [expect.objectContaining({ uom_name: 'Pieza' })],
      }),
    ]);
  });
});
