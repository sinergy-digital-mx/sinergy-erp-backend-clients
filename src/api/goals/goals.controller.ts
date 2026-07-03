import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { GoalsService } from './goals.service';
import {
  CreateSalesGoalDto,
  QuerySalesGoalsDto,
  UpdateSalesGoalDto,
} from './dto/create-sales-goal.dto';
import { UpdateGoalsSettingsDto } from './dto/update-goals-settings.dto';

@ApiTags('Goals')
@Controller('tenant/goals')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get('settings')
  @RequirePermissions({ entityType: 'Goals', action: 'Read' })
  @ApiOperation({
    summary: 'Configuración de metas (comisión activa %)',
    description: 'Comisión por tenant usada en el reporte de ventas Zona Norte.',
  })
  getSettings(@Req() req: any) {
    return this.goalsService.getSettings(req.user.tenant_id);
  }

  @Patch('settings')
  @RequirePermissions({ entityType: 'Goals', action: 'Update' })
  @ApiOperation({ summary: 'Actualizar comisión activa (%)' })
  updateSettings(@Body() dto: UpdateGoalsSettingsDto, @Req() req: any) {
    return this.goalsService.updateSettings(req.user.tenant_id, dto, req.user.id);
  }

  @Get()
  @RequirePermissions({ entityType: 'Goals', action: 'Read' })
  @ApiOperation({ summary: 'Listar metas de ventas' })
  findAll(@Query() query: QuerySalesGoalsDto, @Req() req: any) {
    return this.goalsService.findAll(req.user.tenant_id, query);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Goals', action: 'Read' })
  @ApiOperation({ summary: 'Detalle de una meta' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.goalsService.findOne(id, req.user.tenant_id);
  }

  @Post()
  @RequirePermissions({ entityType: 'Goals', action: 'Create' })
  @ApiOperation({ summary: 'Crear meta de ventas' })
  create(@Body() dto: CreateSalesGoalDto, @Req() req: any) {
    return this.goalsService.create(dto, req.user.tenant_id, req.user.id);
  }

  @Patch(':id')
  @RequirePermissions({ entityType: 'Goals', action: 'Update' })
  @ApiOperation({ summary: 'Actualizar meta' })
  update(@Param('id') id: string, @Body() dto: UpdateSalesGoalDto, @Req() req: any) {
    return this.goalsService.update(id, dto, req.user.tenant_id);
  }

  @Delete(':id')
  @RequirePermissions({ entityType: 'Goals', action: 'Delete' })
  @ApiOperation({ summary: 'Eliminar meta' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.goalsService.remove(id, req.user.tenant_id);
  }
}
