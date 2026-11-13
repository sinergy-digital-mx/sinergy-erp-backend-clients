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
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { EmployeePortalService } from './employee-portal.service';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { CreateLeaveRequestDto } from '../employees/dto/create-leave-request.dto';
import { QueryLeaveRequestDto } from '../employees/dto/query-leave-request.dto';
import { CreateOvertimeRequestDto } from '../employees/dto/create-overtime-request.dto';
import { QueryOvertimeRequestDto } from '../employees/dto/query-overtime-request.dto';
import { UpdateOvertimeRequestDto } from '../employees/dto/update-overtime-request.dto';
import { UpsertWorkScheduleDto } from '../employees/dto/upsert-work-schedule.dto';
import { EMPLOYEE_PORTAL_ENTITY_CODE } from './employee-portal.constants';

@ApiTags('Employee Portal')
@ApiBearerAuth()
@Controller('tenant/employee-portal')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class EmployeePortalController {
  constructor(
    private readonly service: EmployeePortalService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('me')
  @RequirePermission(EMPLOYEE_PORTAL_ENTITY_CODE, 'Read')
  @ApiOperation({ summary: 'Ver mi información de empleado (puesto, foto, nómina, vacaciones)' })
  @ApiResponse({ status: 403, description: 'La cuenta no es de tipo empleado' })
  getMyProfile() {
    return this.service.getMyProfile(this.getTenantId(), this.getUserId());
  }

  @Put('me')
  @RequirePermission(EMPLOYEE_PORTAL_ENTITY_CODE, 'Update')
  @ApiOperation({ summary: 'Actualizar mi nombre, teléfono o contraseña' })
  updateMyProfile(@Body() dto: UpdateMyProfileDto) {
    return this.service.updateMyProfile(
      this.getTenantId(),
      this.getUserId(),
      dto,
    );
  }

  @Post('me/photo')
  @RequirePermission(EMPLOYEE_PORTAL_ENTITY_CODE, 'Update')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir/actualizar mi foto' })
  uploadMyPhoto(@UploadedFile() file: any) {
    return this.service.uploadMyPhoto(
      this.getTenantId(),
      this.getUserId(),
      file,
    );
  }

  @Get('me/leave-requests')
  @RequirePermission(EMPLOYEE_PORTAL_ENTITY_CODE, 'Read')
  @ApiOperation({ summary: 'Ver mis solicitudes de vacaciones/faltas' })
  getMyLeaveRequests(@Query() query: QueryLeaveRequestDto) {
    return this.service.getMyLeaveRequests(
      this.getTenantId(),
      this.getUserId(),
      query,
    );
  }

  @Post('me/leave-requests')
  @RequirePermission(EMPLOYEE_PORTAL_ENTITY_CODE, 'RequestLeave')
  @ApiOperation({ summary: 'Solicitar vacaciones o reportar una falta/permiso' })
  createMyLeaveRequest(@Body() dto: CreateLeaveRequestDto) {
    return this.service.createMyLeaveRequest(
      this.getTenantId(),
      this.getUserId(),
      dto,
    );
  }

  @Put('me/leave-requests/:requestId/cancel')
  @RequirePermission(EMPLOYEE_PORTAL_ENTITY_CODE, 'RequestLeave')
  @ApiOperation({ summary: 'Cancelar una de mis solicitudes pendientes' })
  @ApiParam({ name: 'requestId', type: 'string' })
  cancelMyLeaveRequest(@Param('requestId') requestId: string) {
    return this.service.cancelMyLeaveRequest(
      this.getTenantId(),
      this.getUserId(),
      requestId,
    );
  }

  @Post('me/leave-requests/:requestId/documents')
  @RequirePermission(EMPLOYEE_PORTAL_ENTITY_CODE, 'RequestLeave')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Adjuntar un comprobante a mi incapacidad médica' })
  @ApiParam({ name: 'requestId', type: 'string' })
  uploadMyLeaveDocument(
    @Param('requestId') requestId: string,
    @UploadedFile() file: any,
  ) {
    return this.service.addMyLeaveDocument(
      this.getTenantId(),
      this.getUserId(),
      requestId,
      file,
    );
  }

  @Delete('me/leave-requests/:requestId/documents/:documentId')
  @RequirePermission(EMPLOYEE_PORTAL_ENTITY_CODE, 'RequestLeave')
  @ApiOperation({ summary: 'Quitar un comprobante de mi incapacidad médica' })
  @ApiParam({ name: 'requestId', type: 'string' })
  @ApiParam({ name: 'documentId', type: 'string' })
  removeMyLeaveDocument(
    @Param('requestId') requestId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.service.removeMyLeaveDocument(
      this.getTenantId(),
      this.getUserId(),
      requestId,
      documentId,
    );
  }

  @Get('me/overtime-requests')
  @RequirePermission(EMPLOYEE_PORTAL_ENTITY_CODE, 'Read')
  @ApiOperation({ summary: 'Ver mis solicitudes de horas extras' })
  getMyOvertimeRequests(@Query() query: QueryOvertimeRequestDto) {
    return this.service.getMyOvertimeRequests(
      this.getTenantId(),
      this.getUserId(),
      query,
    );
  }

  @Post('me/overtime-requests')
  @RequirePermission(EMPLOYEE_PORTAL_ENTITY_CODE, 'RequestLeave')
  @ApiOperation({ summary: 'Solicitar horas extras' })
  createMyOvertimeRequest(@Body() dto: CreateOvertimeRequestDto) {
    return this.service.createMyOvertimeRequest(
      this.getTenantId(),
      this.getUserId(),
      dto,
    );
  }

  @Put('me/work-schedule')
  @RequirePermission(EMPLOYEE_PORTAL_ENTITY_CODE, 'Update')
  @ApiOperation({ summary: 'Guardar mi horario laboral semanal' })
  upsertMyWorkSchedule(@Body() dto: UpsertWorkScheduleDto) {
    return this.service.upsertMyWorkSchedule(
      this.getTenantId(),
      this.getUserId(),
      dto,
    );
  }

  @Put('me/overtime-requests/:requestId')
  @RequirePermission(EMPLOYEE_PORTAL_ENTITY_CODE, 'RequestLeave')
  @ApiOperation({ summary: 'Corregir una de mis solicitudes de horas extras pendientes' })
  @ApiParam({ name: 'requestId', type: 'string' })
  updateMyOvertimeRequest(
    @Param('requestId') requestId: string,
    @Body() dto: UpdateOvertimeRequestDto,
  ) {
    return this.service.updateMyOvertimeRequest(
      this.getTenantId(),
      this.getUserId(),
      requestId,
      dto,
    );
  }

  private getTenantId(): string {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return tenantId;
  }

  private getUserId(): string {
    const userId = this.tenantContext.getCurrentUserId();
    if (!userId) {
      throw new Error('User context is required');
    }
    return userId;
  }
}
