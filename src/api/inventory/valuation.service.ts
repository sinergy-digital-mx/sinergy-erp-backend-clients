import { Injectable } from '@nestjs/common';
import { InventoryItem } from '../../entities/inventory/inventory-item.entity';

interface CostLayer {
  quantity: number;
  unit_cost: number;
  date: Date;
}

@Injectable()
export class ValuationService {
  /**
   * FIFO (First In, First Out) Methods
   */

  /**
   * Add a new cost layer for FIFO valuation
   * @param inventoryItem The inventory item to update
   * @param quantity The quantity to add
   * @param unitCost The unit cost of the new layer
   */
  async addFIFOLayer(
    inventoryItem: InventoryItem,
    quantity: number,
    unitCost: number,
  ): Promise<void> {
    if (!inventoryItem.cost_layers) {
      inventoryItem.cost_layers = [];
    }

    // Add new layer at the end (newest)
    inventoryItem.cost_layers.push({
      quantity,
      unit_cost: unitCost,
      date: new Date(),
    });

    // Recalculate weighted average unit cost from all layers
    await this.recalculateFIFOUnitCost(inventoryItem);
  }

  /**
   * Consume cost layers using FIFO method (oldest first)
   * @param inventoryItem The inventory item to consume from
   * @param quantity The quantity to consume
   * @returns The weighted average cost of consumed items
   */
  async consumeFIFOLayers(
    inventoryItem: InventoryItem,
    quantity: number,
  ): Promise<number> {
    if (!inventoryItem.cost_layers || inventoryItem.cost_layers.length === 0) {
      return inventoryItem.unit_cost;
    }

    let remainingToConsume = Math.abs(quantity);
    let totalCost = 0;
    const updatedLayers: CostLayer[] = [];

    // Consume from oldest layers first
    for (const layer of inventoryItem.cost_layers) {
      if (remainingToConsume <= 0) {
        // Keep remaining layers
        updatedLayers.push(layer);
        continue;
      }

      if (layer.quantity <= remainingToConsume) {
        // Consume entire layer
        totalCost += layer.quantity * layer.unit_cost;
        remainingToConsume -= layer.quantity;
        // Layer is fully consumed, don't add to updatedLayers
      } else {
        // Partially consume layer
        totalCost += remainingToConsume * layer.unit_cost;
        updatedLayers.push({
          quantity: layer.quantity - remainingToConsume,
          unit_cost: layer.unit_cost,
          date: layer.date,
        });
        remainingToConsume = 0;
      }
    }

    inventoryItem.cost_layers = updatedLayers;

    // Recalculate unit cost from remaining layers
    await this.recalculateFIFOUnitCost(inventoryItem);

    // Return weighted average cost of consumed items
    return totalCost / Math.abs(quantity);
  }

  /**
   * Calculate FIFO cost for a given quantity
   * @param inventoryItem The inventory item
   * @param quantity The quantity to calculate cost for
   * @returns Object with unit cost and updated cost layers
   */
  async calculateFIFOCost(
    inventoryItem: InventoryItem,
    quantity: number,
  ): Promise<{ unitCost: number; costLayers: CostLayer[] }> {
    if (!inventoryItem.cost_layers || inventoryItem.cost_layers.length === 0) {
      return {
        unitCost: inventoryItem.unit_cost,
        costLayers: inventoryItem.cost_layers || [],
      };
    }

    // For positive quantities (additions), return current average
    if (quantity > 0) {
      return {
        unitCost: inventoryItem.unit_cost,
        costLayers: inventoryItem.cost_layers,
      };
    }

    // For negative quantities (consumption), calculate from oldest layers
    let remainingToConsume = Math.abs(quantity);
    let totalCost = 0;

    for (const layer of inventoryItem.cost_layers) {
      if (remainingToConsume <= 0) break;

      const consumeQty = Math.min(layer.quantity, remainingToConsume);
      totalCost += consumeQty * layer.unit_cost;
      remainingToConsume -= consumeQty;
    }

    const unitCost = totalCost / Math.abs(quantity);

    return {
      unitCost,
      costLayers: inventoryItem.cost_layers,
    };
  }

  /**
   * Recalculate the weighted average unit cost from all FIFO layers
   * @param inventoryItem The inventory item to recalculate
   */
  private async recalculateFIFOUnitCost(
    inventoryItem: InventoryItem,
  ): Promise<void> {
    if (!inventoryItem.cost_layers || inventoryItem.cost_layers.length === 0) {
      inventoryItem.unit_cost = 0;
      return;
    }

    let totalQuantity = 0;
    let totalValue = 0;

    for (const layer of inventoryItem.cost_layers) {
      totalQuantity += layer.quantity;
      totalValue += layer.quantity * layer.unit_cost;
    }

    inventoryItem.unit_cost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
  }

  /**
   * LIFO (Last In, First Out) Methods
   */

  /**
   * Add a new cost layer for LIFO valuation
   * @param inventoryItem The inventory item to update
   * @param quantity The quantity to add
   * @param unitCost The unit cost of the new layer
   */
  async addLIFOLayer(
    inventoryItem: InventoryItem,
    quantity: number,
    unitCost: number,
  ): Promise<void> {
    if (!inventoryItem.cost_layers) {
      inventoryItem.cost_layers = [];
    }

    // Add new layer at the end (newest)
    inventoryItem.cost_layers.push({
      quantity,
      unit_cost: unitCost,
      date: new Date(),
    });

    // Recalculate weighted average unit cost from all layers
    await this.recalculateLIFOUnitCost(inventoryItem);
  }

  /**
   * Consume cost layers using LIFO method (newest first)
   * @param inventoryItem The inventory item to consume from
   * @param quantity The quantity to consume
   * @returns The weighted average cost of consumed items
   */
  async consumeLIFOLayers(
    inventoryItem: InventoryItem,
    quantity: number,
  ): Promise<number> {
    if (!inventoryItem.cost_layers || inventoryItem.cost_layers.length === 0) {
      return inventoryItem.unit_cost;
    }

    let remainingToConsume = Math.abs(quantity);
    let totalCost = 0;
    const updatedLayers: CostLayer[] = [];

    // Consume from newest layers first (reverse order)
    for (let i = inventoryItem.cost_layers.length - 1; i >= 0; i--) {
      const layer = inventoryItem.cost_layers[i];

      if (remainingToConsume <= 0) {
        // Keep remaining layers (add at beginning to maintain order)
        updatedLayers.unshift(layer);
        continue;
      }

      if (layer.quantity <= remainingToConsume) {
        // Consume entire layer
        totalCost += layer.quantity * layer.unit_cost;
        remainingToConsume -= layer.quantity;
        // Layer is fully consumed, don't add to updatedLayers
      } else {
        // Partially consume layer
        totalCost += remainingToConsume * layer.unit_cost;
        updatedLayers.unshift({
          quantity: layer.quantity - remainingToConsume,
          unit_cost: layer.unit_cost,
          date: layer.date,
        });
        remainingToConsume = 0;
      }
    }

    inventoryItem.cost_layers = updatedLayers;

    // Recalculate unit cost from remaining layers
    await this.recalculateLIFOUnitCost(inventoryItem);

    // Return weighted average cost of consumed items
    return totalCost / Math.abs(quantity);
  }

  /**
   * Calculate LIFO cost for a given quantity
   * @param inventoryItem The inventory item
   * @param quantity The quantity to calculate cost for
   * @returns Object with unit cost and updated cost layers
   */
  async calculateLIFOCost(
    inventoryItem: InventoryItem,
    quantity: number,
  ): Promise<{ unitCost: number; costLayers: CostLayer[] }> {
    if (!inventoryItem.cost_layers || inventoryItem.cost_layers.length === 0) {
      return {
        unitCost: inventoryItem.unit_cost,
        costLayers: inventoryItem.cost_layers || [],
      };
    }

    // For positive quantities (additions), return current average
    if (quantity > 0) {
      return {
        unitCost: inventoryItem.unit_cost,
        costLayers: inventoryItem.cost_layers,
      };
    }

    // For negative quantities (consumption), calculate from newest layers
    let remainingToConsume = Math.abs(quantity);
    let totalCost = 0;

    for (let i = inventoryItem.cost_layers.length - 1; i >= 0; i--) {
      if (remainingToConsume <= 0) break;

      const layer = inventoryItem.cost_layers[i];
      const consumeQty = Math.min(layer.quantity, remainingToConsume);
      totalCost += consumeQty * layer.unit_cost;
      remainingToConsume -= consumeQty;
    }

    const unitCost = totalCost / Math.abs(quantity);

    return {
      unitCost,
      costLayers: inventoryItem.cost_layers,
    };
  }

  /**
   * Recalculate the weighted average unit cost from all LIFO layers
   * @param inventoryItem The inventory item to recalculate
   */
  private async recalculateLIFOUnitCost(
    inventoryItem: InventoryItem,
  ): Promise<void> {
    if (!inventoryItem.cost_layers || inventoryItem.cost_layers.length === 0) {
      inventoryItem.unit_cost = 0;
      return;
    }

    let totalQuantity = 0;
    let totalValue = 0;

    for (const layer of inventoryItem.cost_layers) {
      totalQuantity += layer.quantity;
      totalValue += layer.quantity * layer.unit_cost;
    }

    inventoryItem.unit_cost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
  }

  /**
   * Weighted Average Methods
   */

  /**
   * Calculate weighted average cost when adding new inventory
   * @param inventoryItem The inventory item
   * @param newQuantity The new quantity being added
   * @param newUnitCost The unit cost of the new quantity
   * @returns The new weighted average unit cost
   */
  async calculateWeightedAverageCost(
    inventoryItem: InventoryItem,
    newQuantity: number,
    newUnitCost: number,
  ): Promise<number> {
    const currentQuantity = Number(inventoryItem.quantity_on_hand) || 0;
    const currentUnitCost = Number(inventoryItem.unit_cost) || 0;

    // If current quantity is zero, use the new unit cost
    if (currentQuantity === 0) {
      return newUnitCost;
    }

    // Calculate weighted average
    const currentValue = currentQuantity * currentUnitCost;
    const newValue = newQuantity * newUnitCost;
    const totalValue = currentValue + newValue;
    const totalQuantity = currentQuantity + newQuantity;

    return totalQuantity > 0 ? totalValue / totalQuantity : 0;
  }

  /**
   * Update inventory item with weighted average cost
   * @param inventoryItem The inventory item to update
   * @param quantity The quantity being added (positive) or removed (negative)
   * @param unitCost The unit cost (used only for additions)
   */
  async updateWeightedAverage(
    inventoryItem: InventoryItem,
    quantity: number,
    unitCost: number,
  ): Promise<void> {
    if (quantity > 0) {
      // Adding inventory - recalculate weighted average
      inventoryItem.unit_cost = await this.calculateWeightedAverageCost(
        inventoryItem,
        quantity,
        unitCost,
      );
    }
    // For removals (quantity < 0), keep the current unit_cost unchanged
    // Weighted average doesn't change when removing inventory
  }

  /**
   * General Valuation Methods
   */

  /**
   * Update inventory valuation based on the valuation method
   * @param inventoryItem The inventory item to update
   * @param quantity The quantity change (positive for additions, negative for removals)
   * @param unitCost The unit cost of the transaction
   */
  async updateInventoryValuation(
    inventoryItem: InventoryItem,
    quantity: number,
    unitCost: number,
  ): Promise<void> {
    const method = inventoryItem.valuation_method;

    if (quantity > 0) {
      // Adding inventory
      switch (method) {
        case 'FIFO':
          await this.addFIFOLayer(inventoryItem, quantity, unitCost);
          break;
        case 'LIFO':
          await this.addLIFOLayer(inventoryItem, quantity, unitCost);
          break;
        case 'Weighted_Average':
          await this.updateWeightedAverage(inventoryItem, quantity, unitCost);
          break;
      }
    } else {
      // Removing inventory
      switch (method) {
        case 'FIFO':
          await this.consumeFIFOLayers(inventoryItem, quantity);
          break;
        case 'LIFO':
          await this.consumeLIFOLayers(inventoryItem, quantity);
          break;
        case 'Weighted_Average':
          // For weighted average, unit cost doesn't change on removal
          break;
      }
    }

    // Recalculate total value
    await this.recalculateTotalValue(inventoryItem);
  }

  /**
   * Recalculate the total value of inventory
   * @param inventoryItem The inventory item to recalculate
   */
  async recalculateTotalValue(inventoryItem: InventoryItem): Promise<void> {
    const quantity = Number(inventoryItem.quantity_on_hand) || 0;
    const unitCost = Number(inventoryItem.unit_cost) || 0;
    inventoryItem.total_value = quantity * unitCost;
  }
}
