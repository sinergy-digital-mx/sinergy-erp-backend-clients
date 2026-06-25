import {
  Controller, Post, Get, Put, Delete, Body, Param, Query,
  UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantModuleValidationGuard } from '../../auth/tenant-module-validation.guard';
import { SalesOrderService } from '../services/sales-order.service';
import { SalesOrderDocumentsService } from '../services/sales-order-documents.service';
import { InventoryService } from '../../inventory/inventory.service';
import { CreateSalesOrderDto, QuerySalesOrderDto, FulfillSalesOrderDto, RegenerateDocumentDto } from '../dto';

@ApiTags('Sales Orders')
@Controller('tenant/sales-orders')
@UseGuards(JwtAuthGuard, TenantModuleValidationGuard)
@ApiBearerAuth()
export class SalesOrderController {
  constructor(
    private readonly salesOrderService: SalesOrderService,
    private readonly documentsService: SalesOrderDocumentsService,
    private readonly inventoryService: InventoryService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new sales order',
    description:
      'Orders with sales_order_type POS are automatically fulfilled (inventory deducted via FIFO) in the same transaction.',
  })
  async create(@Body() dto: CreateSalesOrderDto, @Req() req: any) {
    return this.salesOrderService.create(dto, req.user.tenant_id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace/edit a sales order while it is Creada' })
  async replace(@Param('id') id: string, @Body() dto: CreateSalesOrderDto, @Req() req: any) {
    return this.salesOrderService.replace(id, dto, req.user.tenant_id, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List sales orders with filters and pagination' })
  async findAll(@Query() filters: QuerySalesOrderDto, @Req() req: any) {
    return this.salesOrderService.findAll(req.user.tenant_id, filters);
  }

  @Get('warehouse/:warehouseId/products-summary')
  @ApiOperation({ summary: 'Get summarized inventory products for a warehouse' })
  async getWarehouseProductsSummary(
    @Param('warehouseId') warehouseId: string,
    @Req() req: any,
  ) {
    return this.inventoryService.getInventorySummary(req.user.tenant_id, {
      warehouse_id: warehouseId,
      only_available: true,
      page: 1,
      limit: 500,
    });
  }

  @Post(':id/regenerate-documento-original')
  @ApiOperation({ summary: 'Regenerate DOCUMENTO_ORIGINAL PDF with selected language' })
  async regenerateDocumentoOriginal(
    @Param('id') id: string,
    @Body() dto: RegenerateDocumentDto,
    @Req() req: any,
  ) {
    return this.salesOrderService.regenerateDocumentoOriginal(
      id,
      req.user.tenant_id,
      req.user.id,
      dto.language,
      dto.keep_previous ?? false,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single sales order with line items, documents and POS collection',
  })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const detail = await this.salesOrderService.findOneDetail(id, req.user.tenant_id);
    const documents = await this.documentsService.getDocuments(id);
    const lineItems = (detail.sales_order.line_items ?? []).map((lineItem: any) => ({
      ...lineItem,
      uom_name: lineItem.product_uom?.uom?.name ?? null,
      base_uom_name: lineItem.base_uom?.name ?? null,
    }));

    return {
      data: {
        header: detail.header,
        line_items: lineItems,
        documents,
        pos_collection: detail.pos_collection,
      },
    };
  }

  @Post(':id/fulfill')
  @ApiOperation({ summary: 'Fulfill (surtir) a sales order — runs FIFO batch allocation' })
  async fulfill(
    @Param('id') id: string,
    @Body() dto: FulfillSalesOrderDto,
    @Req() req: any,
  ) {
    return this.salesOrderService.fulfill(id, dto, req.user.tenant_id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a sales order — releases inventory if already fulfilled' })
  async cancel(@Param('id') id: string, @Req() req: any) {
    return this.salesOrderService.cancel(id, req.user.tenant_id, req.user.id);
  }
}
