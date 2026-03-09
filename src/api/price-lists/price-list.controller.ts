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
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PriceListService } from './price-list.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { QueryPriceListDto } from './dto/query-price-list.dto';

@Controller('tenant/price-lists')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PriceListController {
  constructor(private readonly priceListService: PriceListService) {}

  @Post()
  @RequirePermissions({ entityType: 'PriceList', action: 'Create' })
  create(@Body() dto: CreatePriceListDto, @Request() req) {
    return this.priceListService.create(dto, req.user.tenantId);
  }

  @Get()
  @RequirePermissions({ entityType: 'PriceList', action: 'Read' })
  findAll(@Query() query: QueryPriceListDto, @Request() req) {
    return this.priceListService.findAll(req.user.tenantId, query);
  }

  @Get('default')
  @RequirePermissions({ entityType: 'PriceList', action: 'Read' })
  getDefault(@Request() req) {
    return this.priceListService.getDefault(req.user.tenantId);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'PriceList', action: 'Read' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.priceListService.findOne(id, req.user.tenantId);
  }

  @Put(':id')
  @RequirePermissions({ entityType: 'PriceList', action: 'Update' })
  update(@Param('id') id: string, @Body() dto: UpdatePriceListDto, @Request() req) {
    return this.priceListService.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @RequirePermissions({ entityType: 'PriceList', action: 'Delete' })
  remove(@Param('id') id: string, @Request() req) {
    return this.priceListService.remove(id, req.user.tenantId);
  }

  // Product Prices endpoints
  @Post('product-prices')
  @RequirePermissions({ entityType: 'PriceList', action: 'Create' })
  addProductPrice(@Body() dto: CreateProductPriceDto, @Request() req) {
    return this.priceListService.addProductPrice(dto, req.user.tenantId);
  }

  @Put('product-prices/:id')
  @RequirePermissions({ entityType: 'PriceList', action: 'Update' })
  updateProductPrice(
    @Param('id') id: string,
    @Body() dto: UpdateProductPriceDto,
    @Request() req,
  ) {
    return this.priceListService.updateProductPrice(id, dto, req.user.tenantId);
  }

  @Delete('product-prices/:id')
  @RequirePermissions({ entityType: 'PriceList', action: 'Delete' })
  removeProductPrice(@Param('id') id: string, @Request() req) {
    return this.priceListService.removeProductPrice(id, req.user.tenantId);
  }

  @Get('products/:productId/prices')
  @RequirePermissions({ entityType: 'PriceList', action: 'Read' })
  getProductPrices(@Param('productId') productId: string, @Request() req) {
    return this.priceListService.getProductPrices(productId, req.user.tenantId);
  }

  @Get(':priceListId/products/:productId/price')
  @RequirePermissions({ entityType: 'PriceList', action: 'Read' })
  getProductPrice(
    @Param('productId') productId: string,
    @Param('priceListId') priceListId: string,
    @Request() req,
  ) {
    return this.priceListService.getProductPrice(productId, priceListId, req.user.tenantId);
  }
}
