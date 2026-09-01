import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { AddInventoryAuditLineDto } from './dto/add-inventory-audit-line.dto';
import { AuthorizeInventoryAuditDto } from './dto/authorize-inventory-audit.dto';
import { CancelInventoryAuditDto } from './dto/cancel-inventory-audit.dto';
import { CreateInventoryAuditDto } from './dto/create-inventory-audit.dto';
import { InventoryAuditContextQueryDto } from './dto/inventory-audit-context-query.dto';
import {
  InventoryAuditContextResponseDto,
  InventoryAuditListResponseDto,
  InventoryAuditResponseDto,
} from './dto/inventory-audit-response.dto';
import { QueryInventoryAuditDto } from './dto/query-inventory-audit.dto';
import { RejectInventoryAuditDto } from './dto/reject-inventory-audit.dto';
import { UpdateInventoryAuditLinesDto } from './dto/update-inventory-audit-lines.dto';
import { InventoryAuditService } from './services/inventory-audit.service';

@Controller('tenant/inventory/audits')
@ApiTags('Inventory Audits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InventoryAuditController {
  constructor(private readonly auditService: InventoryAuditService) {}

  @Get('context')
  @RequirePermissions({ entityType: 'Inventory', action: 'Count' })
  @ApiOperation({
    summary: 'Contexto para iniciar un conteo',
    description:
      'Lotes del almacén, ubicación y si ya hay una auditoría abierta. Requiere Inventory:Count.',
  })
  @ApiResponse({ status: 200, type: InventoryAuditContextResponseDto })
  getContext(
    @Query() query: InventoryAuditContextQueryDto,
    @Req() req: any,
  ): Promise<InventoryAuditContextResponseDto> {
    return this.auditService.getContext(
      req.user.tenant_id,
      query.warehouse_id,
      query.product_id,
    );
  }

  @Get()
  @RequirePermissions({ entityType: 'Inventory', action: 'Read' })
  @ApiOperation({ summary: 'Listar auditorías de inventario por lote' })
  @ApiResponse({ status: 200, type: InventoryAuditListResponseDto })
  findAll(
    @Query() filters: QueryInventoryAuditDto,
    @Req() req: any,
  ): Promise<InventoryAuditListResponseDto> {
    return this.auditService.findAll(req.user.tenant_id, filters);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Inventory', action: 'Read' })
  @ApiOperation({ summary: 'Detalle de una auditoría con líneas por lote' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: InventoryAuditResponseDto })
  findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<InventoryAuditResponseDto> {
    return this.auditService.findById(id, req.user.tenant_id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions({ entityType: 'Inventory', action: 'Count' })
  @ApiOperation({
    summary: 'Crear auditoría (snapshot de lotes)',
    description:
      'Congela la existencia de cada lote del almacén (o de un producto) y deja el documento en borrador.',
  })
  @ApiResponse({ status: 201, type: InventoryAuditResponseDto })
  create(
    @Body() dto: CreateInventoryAuditDto,
    @Req() req: any,
  ): Promise<InventoryAuditResponseDto> {
    return this.auditService.create(dto, req.user.tenant_id, req.user.id);
  }

  @Patch(':id/lines')
  @RequirePermissions({ entityType: 'Inventory', action: 'Count' })
  @ApiOperation({
    summary: 'Capturar cantidades contadas',
    description: 'Solo en borrador. El motivo es obligatorio si hay diferencia al enviar.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: InventoryAuditResponseDto })
  updateLines(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryAuditLinesDto,
    @Req() req: any,
  ): Promise<InventoryAuditResponseDto> {
    return this.auditService.updateLines(id, dto, req.user.tenant_id, req.user.id);
  }

  @Post(':id/lines')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions({ entityType: 'Inventory', action: 'Count' })
  @ApiOperation({
    summary: 'Agregar un lote extra al conteo',
    description: 'Útil para lotes en cero que no entraron al snapshot. Solo en borrador.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, type: InventoryAuditResponseDto })
  addLine(
    @Param('id') id: string,
    @Body() dto: AddInventoryAuditLineDto,
    @Req() req: any,
  ): Promise<InventoryAuditResponseDto> {
    return this.auditService.addLine(id, dto, req.user.tenant_id);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ entityType: 'Inventory', action: 'Count' })
  @ApiOperation({
    summary: 'Enviar a autorización',
    description: 'Todas las líneas deben estar contadas. Diferencias requieren motivo.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: InventoryAuditResponseDto })
  submit(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<InventoryAuditResponseDto> {
    return this.auditService.submit(id, req.user.tenant_id, req.user.id);
  }

  @Post(':id/authorize')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ entityType: 'Inventory', action: 'Authorize' })
  @ApiOperation({
    summary: 'Autorizar y aplicar corrección',
    description:
      'Pone available_quantity de cada lote igual a la cantidad contada. Requiere Inventory:Authorize.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: InventoryAuditResponseDto })
  authorize(
    @Param('id') id: string,
    @Body() dto: AuthorizeInventoryAuditDto,
    @Req() req: any,
  ): Promise<InventoryAuditResponseDto> {
    return this.auditService.authorize(id, dto, req.user.tenant_id, req.user.id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ entityType: 'Inventory', action: 'Authorize' })
  @ApiOperation({
    summary: 'Rechazar auditoría',
    description: 'Vuelve a borrador para recapturar. Requiere Inventory:Authorize.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: InventoryAuditResponseDto })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectInventoryAuditDto,
    @Req() req: any,
  ): Promise<InventoryAuditResponseDto> {
    return this.auditService.reject(id, dto, req.user.tenant_id, req.user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ entityType: 'Inventory', action: 'Count' })
  @ApiOperation({
    summary: 'Cancelar auditoría',
    description: 'No aplica correcciones. Solo borrador o en revisión.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: InventoryAuditResponseDto })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelInventoryAuditDto,
    @Req() req: any,
  ): Promise<InventoryAuditResponseDto> {
    return this.auditService.cancel(id, dto, req.user.tenant_id, req.user.id);
  }
}
