import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { Product } from '../../../entities/products/product.entity';

@Injectable()
export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  async createProduct(
    tenantId: string,
    sku: string,
    name: string,
    description?: string,
    categoryId?: string,
    subcategoryId?: string,
    baseUomId?: string,
  ): Promise<Product> {
    // Validate SKU is not empty
    if (!sku || sku.trim().length === 0) {
      throw new BadRequestException('SKU cannot be empty');
    }

    // Validate name is not empty
    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Name cannot be empty');
    }

    // Check SKU uniqueness per tenant
    const existingProduct = await this.productRepository.findBySku(sku, tenantId);
    if (existingProduct) {
      throw new ConflictException('A product with this SKU already exists');
    }

    // Note: Category and subcategory validation is handled by database foreign key constraints
    // If they don't exist or don't belong to tenant, the database will reject the insert

    return this.productRepository.create({
      tenant_id: tenantId,
      sku,
      name,
      description,
      category_id: categoryId || null,
      subcategory_id: subcategoryId || null,
      base_uom_id: baseUomId || null,
    });
  }

  async getProduct(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async getProductBySku(sku: string, tenantId: string): Promise<Product> {
    const product = await this.productRepository.findBySku(sku, tenantId);
    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }
    return product;
  }

  async updateProduct(
    id: string,
    updates: Partial<{
      sku: string;
      name: string;
      description: string;
      category_id: string | null;
      subcategory_id: string | null;
      base_uom_id: string | null;
    }>,
    tenantId: string,
  ): Promise<Product | null> {
    const product = await this.getProduct(id);

    // If SKU is being updated, check uniqueness
    if (updates.sku && updates.sku !== product.sku) {
      if (!updates.sku || updates.sku.trim().length === 0) {
        throw new BadRequestException('SKU cannot be empty');
      }
      const existingProduct = await this.productRepository.findBySku(updates.sku, tenantId);
      if (existingProduct) {
        throw new ConflictException('A product with this SKU already exists');
      }
    }

    // If name is being updated, validate it
    if (updates.name && updates.name.trim().length === 0) {
      throw new BadRequestException('Name cannot be empty');
    }

    // Convert empty strings to null for category_id
    if (updates.category_id !== undefined) {
      if (updates.category_id === '') {
        updates.category_id = null;
      }
    }

    // Convert empty strings to null for subcategory_id
    if (updates.subcategory_id !== undefined) {
      if (updates.subcategory_id === '') {
        updates.subcategory_id = null;
      }
    }

    // Convert empty strings to null for base_uom_id
    if (updates.base_uom_id !== undefined) {
      if (updates.base_uom_id === '') {
        updates.base_uom_id = null;
      }
    }

    return this.productRepository.update(id, updates);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.getProduct(id);
    await this.productRepository.delete(id);
  }

  async listProducts(tenantId: string): Promise<Product[]> {
    return this.productRepository.findByTenant(tenantId);
  }

  async listProductsByCategory(tenantId: string, categoryId: string): Promise<Product[]> {
    return this.productRepository.findByCategory(tenantId, categoryId);
  }

  async listProductsBySubcategory(tenantId: string, subcategoryId: string): Promise<Product[]> {
    return this.productRepository.findBySubcategory(tenantId, subcategoryId);
  }
}
