import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductPhoto } from '../../../entities/products/product-photo.entity';

@Injectable()
export class ProductPhotoRepository extends Repository<ProductPhoto> {
  constructor(private dataSource: DataSource) {
    super(ProductPhoto, dataSource.createEntityManager());
  }

  async createPhoto(data: Partial<ProductPhoto>): Promise<ProductPhoto> {
    const photo = this.dataSource.getRepository(ProductPhoto).create(data);
    return this.dataSource.getRepository(ProductPhoto).save(photo);
  }

  async findById(id: string): Promise<ProductPhoto | null> {
    return this.dataSource.getRepository(ProductPhoto).findOne({
      where: { id },
    });
  }

  async findByProduct(productId: string): Promise<ProductPhoto[]> {
    return this.dataSource.getRepository(ProductPhoto).find({
      where: { product_id: productId },
      order: { display_order: 'ASC', created_at: 'DESC' },
    });
  }

  async findPrimaryByProduct(productId: string): Promise<ProductPhoto | null> {
    return this.dataSource.getRepository(ProductPhoto).findOne({
      where: { product_id: productId, is_primary: true },
    });
  }

  async updatePhoto(id: string, data: Partial<ProductPhoto>): Promise<ProductPhoto | null> {
    await this.dataSource.getRepository(ProductPhoto).update(id, data);
    return this.findById(id);
  }

  async deletePhoto(id: string): Promise<void> {
    await this.dataSource.getRepository(ProductPhoto).delete(id);
  }

  async deleteByS3Key(s3Key: string): Promise<void> {
    await this.dataSource.getRepository(ProductPhoto).delete({ s3_key: s3Key });
  }
}
