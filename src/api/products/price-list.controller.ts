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
import { PriceListService } from './price-list.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('Price Lists')
@ApiBearerAuth()
@Controller('tenant/price-lists')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PriceListController {
  constructor(private readonly priceListService: PriceListService) {}

  @Post()
  @RequirePermission('Product', 'Create')
  @ApiOperation({ summary: 'Crear lista de precios' })
  @ApiResponse({ status: 201, description: 'Lista creada exitosamente' })
  create(@Body() dto: CreatePriceListDto, @Request() req) {
    return this.priceListService.create(dto, req.user.tenant_id);
  }

  @Get()
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Listar listas de precios' })
  @ApiResponse({ status: 200, description: 'Listas obtenidas' })
  findAll(@Request() req) {
    return this.priceListService.findAll(req.user.tenant_id);
  }

  @Get(':id')
  @RequirePermission('Product', 'Read')
  @ApiOperation({ summary: 'Obtener lista de precios' })
  @ApiResponse({ status: 200, description: 'Lista encontrada' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.priceListService.findOne(id, req.user.tenant_id);
  }

  @Patch(':id')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Actualizar lista de precios' })
  @ApiResponse({ status: 200, description: 'Lista actualizada' })
  update(@Param('id') id: string, @Body() dto: UpdatePriceListDto, @Request() req) {
    return this.priceListService.update(id, dto, req.user.tenant_id);
  }

  @Delete(':id')
  @RequirePermission('Product', 'Delete')
  @ApiOperation({ summary: 'Eliminar lista de precios' })
  @ApiResponse({ status: 200, description: 'Lista eliminada' })
  remove(@Param('id') id: string, @Request() req) {
    return this.priceListService.remove(id, req.user.tenant_id);
  }
}
