import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  RequireAnyPermissions,
  RequirePermission,
} from '../rbac/decorators/require-permissions.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { QueryPriceUpdateDto } from './dto/query-price-update.dto';
import { UpdatePriceUpdateRowDto } from './dto/update-price-update-row.dto';
import { PRICE_UPDATE_ENTITY_CODE } from './price-updates.constants';
import { PriceUpdatesService } from './price-updates.service';

@ApiTags('Actualización de precio')
@ApiBearerAuth()
@Controller('tenant/price-updates')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PriceUpdatesController {
  constructor(private readonly priceUpdatesService: PriceUpdatesService) {}

  @Get()
  @RequireAnyPermissions(
    { entityType: PRICE_UPDATE_ENTITY_CODE, action: 'Read' },
    { entityType: PRICE_UPDATE_ENTITY_CODE, action: 'ViewMenu' },
  )
  @ApiOperation({
    summary: 'Hoja de actualización de precio',
    description: 'Productos con las dos últimas compras, costo promedio y precio por lista y unidad.',
  })
  getSheet(@Query() query: QueryPriceUpdateDto, @Req() req: { user: { tenant_id: string } }) {
    return this.priceUpdatesService.getSheet(req.user.tenant_id, query);
  }

  @Patch('products/:productId')
  @RequirePermission(PRICE_UPDATE_ENTITY_CODE, 'Update')
  @ApiOperation({
    summary: 'Guardar costo promedio o precios de un producto',
    description:
      'Si llega el costo promedio, recalcula las listas que tienen margen. Los precios enviados se guardan tal cual.',
  })
  updateRow(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdatePriceUpdateRowDto,
    @Req() req: { user: { tenant_id: string } },
  ) {
    return this.priceUpdatesService.updateRow(req.user.tenant_id, productId, dto);
  }
}
