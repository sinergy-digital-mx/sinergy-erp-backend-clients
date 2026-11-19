import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { userHasJwtPermission } from '../rbac/utils/jwt-permission.util';
import { UpsertLogisticsRouteDto } from './dto/logistics-route.dto';
import { LogisticsRoutesService } from './logistics-routes.service';

@ApiTags('Logistics routes')
@Controller('tenant/logistics-routes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LogisticsRoutesController {
  constructor(private readonly routes: LogisticsRoutesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar rutas de reparto' })
  list(@Query('active') active: string | undefined, @Req() req: any) {
    this.assertCanRead(req.user);
    return this.routes.list(req.user.tenant_id, active === '1' || active === 'true');
  }

  @Post()
  @ApiOperation({ summary: 'Crear ruta de reparto' })
  create(@Body() dto: UpsertLogisticsRouteDto, @Req() req: any) {
    this.assertCanWrite(req.user);
    return this.routes.create(req.user.tenant_id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar ruta de reparto' })
  update(@Param('id') id: string, @Body() dto: UpsertLogisticsRouteDto, @Req() req: any) {
    this.assertCanWrite(req.user);
    return this.routes.update(req.user.tenant_id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar ruta de reparto' })
  remove(@Param('id') id: string, @Req() req: any) {
    this.assertCanWrite(req.user);
    return this.routes.deactivate(req.user.tenant_id, id);
  }

  private assertCanRead(user: any): void {
    if (
      userHasJwtPermission(user, 'route', 'Read') ||
      userHasJwtPermission(user, 'route', 'ViewMenu') ||
      userHasJwtPermission(user, 'sales_orders', 'Read') ||
      userHasJwtPermission(user, 'sales_orders', 'Create') ||
      userHasJwtPermission(user, 'sales_orders', 'Update')
    ) {
      return;
    }
    throw new ForbiddenException('No puedes consultar las rutas');
  }

  private assertCanWrite(user: any): void {
    if (
      userHasJwtPermission(user, 'route', 'Create') ||
      userHasJwtPermission(user, 'route', 'Update') ||
      userHasJwtPermission(user, 'sales_orders', 'Update')
    ) {
      return;
    }
    throw new ForbiddenException('No puedes modificar las rutas');
  }
}
