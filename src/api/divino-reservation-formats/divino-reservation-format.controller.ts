import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Response,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { DivinoReservationFormatService } from './divino-reservation-format.service';
import { CreateDivinoReservationFormatDto } from './dto/create-divino-reservation-format.dto';
import { UpdateDivinoReservationFormatDto } from './dto/update-divino-reservation-format.dto';
import { QueryDivinoReservationFormatDto } from './dto/query-divino-reservation-format.dto';
import { SendDivinoReservationFormatDto } from './dto/send-divino-reservation-format.dto';
import { DIVINO_RESERVATION_ENTITY_CODE } from './divino-reservation-formats.constants';

@ApiTags('Divino Reservation Formats')
@ApiBearerAuth()
@Controller('tenant/divino-reservation-formats')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DivinoReservationFormatController {
  constructor(
    private readonly service: DivinoReservationFormatService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermission(DIVINO_RESERVATION_ENTITY_CODE, 'Create')
  @ApiOperation({ summary: 'Crear un nuevo formato de reservación Divino' })
  @ApiResponse({ status: 201, description: 'Formato creado' })
  create(@Body() dto: CreateDivinoReservationFormatDto) {
    return this.service.create(
      this.getTenantId(),
      dto,
      this.tenantContext.getCurrentUserId(),
    );
  }

  @Get()
  @RequirePermission(DIVINO_RESERVATION_ENTITY_CODE, 'Read')
  @ApiOperation({
    summary: 'Listar formatos de reservación con búsqueda y paginación',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(@Query() query: QueryDivinoReservationFormatDto) {
    return this.service.findAll(this.getTenantId(), query);
  }

  @Get(':id')
  @RequirePermission(DIVINO_RESERVATION_ENTITY_CODE, 'Read')
  @ApiOperation({ summary: 'Obtener un formato de reservación por ID' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(this.getTenantId(), id);
  }

  @Get(':id/pdf')
  @RequirePermission(DIVINO_RESERVATION_ENTITY_CODE, 'Read')
  @ApiOperation({ summary: 'Generar el PDF del formato de reservación' })
  @ApiParam({ name: 'id', type: 'string' })
  async generatePdf(@Param('id') id: string, @Response() res: any) {
    const buffer = await this.service.generatePdf(this.getTenantId(), id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="formato-reservacion-${id}.pdf"`,
    );
    res.send(buffer);
  }

  @Post(':id/send')
  @RequirePermission(DIVINO_RESERVATION_ENTITY_CODE, 'Send')
  @ApiOperation({
    summary: 'Enviar el formato de reservación por correo con el PDF adjunto',
  })
  @ApiParam({ name: 'id', type: 'string' })
  send(
    @Param('id') id: string,
    @Body() dto: SendDivinoReservationFormatDto,
  ) {
    return this.service.send(
      this.getTenantId(),
      id,
      dto,
      this.tenantContext.getCurrentUserId(),
    );
  }

  @Put(':id')
  @RequirePermission(DIVINO_RESERVATION_ENTITY_CODE, 'Update')
  @ApiOperation({ summary: 'Actualizar un formato de reservación' })
  @ApiParam({ name: 'id', type: 'string' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDivinoReservationFormatDto,
  ) {
    return this.service.update(this.getTenantId(), id, dto);
  }

  @Delete(':id')
  @RequirePermission(DIVINO_RESERVATION_ENTITY_CODE, 'Delete')
  @ApiOperation({ summary: 'Eliminar un formato de reservación' })
  @ApiParam({ name: 'id', type: 'string' })
  async remove(@Param('id') id: string) {
    await this.service.remove(this.getTenantId(), id);
    return { success: true };
  }

  private getTenantId(): string {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return tenantId;
  }
}
