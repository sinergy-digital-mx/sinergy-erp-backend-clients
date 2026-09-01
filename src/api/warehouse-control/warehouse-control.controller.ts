import {
  Body,
  Controller,
  Delete,
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
import { TenantModuleValidationGuard } from '../auth/tenant-module-validation.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { WarehouseControlService } from './warehouse-control.service';
import { QueryControlDeskBoardDto } from './dto/query-control-desk-board.dto';
import { AssignPositionDto } from './dto/assign-position.dto';
import { CompletePickTaskDto } from './dto/complete-pick-task.dto';
import { CorroborateSalesOrderDto } from './dto/corroborate-sales-order.dto';
import { CreateControlDeskPositionDto } from './dto/create-control-desk-position.dto';
import { UpdateControlDeskPositionDto } from './dto/update-control-desk-position.dto';
import { QueryControlDeskPositionsDto } from './dto/query-control-desk-positions.dto';

@ApiTags('Mesa de Control')
@Controller('tenant/warehouse-control')
@UseGuards(JwtAuthGuard, TenantModuleValidationGuard, PermissionGuard)
@ApiBearerAuth()
export class WarehouseControlController {
  constructor(private readonly service: WarehouseControlService) {}

  @Get()
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Read' })
  @ApiOperation({ summary: 'Tablero Mesa de Control (KPIs, mapa, cola)' })
  getBoard(@Query() query: QueryControlDeskBoardDto, @Req() req: any) {
    return this.service.getBoard(req.user.tenant_id, this.actor(req), query);
  }

  @Get('stats')
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Read' })
  @ApiOperation({ summary: 'Conteos de Mesa de Control' })
  getStats(@Query() query: QueryControlDeskBoardDto, @Req() req: any) {
    return this.service.getStats(req.user.tenant_id, this.actor(req), query);
  }

  @Get('positions')
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Read' })
  @ApiOperation({ summary: 'Catálogo de posiciones de piso' })
  listPositions(@Query() query: QueryControlDeskPositionsDto, @Req() req: any) {
    return this.service.listPositions(req.user.tenant_id, query);
  }

  @Post('positions')
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Create' })
  @ApiOperation({ summary: 'Crear posición de piso' })
  createPosition(@Body() dto: CreateControlDeskPositionDto, @Req() req: any) {
    return this.service.createPosition(req.user.tenant_id, dto);
  }

  @Put('positions/:positionId')
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Create' })
  @ApiOperation({ summary: 'Editar posición de piso' })
  updatePosition(
    @Param('positionId') positionId: string,
    @Body() dto: UpdateControlDeskPositionDto,
    @Req() req: any,
  ) {
    return this.service.updatePosition(positionId, req.user.tenant_id, dto);
  }

  @Delete('positions/:positionId')
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Create' })
  @ApiOperation({ summary: 'Eliminar posición de piso' })
  deletePosition(@Param('positionId') positionId: string, @Req() req: any) {
    return this.service.deletePosition(positionId, req.user.tenant_id);
  }

  @Get(':jobId')
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Read' })
  @ApiOperation({ summary: 'Detalle de job / OV en Mesa de Control' })
  findOne(@Param('jobId') jobId: string, @Req() req: any) {
    return this.service.findOneJob(jobId, req.user.tenant_id, this.actor(req));
  }

  @Post(':jobId/assign-position')
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Update' })
  @ApiOperation({ summary: 'Asignar posición de piso (o la siguiente libre)' })
  assignPosition(
    @Param('jobId') jobId: string,
    @Body() dto: AssignPositionDto,
    @Req() req: any,
  ) {
    return this.service.assignPosition(
      jobId,
      dto,
      req.user.tenant_id,
      this.actor(req),
    );
  }

  @Post(':jobId/tasks/:taskId/start')
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Update' })
  @ApiOperation({ summary: 'Iniciar picking de un almacén' })
  startTask(
    @Param('jobId') jobId: string,
    @Param('taskId') taskId: string,
    @Req() req: any,
  ) {
    return this.service.startTask(jobId, taskId, req.user.tenant_id, this.actor(req));
  }

  @Post(':jobId/tasks/:taskId/complete')
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Update' })
  @ApiOperation({ summary: 'Cerrar picking de un almacén (FIFO de ese almacén)' })
  completeTask(
    @Param('jobId') jobId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CompletePickTaskDto,
    @Req() req: any,
  ) {
    return this.service.completeTask(
      jobId,
      taskId,
      dto,
      req.user.tenant_id,
      this.actor(req),
    );
  }

  @Post(':jobId/assemble')
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Update' })
  @ApiOperation({ summary: 'Marcar armando / armada' })
  assemble(@Param('jobId') jobId: string, @Req() req: any) {
    return this.service.assemble(jobId, req.user.tenant_id, this.actor(req));
  }

  @Post(':jobId/corroborate')
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Update' })
  @ApiOperation({ summary: 'Corroborar armado → Lista para entrega' })
  corroborate(
    @Param('jobId') jobId: string,
    @Body() dto: CorroborateSalesOrderDto,
    @Req() req: any,
  ) {
    return this.service.corroborate(
      jobId,
      dto,
      req.user.tenant_id,
      this.actor(req),
    );
  }

  private actor(req: any) {
    return {
      userId: req.user.id,
      hasAdminRole: Boolean(req.user.hasAdminRole),
    };
  }
}
