import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UoMRepository } from '../repositories/uom.repository';
import { UoMRelationshipRepository } from '../repositories/uom-relationship.repository';
import { VendorProductPriceRepository } from '../repositories/vendor-product-price.repository';
import { UoMCatalogRepository } from '../repositories/uom-catalog.repository';
import { UoM } from '../../../entities/products/uom.entity';
import { UoMRelationship } from '../../../entities/products/uom-relationship.entity';

@Injectable()
export class UoMService {
  constructor(
    private uomRepository: UoMRepository,
    private relationshipRepository: UoMRelationshipRepository,
    private vendorPriceRepository: VendorProductPriceRepository,
    private catalogRepository: UoMCatalogRepository,
  ) {}

  async assignUoMFromCatalog(productId: string, uomCatalogId: string): Promise<UoM> {
    // Validate catalog UoM exists
    const catalogUoM = await this.catalogRepository.findById(uomCatalogId);
    if (!catalogUoM) {
      throw new NotFoundException(`UoM Catalog with ID ${uomCatalogId} not found`);
    }

    // Check if product already has this UoM assigned
    const existingUoMs = await this.uomRepository.findByProduct(productId);
    if (existingUoMs.some((u) => u.uom_catalog_id === uomCatalogId)) {
      throw new ConflictException('This UoM is already assigned to this product');
    }

    return this.uomRepository.create({
      product_id: productId,
      uom_catalog_id: uomCatalogId,
      code: catalogUoM.name, // Store catalog name as code for backward compatibility
      name: catalogUoM.name,
    });
  }

  async getUoM(id: string): Promise<UoM> {
    const uom = await this.uomRepository.findById(id);
    if (!uom) {
      throw new NotFoundException(`UoM with ID ${id} not found`);
    }
    return uom;
  }

  async getUoMsByProduct(productId: string): Promise<UoM[]> {
    return this.uomRepository.findByProduct(productId);
  }

  async deleteUoM(id: string): Promise<void> {
    const uom = await this.getUoM(id);

    // Check if UoM is referenced by vendor prices
    const vendorPrices = await this.vendorPriceRepository.findByProduct(uom.product_id);
    if (vendorPrices.some((p) => p.uom_id === id)) {
      throw new ConflictException(
        'Cannot delete UoM: it is referenced by vendor product prices',
      );
    }

    // Check if UoM is referenced by relationships
    const relationships = await this.relationshipRepository.findByProduct(uom.product_id);
    if (
      relationships.some((r) => r.source_uom_id === id || r.target_uom_id === id)
    ) {
      throw new ConflictException(
        'Cannot delete UoM: it is referenced by UoM relationships',
      );
    }

    await this.uomRepository.delete(id);
  }

  async createRelationship(
    productId: string,
    sourceUoMId: string,
    targetUoMId: string,
    conversionFactor: number,
  ): Promise<UoMRelationship> {
    // Validate conversion factor > 0
    if (conversionFactor <= 0) {
      throw new BadRequestException('Conversion factor must be greater than zero');
    }

    // Validate source and target UoMs are different
    if (sourceUoMId === targetUoMId) {
      throw new BadRequestException('Source and target UoMs must be different');
    }

    // Validate both UoMs belong to the same product
    const sourceUoM = await this.getUoM(sourceUoMId);
    const targetUoM = await this.getUoM(targetUoMId);

    if (sourceUoM.product_id !== productId || targetUoM.product_id !== productId) {
      throw new BadRequestException('Both UoMs must belong to the same product');
    }

    return this.relationshipRepository.create({
      product_id: productId,
      source_uom_id: sourceUoMId,
      target_uom_id: targetUoMId,
      conversion_factor: conversionFactor,
    });
  }

  async getRelationships(productId: string): Promise<UoMRelationship[]> {
    return this.relationshipRepository.findByProduct(productId);
  }

  async deleteRelationship(id: string): Promise<void> {
    const relationship = await this.relationshipRepository.findById(id);
    if (!relationship) {
      throw new NotFoundException(`UoM Relationship with ID ${id} not found`);
    }
    await this.relationshipRepository.delete(id);
  }

  async convertQuantity(
    productId: string,
    quantity: number,
    fromUoMId: string,
    toUoMId: string,
  ): Promise<number> {
    if (fromUoMId === toUoMId) {
      return quantity;
    }

    // Get all relationships for the product
    const relationships = await this.relationshipRepository.findByProduct(productId);

    // Build a graph of conversions
    const graph = new Map<string, Array<{ targetId: string; factor: number }>>();
    const reverseGraph = new Map<string, Array<{ targetId: string; factor: number }>>();

    for (const rel of relationships) {
      if (!graph.has(rel.source_uom_id)) {
        graph.set(rel.source_uom_id, []);
      }
      const sourceList = graph.get(rel.source_uom_id);
      if (sourceList) {
        sourceList.push({
          targetId: rel.target_uom_id,
          factor: rel.conversion_factor,
        });
      }

      if (!reverseGraph.has(rel.target_uom_id)) {
        reverseGraph.set(rel.target_uom_id, []);
      }
      const targetList = reverseGraph.get(rel.target_uom_id);
      if (targetList) {
        targetList.push({
          targetId: rel.source_uom_id,
          factor: 1 / rel.conversion_factor,
        });
      }
    }

    // BFS to find conversion path
    const queue: Array<{ uomId: string; factor: number }> = [
      { uomId: fromUoMId, factor: 1 },
    ];
    const visited = new Set<string>();
    visited.add(fromUoMId);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;

      const { uomId, factor } = current;

      if (uomId === toUoMId) {
        return quantity * factor;
      }

      // Forward conversions
      const forwardList = graph.get(uomId);
      if (forwardList) {
        for (const { targetId, factor: convFactor } of forwardList) {
          if (!visited.has(targetId)) {
            visited.add(targetId);
            queue.push({ uomId: targetId, factor: factor * convFactor });
          }
        }
      }

      // Reverse conversions
      const reverseList = reverseGraph.get(uomId);
      if (reverseList) {
        for (const { targetId, factor: convFactor } of reverseList) {
          if (!visited.has(targetId)) {
            visited.add(targetId);
            queue.push({ uomId: targetId, factor: factor * convFactor });
          }
        }
      }
    }

    throw new BadRequestException(
      `No conversion path found between UoM ${fromUoMId} and ${toUoMId}`,
    );
  }
}
