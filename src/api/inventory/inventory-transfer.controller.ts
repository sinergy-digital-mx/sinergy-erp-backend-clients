import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { InventoryTransferService } from './services/inventory-transfer.service';
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
  constructor(private readonly transferService: InventoryTransferService) {}

  @Get('context')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({
    summary: 'Contexto para modal de transferencia',
    description:
      'Devuelve lotes disponibles, stock totalizado y almacén/sucursal de origen para un producto+almacén',
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
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Listar transferencias de inventario' })
  @ApiResponse({ status: 200, type: InventoryTransferListResponseDto })
  findAll(
    @Query() filters: QueryInventoryTransferDto,
    @Req() req: any,
  ): Promise<InventoryTransferListResponseDto> {
    return this.transferService.findAll(req.user.tenant_id, filters);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'inventory', action: 'read' })
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
  @RequirePermissions({ entityType: 'inventory', action: 'write' })
  @ApiOperation({
    summary: 'Crear transferencia de inventario',
    description:
      'Toma cantidad de uno o más lotes en almacén origen y crea lotes destino en el almacén de llegada',
  })
  @ApiResponse({ status: 201, type: InventoryTransferResponseDto })
  create(
    @Body() dto: CreateInventoryTransferDto,
    @Req() req: any,
  ): Promise<InventoryTransferResponseDto> {
    return this.transferService.create(dto, req.user.tenant_id, req.user.id);
  }
}
