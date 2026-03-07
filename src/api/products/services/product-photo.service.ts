import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { Express } from 'express';
import { ProductPhotoRepository } from '../repositories/product-photo.repository';
import { S3Service } from '../../../common/services/s3.service';
import { ProductPhoto } from '../../../entities/products/product-photo.entity';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class ProductPhotoService {
  constructor(
    private photoRepository: ProductPhotoRepository,
    private s3Service: S3Service,
  ) {}

  async uploadPhoto(
    tenantId: string,
    productId: string,
    file: Express.Multer.File,
    altText?: string,
  ): Promise<ProductPhoto> {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Upload to S3
    const s3Key = await this.s3Service.uploadFile(
      tenantId,
      productId,
      'photos',
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // Create database record
    const photo = await this.photoRepository.createPhoto({
      tenant_id: tenantId,
      product_id: productId,
      file_name: file.originalname,
      s3_key: s3Key,
      mime_type: file.mimetype,
      file_size: file.size,
      alt_text: altText,
      display_order: 0,
      is_primary: false,
    });

    return photo;
  }

  async getPhoto(id: string): Promise<ProductPhoto> {
    const photo = await this.photoRepository.findById(id);
    if (!photo) {
      throw new NotFoundException(`Product photo with ID ${id} not found`);
    }
    return photo;
  }

  async getPhotosByProduct(productId: string): Promise<ProductPhoto[]> {
    return this.photoRepository.findByProduct(productId);
  }

  async getPrimaryPhoto(productId: string): Promise<ProductPhoto | null> {
    return this.photoRepository.findPrimaryByProduct(productId);
  }

  async updatePhoto(
    id: string,
    updates: Partial<{
      alt_text: string;
      display_order: number;
      is_primary: boolean;
    }>,
  ): Promise<ProductPhoto | null> {
    const photo = await this.getPhoto(id);

    // If setting as primary, unset other primary photos for this product
    if (updates.is_primary === true) {
      const currentPrimary = await this.photoRepository.findPrimaryByProduct(
        photo.product_id,
      );
      if (currentPrimary && currentPrimary.id !== id) {
        await this.photoRepository.updatePhoto(currentPrimary.id, { is_primary: false });
      }
    }

    return this.photoRepository.updatePhoto(id, updates);
  }

  async deletePhoto(id: string): Promise<void> {
    const photo = await this.getPhoto(id);

    // Delete from S3
    await this.s3Service.deleteFile(photo.s3_key);

    // Delete from database
    await this.photoRepository.delete(id);
  }

  async getPhotoSignedUrl(id: string, expiresIn: number = 3600): Promise<string> {
    const photo = await this.getPhoto(id);
    return this.s3Service.getSignedUrl(photo.s3_key, expiresIn);
  }

  async reorderPhotos(
    productId: string,
    photoIds: string[],
  ): Promise<ProductPhoto[]> {
    // Validate all photos belong to the product
    const photos = await this.photoRepository.findByProduct(productId);
    const photoMap = new Map(photos.map((p) => [p.id, p]));

    for (const photoId of photoIds) {
      if (!photoMap.has(photoId)) {
        throw new BadRequestException(
          `Photo ${photoId} does not belong to product ${productId}`,
        );
      }
    }

    // Update display order
    const updatedPhotos: ProductPhoto[] = [];
    for (let i = 0; i < photoIds.length; i++) {
      const updated = await this.photoRepository.updatePhoto(photoIds[i], {
        display_order: i,
      });
      if (updated) {
        updatedPhotos.push(updated);
      }
    }

    return updatedPhotos;
  }
}
