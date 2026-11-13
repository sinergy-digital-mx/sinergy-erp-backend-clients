import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import {
  RequireAnyPermissions,
  RequirePermission,
} from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PermissionService } from '../rbac/services/permission.service';
import { EmployeesService } from './employees.service';
import { EmployeeLeaveService } from './employee-leave.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpsertWorkScheduleDto } from './dto/upsert-work-schedule.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { QueryLeaveRequestDto } from './dto/query-leave-request.dto';
import { EMPLOYEES_ENTITY_CODE } from './employees.constants';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('tenant/employees')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly leaveService: EmployeeLeaveService,
    private readonly tenantContext: TenantContextService,
    private readonly permissionService: PermissionService,
  ) {}

  // --------------------------------------------------------------------------
  // Empleados
  // --------------------------------------------------------------------------
  @Post()
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'Create')
  @ApiOperation({ summary: 'Crear perfil de empleado ligado a un usuario' })
  @ApiResponse({ status: 201, description: 'Empleado creado' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(this.getTenantId(), dto);
  }

  @Get()
  @RequireAnyPermissions(
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'Read' },
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'ViewOwn' },
  )
  @ApiOperation({ summary: 'Listar empleados con búsqueda, filtros y vacaciones' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'department', required: false, type: String })
  async findAll(@Query() query: QueryEmployeeDto) {
    const scope = await this.getScope();
    return this.employeesService.findAll(scope.tenantId, query, scope);
  }

  @Get(':id')
  @RequireAnyPermissions(
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'Read' },
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'ViewOwn' },
  )
  @ApiOperation({ summary: 'Detalle del empleado (nómina, vacaciones, solicitudes)' })
  @ApiParam({ name: 'id', type: 'string' })
  async findOne(@Param('id') id: string) {
    const scope = await this.getScope();
    return this.employeesService.findOne(scope.tenantId, id, scope);
  }

  @Put(':id')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'Update')
  @ApiOperation({ summary: 'Actualizar datos de RH/nómina del empleado' })
  @ApiParam({ name: 'id', type: 'string' })
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(this.getTenantId(), id, dto);
  }

  @Delete(':id')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'Delete')
  @ApiOperation({ summary: 'Eliminar el perfil de empleado' })
  @ApiParam({ name: 'id', type: 'string' })
  async remove(@Param('id') id: string) {
    await this.employeesService.remove(this.getTenantId(), id);
    return { success: true };
  }

  @Post(':id/photo')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'Update')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir/actualizar la foto del empleado' })
  @ApiParam({ name: 'id', type: 'string' })
  uploadPhoto(@Param('id') id: string, @UploadedFile() file: any) {
    return this.employeesService.uploadPhoto(this.getTenantId(), id, file);
  }

  @Put(':id/work-schedule')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'Update')
  @ApiOperation({ summary: 'Guardar el horario laboral semanal del empleado' })
  @ApiParam({ name: 'id', type: 'string' })
  upsertWorkSchedule(@Param('id') id: string, @Body() dto: UpsertWorkScheduleDto) {
    return this.employeesService.upsertWorkSchedule(this.getTenantId(), id, dto);
  }

  // --------------------------------------------------------------------------
  // Solicitudes (vacaciones / faltas)
  // --------------------------------------------------------------------------
  @Get('leave-requests/all')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'Read')
  @ApiOperation({ summary: 'Listar todas las solicitudes de la organización' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAllLeaveRequests(@Query() query: QueryLeaveRequestDto) {
    return this.leaveService.findAll(this.getTenantId(), query);
  }

  @Get(':id/leave-requests')
  @RequireAnyPermissions(
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'Read' },
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'ViewOwn' },
  )
  @ApiOperation({ summary: 'Listar solicitudes de un empleado' })
  @ApiParam({ name: 'id', type: 'string' })
  async findEmployeeLeaveRequests(
    @Param('id') id: string,
    @Query() query: QueryLeaveRequestDto,
  ) {
    const scope = await this.getScope();
    await this.employeesService.assertAccessible(scope.tenantId, id, scope);
    return this.leaveService.findAllByEmployee(scope.tenantId, id, query);
  }

  @Post(':id/leave-requests')
  @RequireAnyPermissions(
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'Update' },
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'ViewOwn' },
  )
  @ApiOperation({ summary: 'Registrar una solicitud a nombre de un empleado' })
  @ApiParam({ name: 'id', type: 'string' })
  async createLeaveRequest(
    @Param('id') id: string,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    const scope = await this.getScope();
    await this.employeesService.assertAccessible(scope.tenantId, id, scope);
    return this.leaveService.create(
      scope.tenantId,
      id,
      dto,
      this.tenantContext.getCurrentUserId(),
    );
  }

  @Put('leave-requests/:requestId')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'Update')
  @ApiOperation({
    summary: 'Corregir fechas o días de una solicitud (p. ej. hábiles vs naturales)',
  })
  @ApiParam({ name: 'requestId', type: 'string' })
  updateLeaveRequest(
    @Param('requestId') requestId: string,
    @Body() dto: UpdateLeaveRequestDto,
  ) {
    return this.leaveService.update(this.getTenantId(), requestId, dto);
  }

  @Put('leave-requests/:requestId/review')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'ManageLeave')
  @ApiOperation({ summary: 'Aprobar o rechazar una solicitud' })
  @ApiParam({ name: 'requestId', type: 'string' })
  reviewLeaveRequest(
    @Param('requestId') requestId: string,
    @Body() dto: ReviewLeaveRequestDto,
  ) {
    return this.leaveService.review(
      this.getTenantId(),
      requestId,
      dto,
      this.tenantContext.getCurrentUserId(),
    );
  }

  @Put('leave-requests/:requestId/cancel')
  @RequireAnyPermissions(
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'ManageLeave' },
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'ViewOwn' },
  )
  @ApiOperation({ summary: 'Cancelar una solicitud pendiente' })
  @ApiParam({ name: 'requestId', type: 'string' })
  async cancelLeaveRequest(@Param('requestId') requestId: string) {
    const scope = await this.getScope();
    const canManage = scope.userId
      ? await this.permissionService.hasPermission(
          scope.userId,
          scope.tenantId,
          EMPLOYEES_ENTITY_CODE,
          'ManageLeave',
        )
      : false;
    let ownEmployeeId: string | undefined;
    if (!canManage) {
      const own = scope.userId
        ? await this.employeesService.findEntityByUser(scope.tenantId, scope.userId)
        : null;
      ownEmployeeId = own?.id;
      if (!ownEmployeeId) {
        ownEmployeeId = '00000000-0000-0000-0000-000000000000';
      }
    }
    return this.leaveService.cancel(scope.tenantId, requestId, ownEmployeeId);
  }

  @Post('leave-requests/:requestId/documents')
  @RequireAnyPermissions(
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'Update' },
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'ManageLeave' },
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'ViewOwn' },
  )
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Adjuntar un comprobante médico a una incapacidad' })
  @ApiParam({ name: 'requestId', type: 'string' })
  async uploadLeaveDocument(
    @Param('requestId') requestId: string,
    @UploadedFile() file: any,
  ) {
    const ownerEmployeeId = await this.ownerEmployeeIdUnlessCanManage();
    return this.leaveService.addDocument(
      this.getTenantId(),
      requestId,
      file,
      this.tenantContext.getCurrentUserId(),
      ownerEmployeeId,
    );
  }

  @Delete('leave-requests/:requestId/documents/:documentId')
  @RequireAnyPermissions(
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'Update' },
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'ManageLeave' },
    { entityType: EMPLOYEES_ENTITY_CODE, action: 'ViewOwn' },
  )
  @ApiOperation({ summary: 'Quitar un comprobante médico de una incapacidad' })
  @ApiParam({ name: 'requestId', type: 'string' })
  @ApiParam({ name: 'documentId', type: 'string' })
  async removeLeaveDocument(
    @Param('requestId') requestId: string,
    @Param('documentId') documentId: string,
  ) {
    const ownerEmployeeId = await this.ownerEmployeeIdUnlessCanManage();
    return this.leaveService.removeDocument(
      this.getTenantId(),
      requestId,
      documentId,
      ownerEmployeeId,
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

  private async ownerEmployeeIdUnlessCanManage(): Promise<string | undefined> {
    const scope = await this.getScope();
    if (!scope.userId) {
      return '00000000-0000-0000-0000-000000000000';
    }
    const [canUpdate, canManage] = await Promise.all([
      this.permissionService.hasPermission(
        scope.userId,
        scope.tenantId,
        EMPLOYEES_ENTITY_CODE,
        'Update',
      ),
      this.permissionService.hasPermission(
        scope.userId,
        scope.tenantId,
        EMPLOYEES_ENTITY_CODE,
        'ManageLeave',
      ),
    ]);
    if (canUpdate || canManage) {
      return undefined;
    }
    const own = await this.employeesService.findEntityByUser(scope.tenantId, scope.userId);
    return own?.id ?? '00000000-0000-0000-0000-000000000000';
  }
}
