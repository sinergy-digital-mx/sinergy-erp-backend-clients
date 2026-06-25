import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PosShiftsService } from './pos-shifts.service';
import { ValidateSellerCodeDto } from './dto/validate-seller-code.dto';
import { OpenDailyShiftDto } from './dto/open-daily-shift.dto';
import { CreatePartialShiftDto } from './dto/create-partial-shift.dto';
import { QueryDailyShiftDto } from './dto/query-daily-shift.dto';
import { CloseDailyShiftDto } from './dto/close-daily-shift.dto';
import { CollectPosSaleDto } from './dto/collect-pos-sale.dto';
import { QueryCollectedSalesDto } from './dto/query-collected-sales.dto';

@ApiTags('POS - Shifts')
@Controller('tenant/pos')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class PosShiftsController {
  constructor(private readonly posShiftsService: PosShiftsService) {}

  @Post('validate-seller-code')
  @RequirePermissions({ entityType: 'PosShift', action: 'Read' })
  @ApiOperation({
    summary: 'Validar código de vendedor',
    description:
      'El usuario POS autenticado envía el código numérico del vendedor y recibe su información',
  })
  @ApiBody({ type: ValidateSellerCodeDto })
  async validateSellerCode(@Body() dto: ValidateSellerCodeDto, @Req() req: any) {
    return this.posShiftsService.validateSellerCode(
      req.user.tenant_id,
      req.user.id,
      dto.code,
    );
  }

  @Get('daily-shift/current')
  @RequirePermissions({ entityType: 'PosShift', action: 'Read' })
  @ApiOperation({ summary: 'Obtener corte global abierto del día para la terminal actual' })
  async getCurrentDailyShift(@Req() req: any) {
    const shift = await this.posShiftsService.getCurrentDailyShift(
      req.user.tenant_id,
      req.user.id,
    );

    return {
      daily_shift: shift
        ? await this.posShiftsService.findDailyShiftById(shift.id, req.user.tenant_id)
        : null,
    };
  }

  @Post('daily-shift/open')
  @RequirePermissions({ entityType: 'PosShift', action: 'Create' })
  @ApiOperation({
    summary: 'Abrir corte global del día',
    description: 'Solo terminales POS de tipo COBRANZA',
  })
  async openDailyShift(@Body() dto: OpenDailyShiftDto, @Req() req: any) {
    const { shift, queued_sales_assigned } = await this.posShiftsService.openDailyShift(
      req.user.tenant_id,
      req.user.id,
      dto,
    );

    return {
      message: 'Corte global abierto correctamente',
      daily_shift: shift,
      queued_sales_assigned,
    };
  }

  @Get('daily-shifts')
  @RequirePermissions({ entityType: 'PosShift', action: 'Read' })
  @ApiOperation({ summary: 'Listar cortes globales' })
  async findDailyShifts(@Query() query: QueryDailyShiftDto, @Req() req: any) {
    const shifts = await this.posShiftsService.findDailyShifts(
      req.user.tenant_id,
      query,
    );
    return { daily_shifts: shifts };
  }

  @Get('daily-shift/:id')
  @RequirePermissions({ entityType: 'PosShift', action: 'Read' })
  @ApiParam({ name: 'id', description: 'Daily shift ID' })
  async findDailyShiftById(@Param('id') id: string, @Req() req: any) {
    return {
      daily_shift: await this.posShiftsService.findDailyShiftById(
        id,
        req.user.tenant_id,
      ),
    };
  }

  @Post('daily-shift/:id/partial-shifts')
  @RequirePermissions({ entityType: 'PosShift', action: 'Update' })
  @ApiOperation({ summary: 'Registrar corte parcial con denominaciones' })
  async createPartialShift(
    @Param('id') id: string,
    @Body() dto: CreatePartialShiftDto,
    @Req() req: any,
  ) {
    const partial = await this.posShiftsService.createPartialShift(
      req.user.tenant_id,
      req.user.id,
      id,
      dto,
    );

    return {
      message: 'Corte parcial registrado correctamente',
      partial_shift: partial,
    };
  }

  @Patch('daily-shift/:id/close')
  @RequirePermissions({ entityType: 'PosShift', action: 'Update' })
  @ApiOperation({ summary: 'Cerrar corte global del día' })
  async closeDailyShift(
    @Param('id') id: string,
    @Body() dto: CloseDailyShiftDto,
    @Req() req: any,
  ) {
    const shift = await this.posShiftsService.closeDailyShift(
      req.user.tenant_id,
      req.user.id,
      id,
      dto,
    );

    return {
      message: 'Corte global cerrado correctamente',
      daily_shift: shift,
    };
  }

  @Get('pending-sales')
  @RequirePermissions({ entityType: 'PosShift', action: 'Read' })
  @ApiOperation({
    summary: 'Ventas pendientes de cobro',
    description: 'Solo terminal COBRANZA. Órdenes Surtida + Pendiente de la sucursal.',
  })
  async getPendingSales(@Req() req: any) {
    const sales = await this.posShiftsService.getPendingSales(
      req.user.tenant_id,
      req.user.id,
    );
    return { pending_sales: sales };
  }

  @Get('collected-sales')
  @RequirePermissions({ entityType: 'PosShift', action: 'Read' })
  @ApiOperation({
    summary: 'Ventas cobradas del corte',
    description:
      'Solo terminal COBRANZA. Lista órdenes ya cobradas del corte abierto de la sucursal (o de daily_shift_id indicado).',
  })
  async getCollectedSales(@Query() query: QueryCollectedSalesDto, @Req() req: any) {
    return this.posShiftsService.getCollectedSales(
      req.user.tenant_id,
      req.user.id,
      query.daily_shift_id,
    );
  }

  @Post('sales/:salesOrderId/collect')
  @RequirePermissions({ entityType: 'PosShift', action: 'Update' })
  @ApiOperation({
    summary: 'Cobrar venta pendiente',
    description:
      'Solo terminal COBRANZA. Registra método de pago, cliente y marca la orden como Pagada.',
  })
  @ApiBody({ type: CollectPosSaleDto })
  async collectSale(
    @Param('salesOrderId') salesOrderId: string,
    @Body() dto: CollectPosSaleDto,
    @Req() req: any,
  ) {
    return this.posShiftsService.collectSale(
      req.user.tenant_id,
      req.user.id,
      salesOrderId,
      dto,
    );
  }

  @Get('sales/:salesOrderId/collection')
  @RequirePermissions({ entityType: 'PosShift', action: 'Read' })
  @ApiOperation({ summary: 'Detalle de cobro de una venta POS' })
  async getSaleCollection(
    @Param('salesOrderId') salesOrderId: string,
    @Req() req: any,
  ) {
    return this.posShiftsService.getSaleCollection(
      req.user.tenant_id,
      salesOrderId,
    );
  }

  @Get('sales/:salesOrderId/receipt')
  @RequirePermissions({ entityType: 'PosShift', action: 'Read' })
  @ApiOperation({
    summary: 'Ticket térmico ESC/POS de venta cobrada',
    description:
      'Devuelve el ticket ya guardado al cobrar. No genera tickets nuevos (404 si no existe).',
  })
  async getSaleReceipt(
    @Param('salesOrderId') salesOrderId: string,
    @Req() req: any,
  ) {
    return this.posShiftsService.getSaleReceipt(
      req.user.tenant_id,
      salesOrderId,
    );
  }

  @Get('sales/:salesOrderId/receipt/raw')
  @RequirePermissions({ entityType: 'PosShift', action: 'Read' })
  @ApiOperation({
    summary: 'Bytes ESC/POS del ticket (binario)',
    description: 'application/octet-stream para impresión RAW Bixolon.',
  })
  async getSaleReceiptRaw(
    @Param('salesOrderId') salesOrderId: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    return this.posShiftsService.getSaleReceiptRaw(
      req.user.tenant_id,
      salesOrderId,
      res,
    );
  }
}
