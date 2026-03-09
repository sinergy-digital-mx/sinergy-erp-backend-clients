import { Test, TestingModule } from '@nestjs/testing';
import { ValuationService } from './valuation.service';
import { InventoryItem } from '../../entities/inventory/inventory-item.entity';

describe('ValuationService', () => {
  let service: ValuationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValuationService],
    }).compile();

    service = module.get<ValuationService>(ValuationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('FIFO Valuation', () => {
    let inventoryItem: InventoryItem;

    beforeEach(() => {
      inventoryItem = {
        id: 'test-id',
        tenant_id: 'tenant-1',
        product_id: 'product-1',
        warehouse_id: 'warehouse-1',
        uom_id: 'uom-1',
        quantity_on_hand: 0,
        quantity_reserved: 0,
        quantity_available: 0,
        reorder_point: null,
        reorder_quantity: null,
        location: null,
        valuation_method: 'FIFO',
        unit_cost: 0,
        total_value: 0,
        cost_layers: [],
        created_at: new Date(),
        updated_at: new Date(),
      } as InventoryItem;
    });

    it('should add a FIFO layer', async () => {
      await service.addFIFOLayer(inventoryItem, 100, 10);

      expect(inventoryItem.cost_layers).toHaveLength(1);
      expect(inventoryItem.cost_layers[0].quantity).toBe(100);
      expect(inventoryItem.cost_layers[0].unit_cost).toBe(10);
      expect(inventoryItem.unit_cost).toBe(10);
    });

    it('should add multiple FIFO layers', async () => {
      await service.addFIFOLayer(inventoryItem, 100, 10);
      await service.addFIFOLayer(inventoryItem, 50, 12);

      expect(inventoryItem.cost_layers).toHaveLength(2);
      expect(inventoryItem.cost_layers[0].quantity).toBe(100);
      expect(inventoryItem.cost_layers[0].unit_cost).toBe(10);
      expect(inventoryItem.cost_layers[1].quantity).toBe(50);
      expect(inventoryItem.cost_layers[1].unit_cost).toBe(12);
      
      // Weighted average: (100*10 + 50*12) / 150 = 1600/150 = 10.67
      expect(inventoryItem.unit_cost).toBeCloseTo(10.67, 2);
    });

    it('should consume from oldest layer first (FIFO)', async () => {
      await service.addFIFOLayer(inventoryItem, 100, 10);
      await service.addFIFOLayer(inventoryItem, 50, 12);

      const consumedCost = await service.consumeFIFOLayers(inventoryItem, -60);

      // Should consume 60 from oldest layer (cost 10)
      expect(consumedCost).toBe(10);
      expect(inventoryItem.cost_layers).toHaveLength(2);
      expect(inventoryItem.cost_layers[0].quantity).toBe(40); // 100 - 60
      expect(inventoryItem.cost_layers[1].quantity).toBe(50);
    });

    it('should consume entire layer and move to next (FIFO)', async () => {
      await service.addFIFOLayer(inventoryItem, 100, 10);
      await service.addFIFOLayer(inventoryItem, 50, 12);

      const consumedCost = await service.consumeFIFOLayers(inventoryItem, -120);

      // Should consume all 100 from first layer (cost 10) and 20 from second layer (cost 12)
      // Weighted average: (100*10 + 20*12) / 120 = 1240/120 = 10.33
      expect(consumedCost).toBeCloseTo(10.33, 2);
      expect(inventoryItem.cost_layers).toHaveLength(1);
      expect(inventoryItem.cost_layers[0].quantity).toBe(30); // 50 - 20
      expect(inventoryItem.cost_layers[0].unit_cost).toBe(12);
    });

    it('should handle consuming all layers (FIFO)', async () => {
      await service.addFIFOLayer(inventoryItem, 100, 10);
      await service.addFIFOLayer(inventoryItem, 50, 12);

      const consumedCost = await service.consumeFIFOLayers(inventoryItem, -150);

      // Weighted average: (100*10 + 50*12) / 150 = 1600/150 = 10.67
      expect(consumedCost).toBeCloseTo(10.67, 2);
      expect(inventoryItem.cost_layers).toHaveLength(0);
      expect(inventoryItem.unit_cost).toBe(0);
    });

    it('should calculate FIFO cost for consumption', async () => {
      await service.addFIFOLayer(inventoryItem, 100, 10);
      await service.addFIFOLayer(inventoryItem, 50, 12);

      const result = await service.calculateFIFOCost(inventoryItem, -80);

      // Should calculate cost from oldest layers: 80 units at cost 10
      expect(result.unitCost).toBe(10);
      expect(result.costLayers).toHaveLength(2);
    });
  });

  describe('LIFO Valuation', () => {
    let inventoryItem: InventoryItem;

    beforeEach(() => {
      inventoryItem = {
        id: 'test-id',
        tenant_id: 'tenant-1',
        product_id: 'product-1',
        warehouse_id: 'warehouse-1',
        uom_id: 'uom-1',
        quantity_on_hand: 0,
        quantity_reserved: 0,
        quantity_available: 0,
        reorder_point: null,
        reorder_quantity: null,
        location: null,
        valuation_method: 'LIFO',
        unit_cost: 0,
        total_value: 0,
        cost_layers: [],
        created_at: new Date(),
        updated_at: new Date(),
      } as InventoryItem;
    });

    it('should add a LIFO layer', async () => {
      await service.addLIFOLayer(inventoryItem, 100, 10);

      expect(inventoryItem.cost_layers).toHaveLength(1);
      expect(inventoryItem.cost_layers[0].quantity).toBe(100);
      expect(inventoryItem.cost_layers[0].unit_cost).toBe(10);
      expect(inventoryItem.unit_cost).toBe(10);
    });

    it('should add multiple LIFO layers', async () => {
      await service.addLIFOLayer(inventoryItem, 100, 10);
      await service.addLIFOLayer(inventoryItem, 50, 12);

      expect(inventoryItem.cost_layers).toHaveLength(2);
      expect(inventoryItem.cost_layers[0].quantity).toBe(100);
      expect(inventoryItem.cost_layers[0].unit_cost).toBe(10);
      expect(inventoryItem.cost_layers[1].quantity).toBe(50);
      expect(inventoryItem.cost_layers[1].unit_cost).toBe(12);
      
      // Weighted average: (100*10 + 50*12) / 150 = 1600/150 = 10.67
      expect(inventoryItem.unit_cost).toBeCloseTo(10.67, 2);
    });

    it('should consume from newest layer first (LIFO)', async () => {
      await service.addLIFOLayer(inventoryItem, 100, 10);
      await service.addLIFOLayer(inventoryItem, 50, 12);

      const consumedCost = await service.consumeLIFOLayers(inventoryItem, -30);

      // Should consume 30 from newest layer (cost 12)
      expect(consumedCost).toBe(12);
      expect(inventoryItem.cost_layers).toHaveLength(2);
      expect(inventoryItem.cost_layers[0].quantity).toBe(100);
      expect(inventoryItem.cost_layers[1].quantity).toBe(20); // 50 - 30
    });

    it('should consume entire layer and move to previous (LIFO)', async () => {
      await service.addLIFOLayer(inventoryItem, 100, 10);
      await service.addLIFOLayer(inventoryItem, 50, 12);

      const consumedCost = await service.consumeLIFOLayers(inventoryItem, -80);

      // Should consume all 50 from newest layer (cost 12) and 30 from previous layer (cost 10)
      // Weighted average: (50*12 + 30*10) / 80 = 900/80 = 11.25
      expect(consumedCost).toBeCloseTo(11.25, 2);
      expect(inventoryItem.cost_layers).toHaveLength(1);
      expect(inventoryItem.cost_layers[0].quantity).toBe(70); // 100 - 30
      expect(inventoryItem.cost_layers[0].unit_cost).toBe(10);
    });

    it('should handle consuming all layers (LIFO)', async () => {
      await service.addLIFOLayer(inventoryItem, 100, 10);
      await service.addLIFOLayer(inventoryItem, 50, 12);

      const consumedCost = await service.consumeLIFOLayers(inventoryItem, -150);

      // Weighted average: (50*12 + 100*10) / 150 = 1600/150 = 10.67
      expect(consumedCost).toBeCloseTo(10.67, 2);
      expect(inventoryItem.cost_layers).toHaveLength(0);
      expect(inventoryItem.unit_cost).toBe(0);
    });

    it('should calculate LIFO cost for consumption', async () => {
      await service.addLIFOLayer(inventoryItem, 100, 10);
      await service.addLIFOLayer(inventoryItem, 50, 12);

      const result = await service.calculateLIFOCost(inventoryItem, -40);

      // Should calculate cost from newest layers: 40 units at cost 12
      expect(result.unitCost).toBe(12);
      expect(result.costLayers).toHaveLength(2);
    });
  });

  describe('Weighted Average Valuation', () => {
    let inventoryItem: InventoryItem;

    beforeEach(() => {
      inventoryItem = {
        id: 'test-id',
        tenant_id: 'tenant-1',
        product_id: 'product-1',
        warehouse_id: 'warehouse-1',
        uom_id: 'uom-1',
        quantity_on_hand: 0,
        quantity_reserved: 0,
        quantity_available: 0,
        reorder_point: null,
        reorder_quantity: null,
        location: null,
        valuation_method: 'Weighted_Average',
        unit_cost: 0,
        total_value: 0,
        cost_layers: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as InventoryItem;
    });

    it('should calculate weighted average for first purchase', async () => {
      const newCost = await service.calculateWeightedAverageCost(
        inventoryItem,
        100,
        10,
      );

      expect(newCost).toBe(10);
    });

    it('should calculate weighted average for subsequent purchases', async () => {
      inventoryItem.quantity_on_hand = 100;
      inventoryItem.unit_cost = 10;

      const newCost = await service.calculateWeightedAverageCost(
        inventoryItem,
        50,
        12,
      );

      // (100*10 + 50*12) / 150 = 1600/150 = 10.67
      expect(newCost).toBeCloseTo(10.67, 2);
    });

    it('should update weighted average on addition', async () => {
      inventoryItem.quantity_on_hand = 100;
      inventoryItem.unit_cost = 10;

      await service.updateWeightedAverage(inventoryItem, 50, 12);

      expect(inventoryItem.unit_cost).toBeCloseTo(10.67, 2);
    });

    it('should not change unit cost on removal', async () => {
      inventoryItem.quantity_on_hand = 100;
      inventoryItem.unit_cost = 10;

      await service.updateWeightedAverage(inventoryItem, -30, 10);

      // Unit cost should remain unchanged for removals
      expect(inventoryItem.unit_cost).toBe(10);
    });

    it('should handle zero current quantity', async () => {
      inventoryItem.quantity_on_hand = 0;
      inventoryItem.unit_cost = 0;

      const newCost = await service.calculateWeightedAverageCost(
        inventoryItem,
        50,
        15,
      );

      expect(newCost).toBe(15);
    });
  });

  describe('General Valuation Methods', () => {
    it('should update FIFO valuation on addition', async () => {
      const inventoryItem = {
        id: 'test-id',
        valuation_method: 'FIFO',
        quantity_on_hand: 0,
        unit_cost: 0,
        total_value: 0,
        cost_layers: [],
      } as InventoryItem;

      await service.updateInventoryValuation(inventoryItem, 100, 10);

      expect(inventoryItem.cost_layers).toHaveLength(1);
      expect(inventoryItem.unit_cost).toBe(10);
      expect(inventoryItem.total_value).toBe(0); // quantity_on_hand is still 0
    });

    it('should update LIFO valuation on addition', async () => {
      const inventoryItem = {
        id: 'test-id',
        valuation_method: 'LIFO',
        quantity_on_hand: 0,
        unit_cost: 0,
        total_value: 0,
        cost_layers: [],
      } as InventoryItem;

      await service.updateInventoryValuation(inventoryItem, 100, 10);

      expect(inventoryItem.cost_layers).toHaveLength(1);
      expect(inventoryItem.unit_cost).toBe(10);
      expect(inventoryItem.total_value).toBe(0);
    });

    it('should update Weighted Average valuation on addition', async () => {
      const inventoryItem = {
        id: 'test-id',
        valuation_method: 'Weighted_Average',
        quantity_on_hand: 100,
        unit_cost: 10,
        total_value: 1000,
        cost_layers: null,
      } as InventoryItem;

      await service.updateInventoryValuation(inventoryItem, 50, 12);

      expect(inventoryItem.unit_cost).toBeCloseTo(10.67, 2);
      expect(inventoryItem.total_value).toBeCloseTo(1066.67, 2);
    });

    it('should update FIFO valuation on removal', async () => {
      const inventoryItem = {
        id: 'test-id',
        valuation_method: 'FIFO',
        quantity_on_hand: 100,
        unit_cost: 10,
        total_value: 1000,
        cost_layers: [
          { quantity: 100, unit_cost: 10, date: new Date() },
        ],
      } as InventoryItem;

      await service.updateInventoryValuation(inventoryItem, -30, 10);

      expect(inventoryItem.cost_layers).toHaveLength(1);
      expect(inventoryItem.cost_layers[0].quantity).toBe(70);
      expect(inventoryItem.total_value).toBe(1000); // Based on quantity_on_hand which is still 100
    });

    it('should recalculate total value', async () => {
      const inventoryItem = {
        id: 'test-id',
        quantity_on_hand: 150,
        unit_cost: 10.5,
        total_value: 0,
      } as InventoryItem;

      await service.recalculateTotalValue(inventoryItem);

      expect(inventoryItem.total_value).toBe(1575); // 150 * 10.5
    });

    it('should handle zero quantity in total value calculation', async () => {
      const inventoryItem = {
        id: 'test-id',
        quantity_on_hand: 0,
        unit_cost: 10,
        total_value: 100,
      } as InventoryItem;

      await service.recalculateTotalValue(inventoryItem);

      expect(inventoryItem.total_value).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle FIFO with no cost layers', async () => {
      const inventoryItem = {
        id: 'test-id',
        valuation_method: 'FIFO',
        quantity_on_hand: 100,
        unit_cost: 10,
        cost_layers: null,
      } as InventoryItem;

      const consumedCost = await service.consumeFIFOLayers(inventoryItem, -30);

      expect(consumedCost).toBe(10);
    });

    it('should handle LIFO with no cost layers', async () => {
      const inventoryItem = {
        id: 'test-id',
        valuation_method: 'LIFO',
        quantity_on_hand: 100,
        unit_cost: 10,
        cost_layers: null,
      } as InventoryItem;

      const consumedCost = await service.consumeLIFOLayers(inventoryItem, -30);

      expect(consumedCost).toBe(10);
    });

    it('should handle FIFO calculation with empty layers', async () => {
      const inventoryItem = {
        id: 'test-id',
        valuation_method: 'FIFO',
        quantity_on_hand: 100,
        unit_cost: 10,
        cost_layers: [],
      } as InventoryItem;

      const result = await service.calculateFIFOCost(inventoryItem, -30);

      expect(result.unitCost).toBe(10);
      expect(result.costLayers).toHaveLength(0);
    });

    it('should handle LIFO calculation with empty layers', async () => {
      const inventoryItem = {
        id: 'test-id',
        valuation_method: 'LIFO',
        quantity_on_hand: 100,
        unit_cost: 10,
        cost_layers: [],
      } as InventoryItem;

      const result = await service.calculateLIFOCost(inventoryItem, -30);

      expect(result.unitCost).toBe(10);
      expect(result.costLayers).toHaveLength(0);
    });

    it('should handle weighted average with null values', async () => {
      const inventoryItem = {
        id: 'test-id',
        quantity_on_hand: null,
        unit_cost: null,
      } as any;

      const newCost = await service.calculateWeightedAverageCost(
        inventoryItem,
        100,
        10,
      );

      expect(newCost).toBe(10);
    });
  });
});
