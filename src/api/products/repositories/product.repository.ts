import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../entities/products/product.entity';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private repo: Repository<Product>,
  ) {}

  async create(product: Partial<Product>): Promise<Product> {
    const newProduct = this.repo.create(product);
    return this.repo.save(newProduct);
  }

  async findById(id: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['uoms', 'uom_relationships', 'vendor_prices', 'photos'],
    });
  }

  async findBySku(sku: string, tenantId: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { sku, tenant_id: tenantId },
    });
  }

  async findByTenant(tenantId: string): Promise<Product[]> {
    return this.repo.find({
      where: { tenant_id: tenantId },
      relations: ['uoms', 'uom_relationships', 'vendor_prices', 'photos'],
    });
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    await this.repo.update(id, updates);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findByCategory(tenantId: string, categoryId: string): Promise<Product[]> {
    return this.repo.find({
      where: { tenant_id: tenantId, category_id: categoryId },
      relations: ['uoms', 'uom_relationships', 'vendor_prices', 'photos'],
    });
  }

  async findBySubcategory(tenantId: string, subcategoryId: string): Promise<Product[]> {
    return this.repo.find({
      where: { tenant_id: tenantId, subcategory_id: subcategoryId },
      relations: ['uoms', 'uom_relationships', 'vendor_prices', 'photos'],
    });
  }
}
