import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { ProductPhotoService } from '../services/product-photo.service';
import { UploadProductPhotoDto } from '../dto/upload-product-photo.dto';
import { UpdateProductPhotoDto } from '../dto/update-product-photo.dto';
import { ReorderProductPhotosDto } from '../dto/reorder-product-photos.dto';
import { ProductPhoto } from '../../../entities/products/product-photo.entity';

@Controller('products/:productId/photos')
export class ProductPhotoController {
  constructor(private photoService: ProductPhotoService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadProductPhotoDto,
    @Req() req: any,
  ): Promise<ProductPhoto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const tenantId = req.user?.tenant_id || 'default';
    return this.photoService.uploadPhoto(tenantId, productId, file, dto.alt_text);
  }

  @Get()
  async list(@Param('productId') productId: string): Promise<ProductPhoto[]> {
    return this.photoService.getPhotosByProduct(productId);
  }

  @Get('primary')
  async getPrimary(@Param('productId') productId: string): Promise<ProductPhoto | null> {
    return this.photoService.getPrimaryPhoto(productId);
  }

  @Get(':photoId')
  async getById(@Param('photoId') photoId: string): Promise<ProductPhoto> {
    return this.photoService.getPhoto(photoId);
  }

  @Get(':photoId/signed-url')
  async getSignedUrl(
    @Param('photoId') photoId: string,
  ): Promise<{ signed_url: string }> {
    const signedUrl = await this.photoService.getPhotoSignedUrl(photoId);
    return { signed_url: signedUrl };
  }

  @Patch(':photoId')
  async update(
    @Param('photoId') photoId: string,
    @Body() dto: UpdateProductPhotoDto,
  ): Promise<ProductPhoto | null> {
    return this.photoService.updatePhoto(photoId, dto);
  }

  @Post('reorder')
  async reorder(
    @Param('productId') productId: string,
    @Body() dto: ReorderProductPhotosDto,
  ): Promise<ProductPhoto[]> {
    return this.photoService.reorderPhotos(productId, dto.photo_ids);
  }

  @Delete(':photoId')
  async delete(@Param('photoId') photoId: string): Promise<void> {
    return this.photoService.deletePhoto(photoId);
  }
}
