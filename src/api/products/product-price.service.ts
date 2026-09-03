import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { Product } from '../../entities/products/product.entity';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { roundUnitAmount } from '../../common/utils/unit-amount.util';

@Injectable()
export class ProductPriceService {
  constructor(
    @InjectRepository(ProductPrice)
    private readonly productPriceRepository: Repository<ProductPrice>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private calculateTotals(price: number, iva_percentage: number, ieps_percentage: number) {
    const subtotal = price;
    const iva_unit_total = (price * iva_percentage) / 100;
    const ieps_unit_total = (price * ieps_percentage) / 100;
    const total = subtotal + iva_unit_total + ieps_unit_total;
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      iva_unit_total: Number(iva_unit_total.toFixed(2)),
      ieps_unit_total: Number(ieps_unit_total.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  async create(productId: string, dto: CreateProductPriceDto, tenantId: string): Promise<ProductPrice> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenant_id: tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    // Verificar que la UOM pertenece a este producto
    const productUoM = await this.productPriceRepository.manager.findOne('ProductUoM', {
      where: { id: dto.product_uom_id, product_id: productId },
    });

    if (!productUoM) {
      throw new NotFoundException('La UOM especificada no pertenece a este producto');
    }

    const existing = await this.productPriceRepository.findOne({
      where: { 
        product_id: productId, 
        price_list_id: dto.price_list_id,
        product_uom_id: dto.product_uom_id,
      },
    });

    if (existing) {
      throw new ConflictException('Ya existe un precio para esta lista y UOM en este producto');
    }

    const price = roundUnitAmount(dto.price);
    const totals = this.calculateTotals(price, dto.iva_percentage, dto.ieps_percentage);

    const productPrice = this.productPriceRepository.create({
      ...dto,
      price,
      ...totals,
      product_id: productId,
    });

    const saved = await this.productPriceRepository.save(productPrice);
    
    // Recargar con relaciones
    const result = await this.productPriceRepository.findOne({
      where: { id: saved.id },
      relations: ['price_list', 'product_uom', 'product_uom.uom'],
    });
    
    return result!;
  }

  async findAll(productId: string, tenantId: string): Promise<ProductPrice[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenant_id: tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    return await this.productPriceRepository.find({
      where: { product_id: productId },
      relations: ['price_list', 'product_uom', 'product_uom.uom'],
      order: { created_at: 'ASC' },
    });
  }

  async findOne(id: string, productId: string, tenantId: string): Promise<ProductPrice> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenant_id: tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    const productPrice = await this.productPriceRepository.findOne({
      where: { id, product_id: productId },
      relations: ['price_list', 'product_uom', 'product_uom.uom'],
    });

    if (!productPrice) {
      throw new NotFoundException(`Precio con ID ${id} no encontrado`);
    }

    return productPrice;
  }

  async update(id: string, productId: string, dto: UpdateProductPriceDto, tenantId: string): Promise<ProductPrice> {
    const productPrice = await this.findOne(id, productId, tenantId);

    const price = roundUnitAmount(dto.price ?? productPrice.price);
    const totals = this.calculateTotals(
      price,
      dto.iva_percentage ?? productPrice.iva_percentage,
      dto.ieps_percentage ?? productPrice.ieps_percentage,
    );

    Object.assign(productPrice, dto, totals, { price });
    return await this.productPriceRepository.save(productPrice);
  }

  async remove(id: string, productId: string, tenantId: string): Promise<void> {
    const productPrice = await this.findOne(id, productId, tenantId);
    await this.productPriceRepository.remove(productPrice);
  }
}
