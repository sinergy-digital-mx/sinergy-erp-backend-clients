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
import { ProductVendorCostService } from './product-vendor-cost.service';
import { CreateProductVendorCostDto } from './dto/create-product-vendor-cost.dto';
import { UpdateProductVendorCostDto } from './dto/update-product-vendor-cost.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('Product Vendor Costs')
@ApiBearerAuth()
@Controller('tenant/products/:productId/vendor-costs')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductVendorCostController {
  constructor(private readonly productVendorCostService: ProductVendorCostService) {}

  @Post()
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Agregar costo de proveedor al producto' })
  @ApiResponse({ status: 201, description: 'Costo agregado' })
  create(@Param('productId') productId: string, @Body() dto: CreateProductVendorCostDto, @Request() req) {
    return this.productVendorCostService.create(productId, dto, req.user.tenant_id);
  }

  @Get()
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Listar costos de proveedores del producto' })
  @ApiResponse({ status: 200, description: 'Costos obtenidos' })
  findAll(@Param('productId') productId: string, @Request() req) {
    return this.productVendorCostService.findAll(productId, req.user.tenant_id);
  }

  @Get(':id')
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Obtener costo específico' })
  @ApiResponse({ status: 200, description: 'Costo encontrado' })
  findOne(@Param('productId') productId: string, @Param('id') id: string, @Request() req) {
    return this.productVendorCostService.findOne(id, productId, req.user.tenant_id);
  }

  @Patch(':id')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Actualizar costo de proveedor' })
  @ApiResponse({ status: 200, description: 'Costo actualizado' })
  update(
    @Param('productId') productId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductVendorCostDto,
    @Request() req,
  ) {
    return this.productVendorCostService.update(id, productId, dto, req.user.tenant_id);
  }

  @Delete(':id')
  @RequirePermission('Product', 'Delete')
  @ApiOperation({ summary: 'Eliminar costo de proveedor' })
  @ApiResponse({ status: 200, description: 'Costo eliminado' })
  remove(@Param('productId') productId: string, @Param('id') id: string, @Request() req) {
    return this.productVendorCostService.remove(id, productId, req.user.tenant_id);
  }
}
