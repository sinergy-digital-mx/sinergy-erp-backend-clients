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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductUoMService } from './product-uom.service';
import { CreateProductUoMDto } from './dto/create-product-uom.dto';
import { UpdateProductUoMDto } from './dto/update-product-uom.dto';
import { QueryUoMCatalogDto } from '../uom-catalog/dto/query-uom-catalog.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('Product UoMs')
@ApiBearerAuth()
@Controller('tenant/products/:productId/uoms')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductUoMController {
  constructor(private readonly productUoMService: ProductUoMService) {}

  @Post()
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Agregar UoM a producto' })
  @ApiResponse({ status: 201, description: 'UoM agregada exitosamente' })
  @ApiResponse({ status: 409, description: 'UoM ya existe para este producto' })
  create(@Param('productId') productId: string, @Body() dto: CreateProductUoMDto, @Request() req) {
    return this.productUoMService.create(productId, dto, req.user.tenant_id);
  }

  @Get()
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Listar UoMs del producto' })
  @ApiResponse({ status: 200, description: 'Lista de UoMs' })
  findAll(@Param('productId') productId: string, @Request() req) {
    return this.productUoMService.findAll(productId, req.user.tenant_id);
  }

  @Get('catalog')
  @RequirePermission('Product', 'Read')
  @ApiOperation({
    summary: 'Catálogo UoM del tenant (para asignar al producto)',
    description:
      'Misma respuesta que GET /api/uom-catalog. Debe declararse antes de GET :id para no confundir "catalog" con un UUID.',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado del catálogo UoM' })
  findCatalog(
    @Param('productId') productId: string,
    @Query() query: QueryUoMCatalogDto,
    @Request() req,
  ) {
    return this.productUoMService.findCatalogForProduct(productId, query, req.user.tenant_id);
  }

  @Get(':id')
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Obtener UoM específica' })
  @ApiResponse({ status: 200, description: 'UoM encontrada' })
  @ApiResponse({ status: 404, description: 'UoM no encontrada' })
  findOne(@Param('productId') productId: string, @Param('id') id: string, @Request() req) {
    return this.productUoMService.findOne(id, productId, req.user.tenant_id);
  }

  @Patch(':id')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Actualizar UoM del producto' })
  @ApiResponse({ status: 200, description: 'UoM actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'UoM no encontrada' })
  update(
    @Param('productId') productId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductUoMDto,
    @Request() req,
  ) {
    return this.productUoMService.update(id, productId, dto, req.user.tenant_id);
  }

  @Delete(':id')
  @RequirePermission('Product', 'Delete')
  @ApiOperation({ summary: 'Eliminar UoM del producto' })
  @ApiResponse({ status: 200, description: 'UoM eliminada exitosamente' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar UoM base' })
  @ApiResponse({ status: 404, description: 'UoM no encontrada' })
  remove(@Param('productId') productId: string, @Param('id') id: string, @Request() req) {
    return this.productUoMService.remove(id, productId, req.user.tenant_id);
  }
}
