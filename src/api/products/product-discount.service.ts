import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProductDiscount,
  ProductDiscountType,
} from '../../entities/products/product-discount.entity';
import { Product } from '../../entities/products/product.entity';
import { CreateProductDiscountDto } from './dto/create-product-discount.dto';
import { UpdateProductDiscountDto } from './dto/update-product-discount.dto';
import {
  isProductDiscountApplicable,
  mapApplicableProductDiscount,
} from './utils/product-discount.util';

@Injectable()
export class ProductDiscountService {
  constructor(
    @InjectRepository(ProductDiscount)
    private readonly productDiscountRepository: Repository<ProductDiscount>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private async assertProductOwnership(productId: string, tenantId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenant_id: tenantId },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }
    return product;
  }

  private validateDiscountValue(discountType: ProductDiscountType, value: number): void {
    if (value <= 0) {
      throw new BadRequestException('El valor del descuento debe ser mayor a 0');
    }
    if (discountType === ProductDiscountType.PERCENTAGE && value > 100) {
      throw new BadRequestException('El porcentaje de descuento no puede ser mayor a 100');
    }
  }

  private validateDateRange(validFrom?: string | null, validTo?: string | null): void {
    if (validFrom && validTo && new Date(validFrom) > new Date(validTo)) {
      throw new BadRequestException('valid_from debe ser anterior o igual a valid_to');
    }
  }

  private async assertProductUom(productId: string, productUomId?: string | null): Promise<void> {
    if (!productUomId) return;

    const productUom = await this.productDiscountRepository.manager.findOne('ProductUoM', {
      where: { id: productUomId, product_id: productId },
    });
    if (!productUom) {
      throw new NotFoundException('La UOM especificada no pertenece a este producto');
    }
  }

  async create(
    productId: string,
    dto: CreateProductDiscountDto,
    tenantId: string,
  ): Promise<ProductDiscount> {
    await this.assertProductOwnership(productId, tenantId);
    this.validateDiscountValue(dto.discount_type, dto.value);
    this.validateDateRange(dto.valid_from, dto.valid_to);
    await this.assertProductUom(productId, dto.product_uom_id);

    const existing = await this.productDiscountRepository.findOne({
      where: { product_id: productId, name: dto.name.trim() },
    });
    if (existing) {
      throw new ConflictException('Ya existe un descuento con ese nombre para este producto');
    }

    const discount = this.productDiscountRepository.create({
      ...dto,
      name: dto.name.trim(),
      product_id: productId,
      product_uom_id: dto.product_uom_id ?? null,
      valid_from: dto.valid_from ? new Date(dto.valid_from) : null,
      valid_to: dto.valid_to ? new Date(dto.valid_to) : null,
    });

    const saved = await this.productDiscountRepository.save(discount);
    return this.findOne(saved.id, productId, tenantId);
  }

  async findAll(productId: string, tenantId: string): Promise<ProductDiscount[]> {
    await this.assertProductOwnership(productId, tenantId);

    return this.productDiscountRepository.find({
      where: { product_id: productId },
      relations: ['product_uom', 'product_uom.uom'],
      order: { created_at: 'ASC' },
    });
  }

  async findApplicableForProductUom(
    productId: string,
    productUomId: string,
    tenantId: string,
  ) {
    const discounts = await this.findAll(productId, tenantId);
    return discounts
      .filter((discount) => isProductDiscountApplicable(discount, productUomId))
      .map(mapApplicableProductDiscount);
  }

  async findOne(id: string, productId: string, tenantId: string): Promise<ProductDiscount> {
    await this.assertProductOwnership(productId, tenantId);

    const discount = await this.productDiscountRepository.findOne({
      where: { id, product_id: productId },
      relations: ['product_uom', 'product_uom.uom'],
    });
    if (!discount) {
      throw new NotFoundException(`Descuento con ID ${id} no encontrado`);
    }
    return discount;
  }

  async findByIdForOrder(id: string, productId: string, tenantId: string): Promise<ProductDiscount> {
    const discount = await this.productDiscountRepository
      .createQueryBuilder('discount')
      .innerJoin('discount.product', 'product')
      .where('discount.id = :id', { id })
      .andWhere('discount.product_id = :productId', { productId })
      .andWhere('product.tenant_id = :tenantId', { tenantId })
      .getOne();

    if (!discount) {
      throw new NotFoundException(`Descuento con ID ${id} no encontrado`);
    }
    return discount;
  }

  async update(
    id: string,
    productId: string,
    dto: UpdateProductDiscountDto,
    tenantId: string,
  ): Promise<ProductDiscount> {
    const discount = await this.findOne(id, productId, tenantId);

    const nextType = dto.discount_type ?? discount.discount_type;
    const nextValue = dto.value ?? Number(discount.value);
    this.validateDiscountValue(nextType, nextValue);
    this.validateDateRange(
      dto.valid_from ?? (discount.valid_from ? discount.valid_from.toISOString().slice(0, 10) : null),
      dto.valid_to ?? (discount.valid_to ? discount.valid_to.toISOString().slice(0, 10) : null),
    );

    if (dto.product_uom_id !== undefined) {
      await this.assertProductUom(productId, dto.product_uom_id);
    }

    if (dto.name && dto.name.trim() !== discount.name) {
      const duplicate = await this.productDiscountRepository.findOne({
        where: { product_id: productId, name: dto.name.trim() },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Ya existe un descuento con ese nombre para este producto');
      }
    }

    Object.assign(discount, {
      ...dto,
      name: dto.name?.trim() ?? discount.name,
      valid_from:
        dto.valid_from !== undefined
          ? dto.valid_from
            ? new Date(dto.valid_from)
            : null
          : discount.valid_from,
      valid_to:
        dto.valid_to !== undefined
          ? dto.valid_to
            ? new Date(dto.valid_to)
            : null
          : discount.valid_to,
      product_uom_id:
        dto.product_uom_id !== undefined ? dto.product_uom_id ?? null : discount.product_uom_id,
    });

    await this.productDiscountRepository.save(discount);
    return this.findOne(id, productId, tenantId);
  }

  async remove(id: string, productId: string, tenantId: string): Promise<void> {
    const discount = await this.findOne(id, productId, tenantId);
    await this.productDiscountRepository.remove(discount);
  }
}
