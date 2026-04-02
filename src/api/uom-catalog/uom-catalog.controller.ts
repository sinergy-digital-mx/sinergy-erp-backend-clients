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
import { UoMCatalogService } from './uom-catalog.service';
import { CreateUoMCatalogDto } from './dto/create-uom-catalog.dto';
import { UpdateUoMCatalogDto } from './dto/update-uom-catalog.dto';
import { QueryUoMCatalogDto } from './dto/query-uom-catalog.dto';
import { PaginatedUoMCatalogDto } from './dto/paginated-uom-catalog.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('UoM Catalog')
@ApiBearerAuth()
@Controller('uom-catalog')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UoMCatalogController {
  constructor(private readonly uomCatalogService: UoMCatalogService) {}

  @Post()
  @RequirePermission('UoMCatalog', 'Create')
  @ApiOperation({ summary: 'Crear nueva unidad de medida' })
  @ApiResponse({ status: 201, description: 'UoM creada exitosamente' })
  @ApiResponse({ status: 409, description: 'El código ya existe' })
  create(@Body() dto: CreateUoMCatalogDto, @Request() req) {
    return this.uomCatalogService.create(dto, req.user.tenant_id);
  }

  @Get()
  @RequirePermission('UoMCatalog', 'Read')
  @ApiOperation({ summary: 'Listar unidades de medida' })
  @ApiResponse({ status: 200, type: PaginatedUoMCatalogDto })
  findAll(@Query() query: QueryUoMCatalogDto, @Request() req) {
    return this.uomCatalogService.findAll(query, req.user.tenant_id);
  }

  @Get(':id')
  @RequirePermission('UoMCatalog', 'Read')
  @ApiOperation({ summary: 'Obtener unidad de medida por ID' })
  @ApiResponse({ status: 200, description: 'UoM encontrada' })
  @ApiResponse({ status: 404, description: 'UoM no encontrada' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.uomCatalogService.findOne(id, req.user.tenant_id);
  }

  @Patch(':id')
  @RequirePermission('UoMCatalog', 'Update')
  @ApiOperation({ summary: 'Actualizar unidad de medida' })
  @ApiResponse({ status: 200, description: 'UoM actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'UoM no encontrada' })
  update(@Param('id') id: string, @Body() dto: UpdateUoMCatalogDto, @Request() req) {
    return this.uomCatalogService.update(id, dto, req.user.tenant_id);
  }

  @Delete(':id')
  @RequirePermission('UoMCatalog', 'Delete')
  @ApiOperation({ summary: 'Eliminar unidad de medida' })
  @ApiResponse({ status: 200, description: 'UoM eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'UoM no encontrada' })
  remove(@Param('id') id: string, @Request() req) {
    return this.uomCatalogService.remove(id, req.user.tenant_id);
  }
}
