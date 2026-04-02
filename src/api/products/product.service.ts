import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from '../../entities/products/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { PaginatedProductDto } from './dto/paginated-product.dto';
import { ToggleStatusDto } from './dto/toggle-status.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto, tenantId: string): Promise<Product> {
    // Verificar que el SKU no exista para este tenant
    const existing = await this.productRepository.findOne({
      where: { tenant_id: tenantId, sku: dto.sku },
    });

    if (existing) {
      throw new ConflictException(`Producto con SKU "${dto.sku}" ya existe para este tenant`);
    }

    const product = this.productRepository.create({
      ...dto,
      tenant_id: tenantId,
      is_active: true,
    });

    return await this.productRepository.save(product);
  }

  async findAll(query: QueryProductDto, tenantId: string): Promise<PaginatedProductDto> {
    const { page = 1, limit = 10, sku, name, category_id, subcategory_id, is_active } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId };

    if (sku) {
      where.sku = Like(`%${sku}%`);
    }

    if (name) {
      where.name = Like(`%${name}%`);
    }

    if (category_id) {
      where.category_id = category_id;
    }

    if (subcategory_id) {
      where.subcategory_id = subcategory_id;
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const [data, total] = await this.productRepository.findAndCount({
      where,
      relations: ['category', 'subcategory'],
      skip,
      take: limit,
      order: { name: 'ASC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, tenantId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['category', 'subcategory'],
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, tenantId: string): Promise<Product> {
    const product = await this.findOne(id, tenantId);

    // Si se está actualizando el SKU, verificar que no exista
    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.productRepository.findOne({
        where: { tenant_id: tenantId, sku: dto.sku },
      });

      if (existing) {
        throw new ConflictException(`Producto con SKU "${dto.sku}" ya existe para este tenant`);
      }
    }

    // Usar update en lugar de save para forzar la actualización
    await this.productRepository.update(
      { id, tenant_id: tenantId },
      dto
    );
    
    // Recargar con relaciones actualizadas
    return await this.findOne(id, tenantId);
  }

  async toggleStatus(id: string, dto: ToggleStatusDto, tenantId: string): Promise<Product> {
    const product = await this.findOne(id, tenantId);
    product.is_active = dto.is_active;
    return await this.productRepository.save(product);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const product = await this.findOne(id, tenantId);
    await this.productRepository.remove(product);
  }
}
