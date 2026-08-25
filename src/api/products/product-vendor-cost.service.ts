import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVendorCost } from '../../entities/products/product-vendor-cost.entity';
import { Product } from '../../entities/products/product.entity';
import { CreateProductVendorCostDto } from './dto/create-product-vendor-cost.dto';
import { UpdateProductVendorCostDto } from './dto/update-product-vendor-cost.dto';

@Injectable()
export class ProductVendorCostService {
  constructor(
    @InjectRepository(ProductVendorCost)
    private readonly productVendorCostRepository: Repository<ProductVendorCost>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private calculateTotals(cost: number, iva_percentage: number, ieps_percentage: number) {
    const subtotal = cost;
    const iva_unit_total = (cost * iva_percentage) / 100;
    const ieps_unit_total = (cost * ieps_percentage) / 100;
    const total = subtotal + iva_unit_total + ieps_unit_total;
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      iva_unit_total: Number(iva_unit_total.toFixed(2)),
      ieps_unit_total: Number(ieps_unit_total.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  async create(productId: string, dto: CreateProductVendorCostDto, tenantId: string): Promise<ProductVendorCost> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenant_id: tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    // Verificar que la UOM pertenece a este producto
    const productUoM = await this.productVendorCostRepository.manager.findOne('ProductUoM', {
      where: { id: dto.product_uom_id, product_id: productId },
    });

    if (!productUoM) {
      throw new NotFoundException('La UOM especificada no pertenece a este producto');
    }

    const existing = await this.productVendorCostRepository.findOne({
      where: { 
        product_id: productId, 
        vendor_id: dto.vendor_id,
        product_uom_id: dto.product_uom_id,
      },
    });

    if (existing) {
      throw new ConflictException('Ya existe un costo para este proveedor y UOM en este producto');
    }

    const totals = this.calculateTotals(dto.cost, dto.iva_percentage, dto.ieps_percentage);

    const vendorCost = this.productVendorCostRepository.create({
      ...dto,
      ...totals,
      product_id: productId,
      currency: dto.currency || 'MXN',
    });

    const saved = await this.productVendorCostRepository.save(vendorCost);
    
    // Recargar con relaciones
    const result = await this.productVendorCostRepository.findOne({
      where: { id: saved.id },
      relations: ['vendor', 'product_uom', 'product_uom.uom'],
    });
    
    return result!;
  }

  async findAll(productId: string, tenantId: string): Promise<ProductVendorCost[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenant_id: tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    return await this.productVendorCostRepository.find({
      where: { product_id: productId },
      relations: ['vendor', 'product_uom', 'product_uom.uom'],
      order: { created_at: 'ASC' },
    });
  }

  async findOne(id: string, productId: string, tenantId: string): Promise<ProductVendorCost> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenant_id: tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    const vendorCost = await this.productVendorCostRepository.findOne({
      where: { id, product_id: productId },
      relations: ['vendor', 'product_uom', 'product_uom.uom'],
    });

    if (!vendorCost) {
      throw new NotFoundException(`Costo con ID ${id} no encontrado`);
    }

    return vendorCost;
  }

  async update(id: string, productId: string, dto: UpdateProductVendorCostDto, tenantId: string): Promise<ProductVendorCost> {
    const vendorCost = await this.findOne(id, productId, tenantId);

    const totals = this.calculateTotals(
      dto.cost ?? vendorCost.cost,
      dto.iva_percentage ?? vendorCost.iva_percentage,
      dto.ieps_percentage ?? vendorCost.ieps_percentage,
    );

    Object.assign(vendorCost, dto, totals);
    return await this.productVendorCostRepository.save(vendorCost);
  }

  async remove(id: string, productId: string, tenantId: string): Promise<void> {
    const vendorCost = await this.findOne(id, productId, tenantId);
    await this.productVendorCostRepository.remove(vendorCost);
  }
}
