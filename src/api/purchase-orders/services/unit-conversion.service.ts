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
   * Get all product UOMs for a product
   * @param productId - The product ID
   * @returns Array of product UOMs
   */
  async getProductUomsByProductId(productId: string): Promise<any[]> {
    return await this.productUomRepository.find({
      where: { product_id: productId },
    });
  }

  /**
   * Get the product_uom.id based on either product_uom.id or uom_catalog.id
   * @param uomId - The product UOM ID or UoM Catalog ID
   * @param productId - The product ID
   * @returns The product_uom.id
   */
  async getProductUomId(uomId: string, productId: string): Promise<string> {
    this.logger.debug(`Getting product_uom.id for UOM ${uomId} and product ${productId}`);
    
    // Try to find by ID first
    let productUom = await this.productUomRepository.findOne({
      where: {
        id: uomId,
        product_id: productId,
      },
    });

    // If not found, try by uom_catalog_id
    if (!productUom) {
      productUom = await this.productUomRepository.findOne({
        where: {
          uom_catalog_id: uomId,
          product_id: productId,
        },
      });
    }

    if (!productUom) {
      this.logger.error(`ProductUoM not found for product ${productId} with UOM ${uomId}`);
      throw new BadRequestException(
        `Unidad de medida no soportada para este producto`,
      );
    }

    this.logger.debug(`Product UOM ID: ${productUom.id}`);
    return productUom.id;
  }

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
        `Unidad de medida no encontrada: ${productUomId}`,
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
      this.logger.error(`Unidad de medida base no encontrada para el producto: ${productId}`);
      throw new BadRequestException(
        `Unidad de medida base no encontrada para el producto: ${productId}`,
      );
    }

    this.logger.debug(`Base UOM found: ${baseUom.uom_catalog_id}`);
    return baseUom.uom_catalog_id;
  }

  /**
   * Convert quantity from received UOM to base unit
   * @param quantity - The quantity to convert
   * @param productUomId - The product UOM ID (from product_uoms table)
   * @param productId - The product ID
   * @returns The converted quantity in base units
   */
  async convertToBaseUnit(
    quantity: number,
    productUomId: string,
    productId: string,
  ): Promise<number> {
    this.logger.debug(`Converting quantity ${quantity} from product UOM ${productUomId} for product ${productId}`);
    
    // Find ProductUoM by ID
    const productUom = await this.productUomRepository.findOne({
      where: {
        id: productUomId,
        product_id: productId,
      },
    });

    if (!productUom) {
      this.logger.error(`ProductUoM not found for product ${productId} with ID ${productUomId}`);
      throw new BadRequestException(
        `Unidad de medida no soportada para este producto`,
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
