import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../../../entities/products/product.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  @RequirePermissions({ entityType: 'Product', action: 'Create' })
  async create(@Body() dto: CreateProductDto, @Req() req: any): Promise<Product> {
    const tenantId = req.user?.tenant_id || 'default';
    return this.productService.createProduct(
      tenantId,
      dto.sku,
      dto.name,
      dto.description,
      dto.category_id,
      dto.subcategory_id
    );
  }

  @Get()
  @RequirePermissions({ entityType: 'Product', action: 'Read' })
  async list(@Req() req: any): Promise<Product[]> {
    const tenantId = req.user?.tenant_id || 'default';
    return this.productService.listProducts(tenantId);
  }

  @Get('sku/:sku')
  @RequirePermissions({ entityType: 'Product', action: 'Read' })
  async getBySku(@Param('sku') sku: string, @Req() req: any): Promise<Product> {
    const tenantId = req.user?.tenant_id || 'default';
    return this.productService.getProductBySku(sku, tenantId);
  }

  @Get('category/:categoryId')
  @RequirePermissions({ entityType: 'Product', action: 'Read' })
  async listByCategory(
    @Param('categoryId') categoryId: string,
    @Req() req: any,
  ): Promise<Product[]> {
    const tenantId = req.user?.tenant_id || 'default';
    return this.productService.listProductsByCategory(tenantId, categoryId);
  }

  @Get('subcategory/:subcategoryId')
  @RequirePermissions({ entityType: 'Product', action: 'Read' })
  async listBySubcategory(
    @Param('subcategoryId') subcategoryId: string,
    @Req() req: any,
  ): Promise<Product[]> {
    const tenantId = req.user?.tenant_id || 'default';
    return this.productService.listProductsBySubcategory(tenantId, subcategoryId);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Product', action: 'Read' })
  async getById(@Param('id') id: string): Promise<Product> {
    return this.productService.getProduct(id);
  }

  @Patch(':id')
  @RequirePermissions({ entityType: 'Product', action: 'Update' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: any,
  ): Promise<Product | null> {
    const tenantId = req.user?.tenant_id || 'default';
    return this.productService.updateProduct(id, dto, tenantId);
  }

  @Delete(':id')
  @RequirePermissions({ entityType: 'Product', action: 'Delete' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.productService.deleteProduct(id);
  }
}
