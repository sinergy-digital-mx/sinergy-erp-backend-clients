import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from '../../entities/products/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { PaginatedProductDto } from './dto/paginated-product.dto';
import { ToggleStatusDto } from './dto/toggle-status.dto';
import { S3Service } from '../../common/services/s3.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly s3Service: S3Service,
  ) {}

  private extractAllowedProductFields(dto: Partial<CreateProductDto & UpdateProductDto>) {
    return {
      ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
      ...(dto.external_sku !== undefined ? { external_sku: dto.external_sku } : {}),
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.category_id !== undefined ? { category_id: dto.category_id } : {}),
      ...(dto.subcategory_id !== undefined ? { subcategory_id: dto.subcategory_id } : {}),
    };
  }

  async create(dto: CreateProductDto, tenantId: string): Promise<Product> {
    // Verificar que el SKU no exista para este tenant
    const existing = await this.productRepository.findOne({
      where: { tenant_id: tenantId, sku: dto.sku },
    });

    if (existing) {
      throw new ConflictException(`Producto con SKU "${dto.sku}" ya existe para este tenant`);
    }

    if (dto.external_sku) {
      const existingExternalSku = await this.productRepository.findOne({
        where: { tenant_id: tenantId, external_sku: dto.external_sku },
      });

      if (existingExternalSku) {
        throw new ConflictException(
          `Producto con SKU externo "${dto.external_sku}" ya existe para este tenant`,
        );
      }
    }

    const product = this.productRepository.create({
      ...this.extractAllowedProductFields(dto),
      tenant_id: tenantId,
      is_active: true,
    });

    return await this.productRepository.save(product);
  }

  async findAll(query: QueryProductDto, tenantId: string): Promise<PaginatedProductDto> {
    const { page = 1, limit = 10, sku, external_sku, name, category_id, subcategory_id, is_active } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId };

    if (sku) {
      where.sku = Like(`%${sku}%`);
    }

    if (external_sku) {
      where.external_sku = Like(`%${external_sku}%`);
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
    const dataWithPhotoUrls = await Promise.all(
      data.map((product) => this.toResponseWithPhotoUrl(product)),
    );

    return {
      data: dataWithPhotoUrls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, tenantId: string): Promise<Product> {
    const product = await this.getByIdOrFail(id, tenantId);
    return this.toResponseWithPhotoUrl(product);
  }

  async update(id: string, dto: UpdateProductDto, tenantId: string): Promise<Product> {
    const product = await this.getByIdOrFail(id, tenantId);

    // Si se está actualizando el SKU, verificar que no exista
    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.productRepository.findOne({
        where: { tenant_id: tenantId, sku: dto.sku },
      });

      if (existing) {
        throw new ConflictException(`Producto con SKU "${dto.sku}" ya existe para este tenant`);
      }
    }

    if (dto.external_sku && dto.external_sku !== product.external_sku) {
      const existingExternalSku = await this.productRepository.findOne({
        where: { tenant_id: tenantId, external_sku: dto.external_sku },
      });

      if (existingExternalSku) {
        throw new ConflictException(
          `Producto con SKU externo "${dto.external_sku}" ya existe para este tenant`,
        );
      }
    }

    // Usar update en lugar de save para forzar la actualización
    await this.productRepository.update(
      { id, tenant_id: tenantId },
      this.extractAllowedProductFields(dto),
    );
    
    // Recargar con relaciones actualizadas
    return await this.findOne(id, tenantId);
  }

  async toggleStatus(id: string, dto: ToggleStatusDto, tenantId: string): Promise<Product> {
    const product = await this.getByIdOrFail(id, tenantId);
    product.is_active = dto.is_active;
    const saved = await this.productRepository.save(product);
    return this.toResponseWithPhotoUrl(saved);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const product = await this.getByIdOrFail(id, tenantId);
    await this.productRepository.remove(product);
  }

  async uploadPhoto(id: string, tenantId: string, file: Express.Multer.File): Promise<Product> {
    const product = await this.getByIdOrFail(id, tenantId);

    if (product.photo) {
      await this.s3Service.deleteFile(product.photo).catch(() => undefined);
    }

    const s3Key = await this.s3Service.uploadEntityFile(
      tenantId,
      'products',
      id,
      'photo',
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    product.photo = s3Key;
    const saved = await this.productRepository.save(product);
    return this.toResponseWithPhotoUrl(saved);
  }

  private async getByIdOrFail(id: string, tenantId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['category', 'subcategory'],
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  private async toResponseWithPhotoUrl(product: Product): Promise<Product> {
    if (!product.photo) {
      return product;
    }

    const photoUrl = await this.s3Service
      .getSignedUrl(product.photo, 900)
      .catch(() => product.photo);

    return {
      ...product,
      photo: photoUrl,
    };
  }
}
