import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductUoM } from '../../entities/products/product-uom.entity';
import { Product } from '../../entities/products/product.entity';
import { CreateProductUoMDto } from './dto/create-product-uom.dto';
import { UpdateProductUoMDto } from './dto/update-product-uom.dto';
import { UoMCatalogService } from '../uom-catalog/uom-catalog.service';
import { QueryUoMCatalogDto } from '../uom-catalog/dto/query-uom-catalog.dto';
import { PaginatedUoMCatalogDto } from '../uom-catalog/dto/paginated-uom-catalog.dto';

@Injectable()
export class ProductUoMService {
  constructor(
    @InjectRepository(ProductUoM)
    private readonly productUoMRepository: Repository<ProductUoM>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly uomCatalogService: UoMCatalogService,
  ) {}

  async create(productId: string, dto: CreateProductUoMDto, tenantId: string): Promise<ProductUoM> {
    // Verificar que el producto existe y pertenece al tenant
    const product = await this.productRepository.findOne({
      where: { id: productId, tenant_id: tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    // Verificar que no exista ya esta UoM para este producto
    const existing = await this.productUoMRepository.findOne({
      where: { product_id: productId, uom_catalog_id: dto.uom_catalog_id },
    });

    if (existing) {
      throw new ConflictException('Esta UoM ya está asignada a este producto');
    }

    // Si es base, verificar que no haya otra base
    if (dto.is_base) {
      const existingBase = await this.productUoMRepository.findOne({
        where: { product_id: productId, is_base: true },
      });

      if (existingBase) {
        throw new ConflictException('Ya existe una UoM base para este producto');
      }
    }

    const parentUomCatalogId = await this.resolveParentUomCatalogId(
      productId,
      dto.parent_uom_id,
      dto.uom_catalog_id,
      tenantId,
    );

    const productUoM = this.productUoMRepository.create({
      uom_catalog_id: dto.uom_catalog_id,
      factor: dto.factor,
      is_base: dto.is_base,
      parent_uom_id: parentUomCatalogId,
      product_id: productId,
    });

    return await this.productUoMRepository.save(productUoM);
  }

  /**
   * Catálogo UoM del tenant (misma forma que GET /api/uom-catalog) para pantallas de asignación.
   * Evita que GET .../uoms/catalog sea interpretado como GET .../uoms/:id con id=catalog.
   */
  async findCatalogForProduct(
    productId: string,
    query: QueryUoMCatalogDto,
    tenantId: string,
  ): Promise<PaginatedUoMCatalogDto> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenant_id: tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    return this.uomCatalogService.findAll(query, tenantId);
  }

  async findAll(productId: string, tenantId: string): Promise<ProductUoM[]> {
    // Verificar que el producto existe y pertenece al tenant
    const product = await this.productRepository.findOne({
      where: { id: productId, tenant_id: tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    return await this.productUoMRepository.find({
      where: { product_id: productId },
      relations: ['uom', 'parent_uom'],
      order: { is_base: 'DESC', created_at: 'ASC' },
    });
  }

  async findOne(id: string, productId: string, tenantId: string): Promise<ProductUoM> {
    // Verificar que el producto existe y pertenece al tenant
    const product = await this.productRepository.findOne({
      where: { id: productId, tenant_id: tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    const productUoM = await this.productUoMRepository.findOne({
      where: { id, product_id: productId },
      relations: ['uom', 'parent_uom'],
    });

    if (!productUoM) {
      throw new NotFoundException(`UoM con ID ${id} no encontrada para este producto`);
    }

    return productUoM;
  }

  async update(id: string, productId: string, dto: UpdateProductUoMDto, tenantId: string): Promise<ProductUoM> {
    const productUoM = await this.findOne(id, productId, tenantId);

    // Si se está cambiando a base, verificar que no haya otra base
    if (dto.is_base && !productUoM.is_base) {
      const existingBase = await this.productUoMRepository.findOne({
        where: { product_id: productId, is_base: true },
      });

      if (existingBase) {
        throw new ConflictException('Ya existe una UoM base para este producto');
      }
    }

    if (dto.uom_catalog_id !== undefined && dto.uom_catalog_id !== productUoM.uom_catalog_id) {
      await this.uomCatalogService.findOne(dto.uom_catalog_id, tenantId);

      const duplicate = await this.productUoMRepository.findOne({
        where: { product_id: productId, uom_catalog_id: dto.uom_catalog_id },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Esta UoM del catálogo ya está asignada a este producto');
      }
    }

    // No usar save() sobre la entidad con relación `uom` cargada: TypeORM puede persistir el
    // FK viejo desde la referencia en memoria y anular un cambio de uom_catalog_id.
    const patch: Partial<Pick<ProductUoM, 'uom_catalog_id' | 'factor' | 'is_base' | 'parent_uom_id'>> = {};
    if (dto.uom_catalog_id !== undefined) patch.uom_catalog_id = dto.uom_catalog_id;
    if (dto.factor !== undefined) patch.factor = dto.factor;
    if (dto.is_base !== undefined) patch.is_base = dto.is_base;

    if (dto.parent_uom_id !== undefined) {
      const nextCatalogId = dto.uom_catalog_id ?? productUoM.uom_catalog_id;
      patch.parent_uom_id = await this.resolveParentUomCatalogId(
        productId,
        dto.parent_uom_id,
        nextCatalogId,
        tenantId,
        id,
      );
    }

    if (Object.keys(patch).length > 0) {
      await this.productUoMRepository.update({ id, product_id: productId }, patch);
    }

    return this.findOne(id, productId, tenantId);
  }

  async remove(id: string, productId: string, tenantId: string): Promise<void> {
    const productUoM = await this.findOne(id, productId, tenantId);
    
    if (productUoM.is_base) {
      throw new BadRequestException('No se puede eliminar la UoM base del producto');
    }

    await this.productUoMRepository.remove(productUoM);
  }

  /**
   * `parent_uom_id` en BD referencia `uom_catalog.id`.
   * La UI suele enviar el id de la fila en `product_uoms` del padre; se resuelve a su `uom_catalog_id`.
   * También se acepta directamente un `uom_catalog.id`.
   */
  private async resolveParentUomCatalogId(
    productId: string,
    parentUomId: string | null | undefined,
    childUomCatalogId: string,
    tenantId: string,
    currentProductUomId?: string,
  ): Promise<string | null> {
    if (parentUomId === undefined || parentUomId === null || parentUomId === '') {
      return null;
    }

    if (currentProductUomId && parentUomId === currentProductUomId) {
      throw new BadRequestException('Una UoM no puede ser padre de sí misma');
    }

    const parentAsProductUom = await this.productUoMRepository.findOne({
      where: { id: parentUomId, product_id: productId },
    });

    if (parentAsProductUom) {
      if (parentAsProductUom.uom_catalog_id === childUomCatalogId) {
        throw new BadRequestException('Una UoM no puede ser padre de sí misma');
      }
      return parentAsProductUom.uom_catalog_id;
    }

    try {
      await this.uomCatalogService.findOne(parentUomId, tenantId);
    } catch {
      throw new BadRequestException(
        'parent_uom_id debe ser el id de otra UoM del mismo producto (product_uoms.id) ' +
          'o un id válido del catálogo (uom_catalog.id)',
      );
    }

    if (parentUomId === childUomCatalogId) {
      throw new BadRequestException('Una UoM no puede ser padre de sí misma');
    }

    return parentUomId;
  }
}
