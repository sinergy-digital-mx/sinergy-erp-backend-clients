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
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { EmployeesService } from './employees.service';
import { EmployeeLeaveService } from './employee-leave.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
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
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'Read')
  @ApiOperation({ summary: 'Listar empleados con búsqueda, filtros y vacaciones' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'department', required: false, type: String })
  findAll(@Query() query: QueryEmployeeDto) {
    return this.employeesService.findAll(this.getTenantId(), query);
  }

  @Get(':id')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'Read')
  @ApiOperation({ summary: 'Detalle del empleado (nómina, vacaciones, solicitudes)' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(this.getTenantId(), id);
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
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'Read')
  @ApiOperation({ summary: 'Listar solicitudes de un empleado' })
  @ApiParam({ name: 'id', type: 'string' })
  findEmployeeLeaveRequests(
    @Param('id') id: string,
    @Query() query: QueryLeaveRequestDto,
  ) {
    return this.leaveService.findAllByEmployee(this.getTenantId(), id, query);
  }

  @Post(':id/leave-requests')
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'Update')
  @ApiOperation({ summary: 'Registrar una solicitud a nombre de un empleado' })
  @ApiParam({ name: 'id', type: 'string' })
  createLeaveRequest(
    @Param('id') id: string,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.leaveService.create(
      this.getTenantId(),
      id,
      dto,
      this.tenantContext.getCurrentUserId(),
    );
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
  @RequirePermission(EMPLOYEES_ENTITY_CODE, 'ManageLeave')
  @ApiOperation({ summary: 'Cancelar una solicitud pendiente' })
  @ApiParam({ name: 'requestId', type: 'string' })
  cancelLeaveRequest(@Param('requestId') requestId: string) {
    return this.leaveService.cancel(this.getTenantId(), requestId);
  }

  private getTenantId(): string {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return tenantId;
  }
}
