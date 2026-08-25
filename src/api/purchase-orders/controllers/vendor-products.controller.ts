import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantModuleValidationGuard } from '../../auth/tenant-module-validation.guard';
import { VendorProductsService } from '../services/vendor-products.service';
import { QueryVendorProductsDto } from '../dto/query-vendor-products.dto';

@ApiTags('Vendor Products')
@Controller('tenant/vendors')
@UseGuards(JwtAuthGuard, TenantModuleValidationGuard)
export class VendorProductsController {
  constructor(private readonly vendorProductsService: VendorProductsService) {}

  @Get(':vendorId/products')
  @ApiOperation({
    summary: 'Catálogo de productos para OC de un proveedor',
    description:
      'Por defecto incluye productos activos sin costo (`has_vendor_cost: false`). ' +
      'Usa only_with_cost=true para el comportamiento anterior.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'include_without_cost', required: false, type: Boolean })
  @ApiQuery({ name: 'only_with_cost', required: false, type: Boolean })
  async getVendorProducts(
    @Param('vendorId') vendorId: string,
    @Query() query: QueryVendorProductsDto,
    @Req() req: any,
  ) {
    return this.vendorProductsService.getVendorProducts(
      vendorId,
      req.user.tenant_id,
      query,
    );
  }
}
