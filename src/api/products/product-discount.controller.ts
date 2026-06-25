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
import { ProductDiscountService } from './product-discount.service';
import { CreateProductDiscountDto } from './dto/create-product-discount.dto';
import { UpdateProductDiscountDto } from './dto/update-product-discount.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('Product Discounts')
@ApiBearerAuth()
@Controller('tenant/products/:productId/discounts')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductDiscountController {
  constructor(private readonly productDiscountService: ProductDiscountService) {}

  @Post()
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Agregar descuento al producto' })
  @ApiResponse({ status: 201, description: 'Descuento agregado' })
  create(@Param('productId') productId: string, @Body() dto: CreateProductDiscountDto, @Request() req) {
    return this.productDiscountService.create(productId, dto, req.user.tenant_id);
  }

  @Get()
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Listar descuentos del producto' })
  @ApiResponse({ status: 200, description: 'Descuentos obtenidos' })
  findAll(@Param('productId') productId: string, @Request() req) {
    return this.productDiscountService.findAll(productId, req.user.tenant_id);
  }

  @Get(':id')
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Obtener descuento específico' })
  @ApiResponse({ status: 200, description: 'Descuento encontrado' })
  findOne(@Param('productId') productId: string, @Param('id') id: string, @Request() req) {
    return this.productDiscountService.findOne(id, productId, req.user.tenant_id);
  }

  @Patch(':id')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Actualizar descuento' })
  @ApiResponse({ status: 200, description: 'Descuento actualizado' })
  update(
    @Param('productId') productId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDiscountDto,
    @Request() req,
  ) {
    return this.productDiscountService.update(id, productId, dto, req.user.tenant_id);
  }

  @Delete(':id')
  @RequirePermission('Product', 'Delete')
  @ApiOperation({ summary: 'Eliminar descuento' })
  @ApiResponse({ status: 200, description: 'Descuento eliminado' })
  remove(@Param('productId') productId: string, @Param('id') id: string, @Request() req) {
    return this.productDiscountService.remove(id, productId, req.user.tenant_id);
  }
}
