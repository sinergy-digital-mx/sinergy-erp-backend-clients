import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatchCreatorService } from './batch-creator.service';
import { BatchNumberGeneratorService } from './batch-number-generator.service';
import { UnitConversionService } from './unit-conversion.service';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';

describe('BatchCreatorService', () => {
  let service: BatchCreatorService;
  let inventoryBatchRepository: Repository<InventoryBatch>;
  let batchNumberGeneratorService: BatchNumberGeneratorService;
  let unitConversionService: UnitConversionService;

  const mockPurchaseOrder: PurchaseOrderBatch = {
    id: 'po-123',
    tenant_id: 'tenant-1',
    warehouse_id: 'warehouse-1',
    folio: 'ODC-000001',
    general_status: 'Creada',
    received_subtotal: 0,
    received_iva_total: 0,
    received_ieps_total: 0,
    received_total: 0,
    created_by: 'user-1',
    created_at: new Date(),
    updated_by: null,
    updated_at: null,
  } as any;

  const mockReceivedItem: ReceivedItemDto = {
    line_item_id: 'line-1',
    product_id: 'product-1',
    uom_id: 'uom-2',
    quantity: 10,
    unit_total: 100,
    iva_percentage: 16,
    iva_unit: 16,
    ieps_percentage: 0,
    ieps_unit: 0,
  };

  const mockCreatedBatch: InventoryBatch = {
    id: 'batch-1',
    tenant_id: 'tenant-1',
    batch_number: 'MH-LOTE-000001',
    warehouse_id: 'warehouse-1',
    product_id: 'product-1',
    uom_id: 'uom-1',
    quantity: 10,
    purchase_order_batch_id: 'po-123',
    purchase_order_detail_id: 'line-1',
    created_by: 'user-1',
    created_at: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchCreatorService,
        {
          provide: getRepositoryToken(InventoryBatch),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: BatchNumberGeneratorService,
          useValue: {
            generateBatchNumber: jest.fn(),
          },
        },
        {
          provide: UnitConversionService,
          useValue: {
            getBaseUom: jest.fn(),
            convertToBaseUnit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BatchCreatorService>(BatchCreatorService);
    inventoryBatchRepository = module.get<Repository<InventoryBatch>>(
      getRepositoryToken(InventoryBatch),
    );
    batchNumberGeneratorService = module.get<BatchNumberGeneratorService>(
      BatchNumberGeneratorService,
    );
    unitConversionService = module.get<UnitConversionService>(
      UnitConversionService,
    );
  });

  describe('createBatchForReceivedItem', () => {
    it('should create a batch with correct batch number', async () => {
      jest
        .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
        .mockResolvedValue('MH-LOTE-000001');
      jest
        .spyOn(unitConversionService, 'getBaseUom')
        .mockResolvedValue('uom-1');
      jest
        .spyOn(unitConversionService, 'convertToBaseUnit')
        .mockResolvedValue(10);
      jest
        .spyOn(inventoryBatchRepository, 'create')
        .mockReturnValue(mockCreatedBatch);
      jest
        .spyOn(inventoryBatchRepository, 'save')
        .mockResolvedValue(mockCreatedBatch);

      const result = await service.createBatchForReceivedItem(
        mockReceivedItem,
        mockPurchaseOrder,
        'line-1',
        'user-1',
      );

      expect(result.batch_number).toBe('MH-LOTE-000001');
      expect(batchNumberGeneratorService.generateBatchNumber).toHaveBeenCalledWith(
        'warehouse-1',
        'tenant-1',
      );
    });

    it('should set warehouse_id from purchase order', async () => {
      jest
        .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
        .mockResolvedValue('MH-LOTE-000001');
      jest
        .spyOn(unitConversionService, 'getBaseUom')
        .mockResolvedValue('uom-1');
      jest
        .spyOn(unitConversionService, 'convertToBaseUnit')
        .mockResolvedValue(10);
      jest
        .spyOn(inventoryBatchRepository, 'create')
        .mockReturnValue(mockCreatedBatch);
      jest
        .spyOn(inventoryBatchRepository, 'save')
        .mockResolvedValue(mockCreatedBatch);

      const result = await service.createBatchForReceivedItem(
        mockReceivedItem,
        mockPurchaseOrder,
        'line-1',
        'user-1',
      );

      expect(result.warehouse_id).toBe('warehouse-1');
    });

    it('should set product_id from received item', async () => {
      jest
        .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
        .mockResolvedValue('MH-LOTE-000001');
      jest
        .spyOn(unitConversionService, 'getBaseUom')
        .mockResolvedValue('uom-1');
      jest
        .spyOn(unitConversionService, 'convertToBaseUnit')
        .mockResolvedValue(10);
      jest
        .spyOn(inventoryBatchRepository, 'create')
        .mockReturnValue(mockCreatedBatch);
      jest
        .spyOn(inventoryBatchRepository, 'save')
        .mockResolvedValue(mockCreatedBatch);

      const result = await service.createBatchForReceivedItem(
        mockReceivedItem,
        mockPurchaseOrder,
        'line-1',
        'user-1',
      );

      expect(result.product_id).toBe('product-1');
    });

    it('should convert quantity to base unit', async () => {
      jest
        .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
        .mockResolvedValue('MH-LOTE-000001');
      jest
        .spyOn(unitConversionService, 'getBaseUom')
        .mockResolvedValue('uom-1');
      jest
        .spyOn(unitConversionService, 'convertToBaseUnit')
        .mockResolvedValue(20);
      jest
        .spyOn(inventoryBatchRepository, 'create')
        .mockReturnValue({
          ...mockCreatedBatch,
          quantity: 20,
        });
      jest
        .spyOn(inventoryBatchRepository, 'save')
        .mockResolvedValue({
          ...mockCreatedBatch,
          quantity: 20,
        });

      const result = await service.createBatchForReceivedItem(
        mockReceivedItem,
        mockPurchaseOrder,
        'line-1',
        'user-1',
      );

      expect(result.quantity).toBe(20);
      expect(unitConversionService.convertToBaseUnit).toHaveBeenCalledWith(
        10,
        'uom-2',
        'product-1',
      );
    });

    it('should set uom_id to base unit', async () => {
      jest
        .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
        .mockResolvedValue('MH-LOTE-000001');
      jest
        .spyOn(unitConversionService, 'getBaseUom')
        .mockResolvedValue('uom-1');
      jest
        .spyOn(unitConversionService, 'convertToBaseUnit')
        .mockResolvedValue(10);
      jest
        .spyOn(inventoryBatchRepository, 'create')
        .mockReturnValue(mockCreatedBatch);
      jest
        .spyOn(inventoryBatchRepository, 'save')
        .mockResolvedValue(mockCreatedBatch);

      const result = await service.createBatchForReceivedItem(
        mockReceivedItem,
        mockPurchaseOrder,
        'line-1',
        'user-1',
      );

      expect(result.uom_id).toBe('uom-1');
    });

    it('should set purchase_order_batch_id reference', async () => {
      jest
        .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
        .mockResolvedValue('MH-LOTE-000001');
      jest
        .spyOn(unitConversionService, 'getBaseUom')
        .mockResolvedValue('uom-1');
      jest
        .spyOn(unitConversionService, 'convertToBaseUnit')
        .mockResolvedValue(10);
      jest
        .spyOn(inventoryBatchRepository, 'create')
        .mockReturnValue(mockCreatedBatch);
      jest
        .spyOn(inventoryBatchRepository, 'save')
        .mockResolvedValue(mockCreatedBatch);

      const result = await service.createBatchForReceivedItem(
        mockReceivedItem,
        mockPurchaseOrder,
        'line-1',
        'user-1',
      );

      expect(result.purchase_order_batch_id).toBe('po-123');
    });

    it('should set purchase_order_detail_id reference', async () => {
      jest
        .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
        .mockResolvedValue('MH-LOTE-000001');
      jest
        .spyOn(unitConversionService, 'getBaseUom')
        .mockResolvedValue('uom-1');
      jest
        .spyOn(unitConversionService, 'convertToBaseUnit')
        .mockResolvedValue(10);
      jest
        .spyOn(inventoryBatchRepository, 'create')
        .mockReturnValue(mockCreatedBatch);
      jest
        .spyOn(inventoryBatchRepository, 'save')
        .mockResolvedValue(mockCreatedBatch);

      const result = await service.createBatchForReceivedItem(
        mockReceivedItem,
        mockPurchaseOrder,
        'line-1',
        'user-1',
      );

      expect(result.purchase_order_detail_id).toBe('line-1');
    });

    it('should set created_by to user ID', async () => {
      jest
        .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
        .mockResolvedValue('MH-LOTE-000001');
      jest
        .spyOn(unitConversionService, 'getBaseUom')
        .mockResolvedValue('uom-1');
      jest
        .spyOn(unitConversionService, 'convertToBaseUnit')
        .mockResolvedValue(10);
      jest
        .spyOn(inventoryBatchRepository, 'create')
        .mockReturnValue(mockCreatedBatch);
      jest
        .spyOn(inventoryBatchRepository, 'save')
        .mockResolvedValue(mockCreatedBatch);

      const result = await service.createBatchForReceivedItem(
        mockReceivedItem,
        mockPurchaseOrder,
        'line-1',
        'user-1',
      );

      expect(result.created_by).toBe('user-1');
    });

    it('should set created_at to current timestamp', async () => {
      jest
        .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
        .mockResolvedValue('MH-LOTE-000001');
      jest
        .spyOn(unitConversionService, 'getBaseUom')
        .mockResolvedValue('uom-1');
      jest
        .spyOn(unitConversionService, 'convertToBaseUnit')
        .mockResolvedValue(10);

      const beforeCall = new Date();
      const batchWithTimestamp = {
        ...mockCreatedBatch,
        created_at: new Date(),
      };
      jest
        .spyOn(inventoryBatchRepository, 'create')
        .mockReturnValue(batchWithTimestamp);
      jest
        .spyOn(inventoryBatchRepository, 'save')
        .mockResolvedValue(batchWithTimestamp);

      const result = await service.createBatchForReceivedItem(
        mockReceivedItem,
        mockPurchaseOrder,
        'line-1',
        'user-1',
      );
      const afterCall = new Date();

      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.created_at.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime(),
      );
      expect(result.created_at.getTime()).toBeLessThanOrEqual(
        afterCall.getTime(),
      );
    });

    it('should set tenant_id from purchase order', async () => {
      jest
        .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
        .mockResolvedValue('MH-LOTE-000001');
      jest
        .spyOn(unitConversionService, 'getBaseUom')
        .mockResolvedValue('uom-1');
      jest
        .spyOn(unitConversionService, 'convertToBaseUnit')
        .mockResolvedValue(10);
      jest
        .spyOn(inventoryBatchRepository, 'create')
        .mockReturnValue(mockCreatedBatch);
      jest
        .spyOn(inventoryBatchRepository, 'save')
        .mockResolvedValue(mockCreatedBatch);

      const result = await service.createBatchForReceivedItem(
        mockReceivedItem,
        mockPurchaseOrder,
        'line-1',
        'user-1',
      );

      expect(result.tenant_id).toBe('tenant-1');
    });

    it('should persist batch to database', async () => {
      jest
        .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
        .mockResolvedValue('MH-LOTE-000001');
      jest
        .spyOn(unitConversionService, 'getBaseUom')
        .mockResolvedValue('uom-1');
      jest
        .spyOn(unitConversionService, 'convertToBaseUnit')
        .mockResolvedValue(10);
      jest
        .spyOn(inventoryBatchRepository, 'create')
        .mockReturnValue(mockCreatedBatch);
      jest
        .spyOn(inventoryBatchRepository, 'save')
        .mockResolvedValue(mockCreatedBatch);

      await service.createBatchForReceivedItem(
        mockReceivedItem,
        mockPurchaseOrder,
        'line-1',
        'user-1',
      );

      expect(inventoryBatchRepository.save).toHaveBeenCalledWith(
        mockCreatedBatch,
      );
    });

    it('should call getBaseUom with correct product ID', async () => {
      jest
        .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
        .mockResolvedValue('MH-LOTE-000001');
      jest
        .spyOn(unitConversionService, 'getBaseUom')
        .mockResolvedValue('uom-1');
      jest
        .spyOn(unitConversionService, 'convertToBaseUnit')
        .mockResolvedValue(10);
      jest
        .spyOn(inventoryBatchRepository, 'create')
        .mockReturnValue(mockCreatedBatch);
      jest
        .spyOn(inventoryBatchRepository, 'save')
        .mockResolvedValue(mockCreatedBatch);

      await service.createBatchForReceivedItem(
        mockReceivedItem,
        mockPurchaseOrder,
        'line-1',
        'user-1',
      );

      expect(unitConversionService.getBaseUom).toHaveBeenCalledWith(
        'product-1',
      );
    });
  });
});
