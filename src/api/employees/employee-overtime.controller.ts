import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  RequireAnyPermissions,
  RequirePermission,
} from '../rbac/decorators/require-permissions.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { PermissionService } from '../rbac/services/permission.service';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { CreateOvertimeRequestDto } from './dto/create-overtime-request.dto';
import { PreviewOvertimeRequestDto } from './dto/preview-overtime-request.dto';
import { QueryOvertimeRequestDto } from './dto/query-overtime-request.dto';
import { ReviewOvertimeRequestDto } from './dto/review-overtime-request.dto';
import { UpdateOvertimeRequestDto } from './dto/update-overtime-request.dto';
import { UpsertOvertimePolicyDto } from './dto/upsert-overtime-policy.dto';
import { EmployeeOvertimeService } from './employee-overtime.service';
import { EMPLOYEES_ENTITY_CODE } from './employees.constants';
import { EmployeesService } from './employees.service';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('tenant/employees')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class EmployeeOvertimeController {
  constructor(
    private readonly overtimeService: EmployeeOvertimeService,
    private readonly employeesService: EmployeesService,
    private readonly tenantContext: TenantContextService,
    private readonly permissionService: PermissionService,
  ) {}

  @Get('overtime/policy')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'Read')
  @ApiOperation({ summary: 'Reglas de pago de horas extras' })
  getPolicy() {
    return this.overtimeService.getPolicy(this.getTenantId());
  }

  @Put('overtime/policy')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'Update')
  @ApiOperation({ summary: 'Configurar las reglas de pago de horas extras' })
  upsertPolicy(@Body() dto: UpsertOvertimePolicyDto) {
    return this.overtimeService.upsertPolicy(this.getTenantId(), dto);
  }

  @Get('overtime-requests/all')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'Read')
  @ApiOperation({ summary: 'Listar solicitudes de horas extras' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(@Query() query: QueryOvertimeRequestDto) {
    return this.overtimeService.findAll(this.getTenantId(), query);
  }

  @Get('overtime-requests/:requestId/preview')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'ManageLeave')
  @ApiOperation({ summary: 'Calcular el importe antes de autorizar' })
  @ApiParam({ name: 'requestId', type: 'string' })
  preview(
    @Param('requestId') requestId: string,
    @Query() query: PreviewOvertimeRequestDto,
  ) {
    return this.overtimeService.preview(
      this.getTenantId(),
      requestId,
      query.approved_hours,
    );
  }

  @Put('overtime-requests/:requestId')
  @RequireAnyPermissions(
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'Update' },
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'ViewOwn' },
  )
  @ApiOperation({ summary: 'Corregir una solicitud de horas extras pendiente' })
  @ApiParam({ name: 'requestId', type: 'string' })
  async update(
    @Param('requestId') requestId: string,
    @Body() dto: UpdateOvertimeRequestDto,
  ) {
    const ownerEmployeeId = await this.ownerEmployeeIdUnlessCanUpdate();
    return this.overtimeService.update(
      this.getTenantId(),
      requestId,
      dto,
      ownerEmployeeId,
    );
  }

  @Put('overtime-requests/:requestId/review')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'ManageLeave')
  @ApiOperation({
    summary: 'Aprobar o rechazar horas extras. Se puede autorizar otro número de horas.',
  })
  @ApiParam({ name: 'requestId', type: 'string' })
  review(
    @Param('requestId') requestId: string,
    @Body() dto: ReviewOvertimeRequestDto,
  ) {
    return this.overtimeService.review(
      this.getTenantId(),
      requestId,
      dto,
      this.tenantContext.getCurrentUserId(),
    );
  }

  @Put('overtime-requests/:requestId/pay')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'ManageLeave')
  @ApiOperation({ summary: 'Marcar como pagadas las horas ya autorizadas' })
  @ApiParam({ name: 'requestId', type: 'string' })
  markPaid(@Param('requestId') requestId: string) {
    return this.overtimeService.markPaid(
      this.getTenantId(),
      requestId,
      this.tenantContext.getCurrentUserId(),
    );
  }

  @Get(':id/overtime-requests')
  @RequireAnyPermissions(
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'Read' },
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'ViewOwn' },
  )
  @ApiOperation({ summary: 'Horas extras de un empleado' })
  @ApiParam({ name: 'id', type: 'string' })
  async findByEmployee(
    @Param('id') id: string,
    @Query() query: QueryOvertimeRequestDto,
  ) {
    const scope = await this.getScope();
    await this.employeesService.assertAccessible(scope.tenantId, id, scope);
    return this.overtimeService.findAllByEmployee(scope.tenantId, id, query);
  }

  @Post(':id/overtime-requests')
  @RequireAnyPermissions(
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'Update' },
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'ViewOwn' },
  )
  @ApiOperation({ summary: 'Registrar horas extras a nombre de un empleado' })
  @ApiParam({ name: 'id', type: 'string' })
  async create(@Param('id') id: string, @Body() dto: CreateOvertimeRequestDto) {
    const scope = await this.getScope();
    await this.employeesService.assertAccessible(scope.tenantId, id, scope);
    return this.overtimeService.create(
      scope.tenantId,
      id,
      dto,
      this.tenantContext.getCurrentUserId(),
    );
  }

  private getTenantId(): string {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return tenantId;
  }

  private async getScope() {
    const tenantId = this.getTenantId();
    const userId = this.tenantContext.getCurrentUserId();
    const seeAll = userId
      ? await this.permissionService.hasPermission(
          userId,
          tenantId,
          EMPLOYEES_ENTITY_CODE,
          'Read',
        )
      : false;
    return { tenantId, userId, seeAll };
  }

  private async ownerEmployeeIdUnlessCanUpdate(): Promise<string | undefined> {
    const scope = await this.getScope();
    if (!scope.userId) {
      return '00000000-0000-0000-0000-000000000000';
    }
    const canUpdate = await this.permissionService.hasPermission(
      scope.userId,
      scope.tenantId,
      EMPLOYEES_ENTITY_CODE,
      'Update',
    );
    if (canUpdate) return undefined;
    const own = await this.employeesService.findEntityByUser(scope.tenantId, scope.userId);
    return own?.id ?? '00000000-0000-0000-0000-000000000000';
  }
}
