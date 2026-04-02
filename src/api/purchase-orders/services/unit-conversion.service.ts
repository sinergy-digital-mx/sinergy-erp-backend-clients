import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductUoM } from '../../../entities/products';

@Injectable()
export class UnitConversionService {
  private readonly logger = new Logger(UnitConversionService.name);

  constructor(
    @InjectRepository(ProductUoM)
    private readonly productUomRepository: Repository<ProductUoM>,
  ) {}

  /**
   * Get conversion factor for a product UOM
   * @param productUomId - The product UOM ID
   * @returns The conversion factor
   */
  async getConversionFactor(productUomId: string): Promise<number> {
    const productUom = await this.productUomRepository.findOne({
      where: { id: productUomId },
    });

    if (!productUom) {
      throw new BadRequestException(
        `Unit of measurement not found: ${productUomId}`,
      );
    }

    return productUom.factor || 1;
  }

  /**
   * Get base UOM for a product
   * @param productId - The product ID
   * @returns The base UOM catalog ID
   */
  async getBaseUom(productId: string): Promise<string> {
    this.logger.debug(`Getting base UOM for product: ${productId}`);
    
    const baseUom = await this.productUomRepository.findOne({
      where: {
        product_id: productId,
        is_base: true,
      },
    });

    if (!baseUom) {
      this.logger.error(`Base unit of measurement not found for product: ${productId}`);
      throw new BadRequestException(
        `Base unit of measurement not found for product: ${productId}`,
      );
    }

    this.logger.debug(`Base UOM found: ${baseUom.uom_catalog_id}`);
    return baseUom.uom_catalog_id;
  }

  /**
   * Convert quantity from received UOM to base unit
   * @param quantity - The quantity to convert
   * @param fromUomId - The product UOM ID or UoM Catalog ID (received UOM)
   * @param productId - The product ID
   * @returns The converted quantity in base units
   */
  async convertToBaseUnit(
    quantity: number,
    fromUomId: string,
    productId: string,
  ): Promise<number> {
    this.logger.debug(`Converting quantity ${quantity} from UOM ${fromUomId} for product ${productId}`);
    
    // Try to find ProductUoM by ID first (could be product_uom.id or uom_catalog.id)
    this.logger.debug(`Searching for ProductUoM by ID: ${fromUomId}`);
    let productUom = await this.productUomRepository.findOne({
      where: {
        id: fromUomId,
        product_id: productId,
      },
    });

    // If not found by ProductUoM ID, try by UoM Catalog ID
    if (!productUom) {
      this.logger.debug(`Not found by ID, trying by uom_catalog_id: ${fromUomId}`);
      productUom = await this.productUomRepository.findOne({
        where: {
          uom_catalog_id: fromUomId,
          product_id: productId,
        },
      });
    }

    if (!productUom) {
      this.logger.error(`ProductUoM not found for product ${productId} with UOM ${fromUomId}`);
      throw new BadRequestException(
        `Unit of measurement not supported for this product`,
      );
    }

    this.logger.debug(`ProductUoM found: is_base=${productUom.is_base}, factor=${productUom.factor}`);

    // If it's already the base unit, no conversion needed
    if (productUom.is_base) {
      this.logger.debug(`UOM is already base, no conversion needed`);
      return quantity;
    }

    // Get the conversion factor
    const factor = productUom.factor || 1;
    const convertedQuantity = quantity * factor;
    this.logger.debug(`Converted quantity: ${quantity} * ${factor} = ${convertedQuantity}`);
    return convertedQuantity;
  }
}
