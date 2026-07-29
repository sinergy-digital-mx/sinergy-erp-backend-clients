import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiProduces,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { InventoryTransferService } from './services/inventory-transfer.service';
import { InventoryTransferPdfService } from './services/inventory-transfer-pdf.service';
import { CreateInventoryTransferDto } from './dto/create-inventory-transfer.dto';
import { QueryInventoryTransferDto } from './dto/query-inventory-transfer.dto';
import { TransferContextQueryDto } from './dto/transfer-context-query.dto';
import {
  InventoryTransferListResponseDto,
  InventoryTransferResponseDto,
} from './dto/inventory-transfer-response.dto';
import { TransferContextResponseDto } from './dto/transfer-context-response.dto';

@Controller('tenant/inventory/transfers')
@ApiTags('Inventory Transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InventoryTransferController {
  constructor(
    private readonly transferService: InventoryTransferService,
    private readonly transferPdfService: InventoryTransferPdfService,
  ) {}

  @Get('context')
  @RequirePermissions({ entityType: 'Inventory', action: 'Transfer' })
  @ApiOperation({
    summary: 'Contexto para modal de transferencia',
    description:
      'Devuelve lotes disponibles, stock totalizado y almacén/sucursal de origen para un producto+almacén. Requiere Inventory:Transfer.',
  })
  @ApiResponse({ status: 200, type: TransferContextResponseDto })
  getContext(
    @Query() query: TransferContextQueryDto,
    @Req() req: any,
  ): Promise<TransferContextResponseDto> {
    return this.transferService.getTransferContext(
      req.user.tenant_id,
      query.product_id,
      query.warehouse_id,
    );
  }

  @Get()
  @RequirePermissions({ entityType: 'Inventory', action: 'Read' })
  @ApiOperation({ summary: 'Listar transferencias de inventario' })
  @ApiResponse({ status: 200, type: InventoryTransferListResponseDto })
  findAll(
    @Query() filters: QueryInventoryTransferDto,
    @Req() req: any,
  ): Promise<InventoryTransferListResponseDto> {
    return this.transferService.findAll(req.user.tenant_id, filters);
  }

  @Get(':id/pdf')
  @RequirePermissions({ entityType: 'Inventory', action: 'Read' })
  @ApiOperation({
    summary: 'Descargar PDF de transferencia',
    description:
      'Comprobante PDF con folio, usuario, fecha, ruta origen→destino, producto y líneas de lotes',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF generado' })
  async downloadPdf(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    const { buffer, filename } = await this.transferPdfService.generatePdf(
      id,
      req.user.tenant_id,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Inventory', action: 'Read' })
  @ApiOperation({ summary: 'Detalle de una transferencia' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: InventoryTransferResponseDto })
  findOne(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<InventoryTransferResponseDto> {
    return this.transferService.findById(id, req.user.tenant_id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions({ entityType: 'Inventory', action: 'Transfer' })
  @ApiOperation({
    summary: 'Crear transferencia de inventario',
    description:
      'Toma cantidad de uno o más lotes en almacén origen y crea lotes destino. Requiere Inventory:Transfer (no Write genérico).',
  })
  @ApiResponse({ status: 201, type: InventoryTransferResponseDto })
  create(
    @Body() dto: CreateInventoryTransferDto,
    @Req() req: any,
  ): Promise<InventoryTransferResponseDto> {
    return this.transferService.create(dto, req.user.tenant_id, req.user.id);
  }
}
