import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';
import { ProductAttributeService } from './product-attribute.service';
import { CreateProductAttributeDto } from './dto/create-product-attribute.dto';
import { UpdateProductAttributeDto } from './dto/update-product-attribute.dto';
import { QueryProductAttributeDto } from './dto/query-product-attribute.dto';
import { CreateProductAttributeValueDto } from './dto/create-product-attribute-value.dto';
import { UpdateProductAttributeValueDto } from './dto/update-product-attribute-value.dto';

@ApiTags('Product Attributes')
@ApiBearerAuth()
@Controller('tenant/products/attributes')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductAttributeController {
  constructor(private readonly productAttributeService: ProductAttributeService) {}

  @Post()
  @RequirePermission('Product', 'Create')
  @ApiOperation({ summary: 'Crear atributo de catálogo' })
  @ApiResponse({ status: 201, description: 'Atributo creado exitosamente' })
  createAttribute(@Body() dto: CreateProductAttributeDto, @Request() req) {
    return this.productAttributeService.createAttribute(dto, req.user.tenant_id);
  }

  @Get()
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Listar atributos de producto' })
  @ApiResponse({ status: 200, description: 'Lista de atributos' })
  findAllAttributes(@Query() query: QueryProductAttributeDto, @Request() req) {
    return this.productAttributeService.findAllAttributes(query, req.user.tenant_id);
  }

  @Get('options')
  @RequirePermission('Product', 'Read')
  @ApiOperation({
    summary: 'Catálogo activo con valores (para selector en producto)',
    description:
      'Sin paginación. Solo atributos y valores activos. No son asignaciones de un producto.',
  })
  @ApiResponse({ status: 200, description: 'Opciones de catálogo' })
  findOptions(@Request() req) {
    return this.productAttributeService.findOptions(req.user.tenant_id);
  }

  @Get(':attributeId')
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Obtener atributo por ID' })
  @ApiResponse({ status: 200, description: 'Atributo encontrado' })
  findAttributeById(@Param('attributeId') attributeId: string, @Request() req) {
    return this.productAttributeService.findAttributeById(attributeId, req.user.tenant_id);
  }

  @Patch(':attributeId')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Actualizar atributo de producto' })
  @ApiResponse({ status: 200, description: 'Atributo actualizado' })
  updateAttribute(
    @Param('attributeId') attributeId: string,
    @Body() dto: UpdateProductAttributeDto,
    @Request() req,
  ) {
    return this.productAttributeService.updateAttribute(attributeId, dto, req.user.tenant_id);
  }

  @Delete(':attributeId')
  @RequirePermission('Product', 'Delete')
  @ApiOperation({ summary: 'Eliminar atributo de producto' })
  @ApiResponse({ status: 200, description: 'Atributo eliminado' })
  removeAttribute(@Param('attributeId') attributeId: string, @Request() req) {
    return this.productAttributeService.removeAttribute(attributeId, req.user.tenant_id);
  }

  @Post(':attributeId/values')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Crear valor para un atributo' })
  @ApiResponse({ status: 201, description: 'Valor creado' })
  createValue(
    @Param('attributeId') attributeId: string,
    @Body() dto: CreateProductAttributeValueDto,
    @Request() req,
  ) {
    return this.productAttributeService.createValue(attributeId, dto, req.user.tenant_id);
  }

  @Get(':attributeId/values')
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Listar valores de un atributo' })
  @ApiResponse({ status: 200, description: 'Lista de valores' })
  findAllValues(@Param('attributeId') attributeId: string, @Request() req) {
    return this.productAttributeService.findAllValues(attributeId, req.user.tenant_id);
  }

  @Patch(':attributeId/values/:valueId')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Actualizar valor de atributo' })
  @ApiResponse({ status: 200, description: 'Valor actualizado' })
  updateValue(
    @Param('attributeId') attributeId: string,
    @Param('valueId') valueId: string,
    @Body() dto: UpdateProductAttributeValueDto,
    @Request() req,
  ) {
    return this.productAttributeService.updateValue(valueId, attributeId, dto, req.user.tenant_id);
  }

  @Delete(':attributeId/values/:valueId')
  @RequirePermission('Product', 'Delete')
  @ApiOperation({ summary: 'Eliminar valor de atributo' })
  @ApiResponse({ status: 200, description: 'Valor eliminado' })
  removeValue(
    @Param('attributeId') attributeId: string,
    @Param('valueId') valueId: string,
    @Request() req,
  ) {
    return this.productAttributeService.removeValue(valueId, attributeId, req.user.tenant_id);
  }
}
