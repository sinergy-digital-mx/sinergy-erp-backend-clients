import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceList } from '../../entities/products/price-list.entity';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { QueryPriceListDto } from './dto/query-price-list.dto';

@Injectable()
export class PriceListService {
  constructor(
    @InjectRepository(PriceList)
    private readonly priceListRepository: Repository<PriceList>,
    @InjectRepository(ProductPrice)
    private readonly productPriceRepository: Repository<ProductPrice>,
  ) {}

  /**
   * Create a new price list
   */
  async create(dto: CreatePriceListDto, tenantId: string): Promise<PriceList> {
    // If this is set as default, unset other defaults
    if (dto.is_default) {
      await this.priceListRepository.update(
        { tenant_id: tenantId, is_default: true },
        { is_default: false }
      );
    }

    const priceList = this.priceListRepository.create({
      ...dto,
      tenant_id: tenantId,
      valid_from: dto.valid_from ? new Date(dto.valid_from) : null,
      valid_to: dto.valid_to ? new Date(dto.valid_to) : null,
    });

    try {
      return await this.priceListRepository.save(priceList);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new BadRequestException('A price list with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Find all price lists for a tenant
   */
  async findAll(tenantId: string, query?: QueryPriceListDto) {
    const page = query?.page || 1;
    const limit = Math.min(query?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.priceListRepository
      .createQueryBuilder('price_list')
      .where('price_list.tenant_id = :tenantId', { tenantId });

    if (query?.search) {
      queryBuilder.andWhere('LOWER(price_list.name) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    if (query?.is_active !== undefined) {
      queryBuilder.andWhere('price_list.is_active = :is_active', {
        is_active: query.is_active,
      });
    }

    if (query?.is_default !== undefined) {
      queryBuilder.andWhere('price_list.is_default = :is_default', {
        is_default: query.is_default,
      });
    }

    queryBuilder.orderBy('price_list.is_default', 'DESC');
    queryBuilder.addOrderBy('price_list.name', 'ASC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder.skip(skip).take(limit).getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  /**
   * Find one price list by ID
   */
  async findOne(id: string, tenantId: string): Promise<PriceList> {
    const priceList = await this.priceListRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['product_prices', 'product_prices.product'],
    });

    if (!priceList) {
      throw new NotFoundException('Price list not found');
    }

    return priceList;
  }

  /**
   * Get default price list for tenant
   */
  async getDefault(tenantId: string): Promise<PriceList | null> {
    return this.priceListRepository.findOne({
      where: { tenant_id: tenantId, is_default: true, is_active: true },
    });
  }

  /**
   * Update a price list
   */
  async update(id: string, dto: UpdatePriceListDto, tenantId: string): Promise<PriceList> {
    const priceList = await this.findOne(id, tenantId);

    // If setting as default, unset other defaults
    if (dto.is_default && !priceList.is_default) {
      await this.priceListRepository.update(
        { tenant_id: tenantId, is_default: true },
        { is_default: false }
      );
    }

    Object.assign(priceList, {
      ...dto,
      valid_from: dto.valid_from ? new Date(dto.valid_from) : priceList.valid_from,
      valid_to: dto.valid_to ? new Date(dto.valid_to) : priceList.valid_to,
    });

    try {
      return await this.priceListRepository.save(priceList);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new BadRequestException('A price list with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Delete a price list
   */
  async remove(id: string, tenantId: string): Promise<void> {
    const priceList = await this.findOne(id, tenantId);
    
    if (priceList.is_default) {
      throw new BadRequestException('Cannot delete default price list');
    }

    await this.priceListRepository.remove(priceList);
  }

  /**
   * Add product price to price list
   */
  async addProductPrice(dto: CreateProductPriceDto, tenantId: string): Promise<ProductPrice> {
    // Check if price already exists
    const existing = await this.productPriceRepository.findOne({
      where: {
        product_id: dto.product_id,
        price_list_id: dto.price_list_id,
        tenant_id: tenantId,
      },
    });

    if (existing) {
      throw new BadRequestException('Price already exists for this product in this price list');
    }

    const productPrice = this.productPriceRepository.create({
      ...dto,
      tenant_id: tenantId,
      valid_from: dto.valid_from ? new Date(dto.valid_from) : null,
      valid_to: dto.valid_to ? new Date(dto.valid_to) : null,
    });

    return this.productPriceRepository.save(productPrice);
  }

  /**
   * Update product price
   */
  async updateProductPrice(
    id: string,
    dto: UpdateProductPriceDto,
    tenantId: string,
  ): Promise<ProductPrice> {
    const productPrice = await this.productPriceRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!productPrice) {
      throw new NotFoundException('Product price not found');
    }

    Object.assign(productPrice, {
      ...dto,
      valid_from: dto.valid_from ? new Date(dto.valid_from) : productPrice.valid_from,
      valid_to: dto.valid_to ? new Date(dto.valid_to) : productPrice.valid_to,
    });

    return this.productPriceRepository.save(productPrice);
  }

  /**
   * Remove product price
   */
  async removeProductPrice(id: string, tenantId: string): Promise<void> {
    const productPrice = await this.productPriceRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!productPrice) {
      throw new NotFoundException('Product price not found');
    }

    await this.productPriceRepository.remove(productPrice);
  }

  /**
   * Get product price from a specific price list
   */
  async getProductPrice(
    productId: string,
    priceListId: string,
    tenantId: string,
  ): Promise<number> {
    const productPrice = await this.productPriceRepository.findOne({
      where: {
        product_id: productId,
        price_list_id: priceListId,
        tenant_id: tenantId,
        is_active: true,
      },
    });

    if (!productPrice) {
      throw new NotFoundException('Price not found for this product in this price list');
    }

    // Check if price is within valid date range
    const now = new Date();
    if (productPrice.valid_from && new Date(productPrice.valid_from) > now) {
      throw new BadRequestException('Price is not yet valid');
    }
    if (productPrice.valid_to && new Date(productPrice.valid_to) < now) {
      throw new BadRequestException('Price has expired');
    }

    // Apply discount if any
    const finalPrice = productPrice.price * (1 - productPrice.discount_percentage / 100);
    return Number(finalPrice.toFixed(2));
  }

  /**
   * Get all prices for a product across all price lists
   */
  async getProductPrices(productId: string, tenantId: string) {
    return this.productPriceRepository.find({
      where: { product_id: productId, tenant_id: tenantId },
      relations: ['price_list'],
      order: { price_list: { is_default: 'DESC' } },
    });
  }
}
