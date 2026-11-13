import {
  Controller,
  Get,
  Inject,
  forwardRef,
  Post,
  Patch,
  Put,
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
import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../rbac/decorators/require-permissions.decorator';
import { PosShiftsService } from './pos-shifts.service';
import { QuotationAdvanceInvoiceService } from '../quotations/services/quotation-advance-invoice.service';
import { ValidateSellerCodeDto } from './dto/validate-seller-code.dto';
import { OpenDailyShiftDto } from './dto/open-daily-shift.dto';
import { CreatePartialShiftDto } from './dto/create-partial-shift.dto';
import { QueryDailyShiftDto } from './dto/query-daily-shift.dto';
import { QueryPosBranchDto } from './dto/query-pos-branch.dto';
import { CloseDailyShiftDto } from './dto/close-daily-shift.dto';
import { CollectPosSaleDto } from './dto/collect-pos-sale.dto';
import { QueryCollectedSalesDto } from './dto/query-collected-sales.dto';
import { ReplacePosSaleCartDto } from './dto/replace-pos-sale-cart.dto';
import { SendQuotationToCajaDto } from './dto/send-quotation-to-caja.dto';

@ApiTags('POS - Shifts')
@Controller('tenant/pos')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class PosShiftsController {
  constructor(
    private readonly posShiftsService: PosShiftsService,
    @Inject(forwardRef(() => QuotationAdvanceInvoiceService))
    private readonly quotationAdvances: QuotationAdvanceInvoiceService,
  ) {}

  @Post('validate-seller-code')
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Read' },
    { entityType: 'pos', action: 'Read' },
    { entityType: 'pos', action: 'Create' },
    { entityType: 'pos', action: 'Update' },
  )
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
      dto.billing_branch_id,
    );
  }

  @Get('daily-shift/current')
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Read' },
    { entityType: 'pos', action: 'Read' },
    { entityType: 'pos', action: 'Create' },
    { entityType: 'pos', action: 'Update' },
  )
  @ApiOperation({
    summary: 'Obtener corte global abierto de la sucursal',
    description:
      'Si el corte abierto es de un día anterior, incluye unclosed_shift_alert para forzar el cierre antes de continuar.',
  })
  async getCurrentDailyShift(@Query() query: QueryPosBranchDto, @Req() req: any) {
    return this.posShiftsService.getCurrentDailyShiftResponse(
      req.user.tenant_id,
      req.user.id,
      query.billing_branch_id,
    );
  }

  @Post('daily-shift/open')
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Create' },
    { entityType: 'pos', action: 'Update' },
  )
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
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Read' },
    { entityType: 'pos', action: 'Update' },
  )
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
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Update' },
    { entityType: 'pos', action: 'Update' },
  )
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
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Update' },
    { entityType: 'pos', action: 'Update' },
  )
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
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Read' },
    { entityType: 'pos', action: 'Update' },
  )
  @ApiOperation({
    summary: 'Ventas y anticipos pendientes de cobro',
    description:
      'Solo terminal COBRANZA. Órdenes Surtida + Pendiente y cotizaciones con anticipo por cobrar de la sucursal.',
  })
  async getPendingSales(@Query() query: QueryPosBranchDto, @Req() req: any) {
    const sales = await this.posShiftsService.getPendingSales(
      req.user.tenant_id,
      req.user.id,
      query.billing_branch_id,
    );
    return { pending_sales: sales };
  }

  @Get('sales-in-progress')
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Read' },
    { entityType: 'pos', action: 'Read' },
    { entityType: 'pos', action: 'Create' },
    { entityType: 'pos', action: 'Update' },
  )
  @ApiOperation({
    summary: 'Tickets POS reintegrados a ventas',
    description: 'Solo terminal VENTAS. Órdenes pos_stage=ventas de la sucursal.',
  })
  async getSalesInProgress(@Query() query: QueryPosBranchDto, @Req() req: any) {
    const sales = await this.posShiftsService.getSalesInProgress(
      req.user.tenant_id,
      req.user.id,
      query.billing_branch_id,
    );
    return { sales_in_progress: sales };
  }

  @Get('collected-sales')
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Read' },
    { entityType: 'pos', action: 'Update' },
  )
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
      query.billing_branch_id,
    );
  }

  @Post('sales/:salesOrderId/collect')
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Update' },
    { entityType: 'pos', action: 'Update' },
  )
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

  @Post('quotations/:quotationId/collect-advance')
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Update' },
    { entityType: 'pos', action: 'Update' },
  )
  @ApiOperation({
    summary: 'Cobrar anticipo de una cotización',
    description:
      'Cobra el monto pedido en la cotización, lo mete al corte abierto y timbra la factura de anticipo.',
  })
  @ApiBody({ type: CollectPosSaleDto })
  async collectQuotationAdvance(
    @Param('quotationId') quotationId: string,
    @Body() dto: CollectPosSaleDto,
    @Req() req: any,
  ) {
    return this.quotationAdvances.collectFromPos(
      quotationId,
      req.user.tenant_id,
      req.user.id,
      dto,
    );
  }

  @Post('sales/:salesOrderId/return-to-sales')
  @RequirePermissions({ entityType: 'pos', action: 'ReturnToSales' })
  @ApiOperation({
    summary: 'Regresar ticket de caja a ventas',
    description:
      'Solo terminal de caja. El folio sale de pendientes para que Ventas edite productos.',
  })
  async returnSaleToVentas(
    @Param('salesOrderId') salesOrderId: string,
    @Req() req: any,
  ) {
    return this.posShiftsService.returnSaleToVentas(
      req.user.tenant_id,
      req.user.id,
      salesOrderId,
    );
  }

  @Post('quotations/:quotationId/return-to-sales')
  @RequirePermissions({ entityType: 'pos', action: 'ReturnToSales' })
  @ApiOperation({
    summary: 'Regresar anticipo de caja a ventas',
    description:
      'Solo terminal de caja. La cotización sale de por cobrar para que Ventas corrija y la reenvíe.',
  })
  async returnQuotationToVentas(
    @Param('quotationId') quotationId: string,
    @Req() req: any,
  ) {
    return this.posShiftsService.returnQuotationToVentas(
      req.user.tenant_id,
      req.user.id,
      quotationId,
    );
  }

  @Put('sales/:salesOrderId/cart')
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Read' },
    { entityType: 'pos', action: 'Read' },
    { entityType: 'pos', action: 'Create' },
    { entityType: 'pos', action: 'Update' },
  )
  @ApiOperation({
    summary: 'Reemplazar carrito de un ticket en ventas',
    description: 'Solo terminal VENTAS y pos_stage=ventas. Ajusta inventario.',
  })
  @ApiBody({ type: ReplacePosSaleCartDto })
  async replaceSaleCart(
    @Param('salesOrderId') salesOrderId: string,
    @Body() dto: ReplacePosSaleCartDto,
    @Req() req: any,
  ) {
    return this.posShiftsService.replaceSaleCart(
      req.user.tenant_id,
      req.user.id,
      salesOrderId,
      dto,
    );
  }

  @Post('sales/:salesOrderId/send-to-caja')
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Read' },
    { entityType: 'pos', action: 'Read' },
    { entityType: 'pos', action: 'Create' },
    { entityType: 'pos', action: 'Update' },
  )
  @ApiOperation({
    summary: 'Reenviar ticket editado a caja',
    description: 'Solo terminal VENTAS. El folio vuelve a pendientes de cobro.',
  })
  async sendSaleToCaja(
    @Param('salesOrderId') salesOrderId: string,
    @Req() req: any,
  ) {
    return this.posShiftsService.sendSaleToCaja(
      req.user.tenant_id,
      req.user.id,
      salesOrderId,
    );
  }

  @Post('quotations/:quotationId/send-to-caja')
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Read' },
    { entityType: 'pos', action: 'Read' },
    { entityType: 'pos', action: 'Create' },
    { entityType: 'pos', action: 'Update' },
  )
  @ApiOperation({
    summary: 'Reenviar anticipo de cotización a caja',
    description:
      'Solo terminal VENTAS y pos_stage=ventas. Puede corregir productos y el monto del anticipo.',
  })
  @ApiBody({ type: SendQuotationToCajaDto })
  async sendQuotationToCaja(
    @Param('quotationId') quotationId: string,
    @Body() dto: SendQuotationToCajaDto,
    @Req() req: any,
  ) {
    return this.posShiftsService.sendQuotationToCaja(
      req.user.tenant_id,
      req.user.id,
      quotationId,
      dto,
    );
  }

  @Get('sales/:salesOrderId/collection')
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Read' },
    { entityType: 'pos', action: 'Read' },
    { entityType: 'pos', action: 'Create' },
    { entityType: 'pos', action: 'Update' },
  )
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
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Read' },
    { entityType: 'pos', action: 'Read' },
    { entityType: 'pos', action: 'Create' },
    { entityType: 'pos', action: 'Update' },
  )
  @ApiOperation({
    summary: 'Ticket térmico ESC/POS de venta cobrada',
    description:
      'Devuelve el ticket guardado al cobrar. Si la venta ya está cobrada y el archivo no existe, lo genera.',
  })
  async getSaleReceipt(
    @Param('salesOrderId') salesOrderId: string,
    @Req() req: any,
  ) {
    return this.posShiftsService.getSaleReceipt(
      req.user.tenant_id,
      salesOrderId,
      req.user.id,
    );
  }

  @Get('sales/:salesOrderId/receipt/raw')
  @RequireAnyPermissions(
    { entityType: 'PosShift', action: 'Read' },
    { entityType: 'pos', action: 'Read' },
    { entityType: 'pos', action: 'Create' },
    { entityType: 'pos', action: 'Update' },
  )
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
