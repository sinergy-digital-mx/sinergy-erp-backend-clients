import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductPriceService } from './product-price.service';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('Product Prices')
@ApiBearerAuth()
@Controller('tenant/products/:productId/prices')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductPriceController {
  constructor(private readonly productPriceService: ProductPriceService) {}

  @Post()
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Agregar precio al producto' })
  @ApiResponse({ status: 201, description: 'Precio agregado' })
  create(@Param('productId') productId: string, @Body() dto: CreateProductPriceDto, @Request() req) {
    return this.productPriceService.create(productId, dto, req.user.tenant_id);
  }

  @Get()
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Listar precios del producto' })
  @ApiResponse({ status: 200, description: 'Precios obtenidos' })
  findAll(@Param('productId') productId: string, @Request() req) {
    return this.productPriceService.findAll(productId, req.user.tenant_id);
  }

  @Get(':id')
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Obtener precio específico' })
  @ApiResponse({ status: 200, description: 'Precio encontrado' })
  findOne(@Param('productId') productId: string, @Param('id') id: string, @Request() req) {
    return this.productPriceService.findOne(id, productId, req.user.tenant_id);
  }

  @Patch(':id')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Actualizar precio' })
  @ApiResponse({ status: 200, description: 'Precio actualizado' })
  update(
    @Param('productId') productId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductPriceDto,
    @Request() req,
  ) {
    return this.productPriceService.update(id, productId, dto, req.user.tenant_id);
  }

  @Delete(':id')
  @RequirePermission('Product', 'Delete')
  @ApiOperation({ summary: 'Eliminar precio' })
  @ApiResponse({ status: 200, description: 'Precio eliminado' })
  remove(@Param('productId') productId: string, @Param('id') id: string, @Request() req) {
    return this.productPriceService.remove(id, productId, req.user.tenant_id);
  }
}
