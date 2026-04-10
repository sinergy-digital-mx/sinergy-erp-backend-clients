import {
  Controller, Post, Get, Delete, Body, Param, Query,
  UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantModuleValidationGuard } from '../../auth/tenant-module-validation.guard';
import { SalesOrderService } from '../services/sales-order.service';
import { CreateSalesOrderDto, QuerySalesOrderDto, FulfillSalesOrderDto } from '../dto';

@ApiTags('Sales Orders')
@Controller('tenant/sales-orders')
@UseGuards(JwtAuthGuard, TenantModuleValidationGuard)
@ApiBearerAuth()
export class SalesOrderController {
  constructor(private readonly salesOrderService: SalesOrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new sales order' })
  async create(@Body() dto: CreateSalesOrderDto, @Req() req: any) {
    return this.salesOrderService.create(dto, req.user.tenant_id, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List sales orders with filters and pagination' })
  async findAll(@Query() filters: QuerySalesOrderDto, @Req() req: any) {
    return this.salesOrderService.findAll(req.user.tenant_id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single sales order with line items and batch allocations' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const so = await this.salesOrderService.findOne(id, req.user.tenant_id);
    return {
      data: {
        header: so,
        line_items: so.line_items ?? [],
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
