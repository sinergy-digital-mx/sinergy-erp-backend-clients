import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { PaginatedProductDto } from './dto/paginated-product.dto';
import { ToggleStatusDto } from './dto/toggle-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('tenant/products')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @RequirePermission('Product', 'Create')
  @ApiOperation({ summary: 'Crear nuevo producto' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El SKU ya existe' })
  create(@Body() dto: CreateProductDto, @Request() req) {
    return this.productService.create(dto, req.user.tenant_id);
  }

  @Get()
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Listar productos' })
  @ApiResponse({ status: 200, type: PaginatedProductDto })
  findAll(@Query() query: QueryProductDto, @Request() req) {
    return this.productService.findAll(query, req.user.tenant_id);
  }

  @Get(':id')
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.productService.findOne(id, req.user.tenant_id);
  }

  @Patch(':id')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiResponse({ status: 200, description: 'Producto actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Request() req) {
    return this.productService.update(id, dto, req.user.tenant_id);
  }

  @Patch(':id/status')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Cambiar estado activo/inactivo del producto' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  toggleStatus(@Param('id') id: string, @Body() dto: ToggleStatusDto, @Request() req) {
    return this.productService.toggleStatus(id, dto, req.user.tenant_id);
  }

  @Delete(':id')
  @RequirePermission('Product', 'Delete')
  @ApiOperation({ summary: 'Eliminar producto' })
  @ApiResponse({ status: 200, description: 'Producto eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  remove(@Param('id') id: string, @Request() req) {
    return this.productService.remove(id, req.user.tenant_id);
  }

  @Post(':id/photo')
  @RequirePermission('Product', 'Update')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir foto del producto' })
  @ApiResponse({ status: 200, description: 'Foto subida exitosamente' })
  uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.productService.uploadPhoto(id, req.user.tenant_id, file);
  }
}
