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
import { GlobalDiscountService } from './global-discount.service';
import { CreateGlobalDiscountDto } from './dto/create-global-discount.dto';
import { UpdateGlobalDiscountDto } from './dto/update-global-discount.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';

@ApiTags('Global Discounts')
@ApiBearerAuth()
@Controller('tenant/global-discounts')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class GlobalDiscountController {
  constructor(private readonly globalDiscountService: GlobalDiscountService) {}

  @Get('applicable')
  @RequirePermission('GlobalDiscount', 'Read')
  @ApiOperation({ summary: 'Listar descuentos globales aplicables en venta/POS' })
  @ApiResponse({ status: 200, description: 'Descuentos activos y vigentes' })
  findApplicable(@Request() req) {
    return this.globalDiscountService.findApplicable(req.user.tenant_id);
  }

  @Post()
  @RequirePermission('GlobalDiscount', 'Create')
  @ApiOperation({ summary: 'Crear descuento global' })
  @ApiResponse({ status: 201, description: 'Descuento global creado' })
  create(@Body() dto: CreateGlobalDiscountDto, @Request() req) {
    return this.globalDiscountService.create(dto, req.user.tenant_id);
  }

  @Get()
  @RequirePermission('GlobalDiscount', 'Read')
  @ApiOperation({ summary: 'Listar descuentos globales' })
  @ApiResponse({ status: 200, description: 'Descuentos globales obtenidos' })
  findAll(@Request() req) {
    return this.globalDiscountService.findAll(req.user.tenant_id);
  }

  @Get(':id')
  @RequirePermission('GlobalDiscount', 'Read')
  @ApiOperation({ summary: 'Obtener descuento global' })
  @ApiResponse({ status: 200, description: 'Descuento global encontrado' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.globalDiscountService.findOne(id, req.user.tenant_id);
  }

  @Patch(':id')
  @RequirePermission('GlobalDiscount', 'Update')
  @ApiOperation({ summary: 'Actualizar descuento global' })
  @ApiResponse({ status: 200, description: 'Descuento global actualizado' })
  update(@Param('id') id: string, @Body() dto: UpdateGlobalDiscountDto, @Request() req) {
    return this.globalDiscountService.update(id, dto, req.user.tenant_id);
  }

  @Delete(':id')
  @RequirePermission('GlobalDiscount', 'Delete')
  @ApiOperation({ summary: 'Eliminar descuento global' })
  @ApiResponse({ status: 200, description: 'Descuento global eliminado' })
  remove(@Param('id') id: string, @Request() req) {
    return this.globalDiscountService.remove(id, req.user.tenant_id);
  }
}
