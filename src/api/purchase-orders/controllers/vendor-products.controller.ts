import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantModuleValidationGuard } from '../../auth/tenant-module-validation.guard';
import { VendorProductsService } from '../services/vendor-products.service';

@Controller('tenant/vendors')
@UseGuards(JwtAuthGuard, TenantModuleValidationGuard)
export class VendorProductsController {
  constructor(private readonly vendorProductsService: VendorProductsService) {}

  @Get(':vendorId/products')
  async getVendorProducts(@Param('vendorId') vendorId: string, @Req() req: any) {
    const tenantId = req.user.tenant_id;
    return this.vendorProductsService.getVendorProducts(vendorId, tenantId);
  }
}
