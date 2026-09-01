import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permissions.decorator';
import { ProductVendorImportService } from './services/product-vendor-import.service';
import { QueryVendorCostImportDto } from './dto/query-vendor-cost-import.dto';
import { QueryVendorPriceImportDto } from './dto/query-vendor-price-import.dto';

@ApiTags('Product Vendor Import')
@ApiBearerAuth()
@Controller('tenant/products/import')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductVendorImportController {
  constructor(private readonly importService: ProductVendorImportService) {}

  @Get('vendor-costs/preview')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Conteo de productos con costo de un proveedor' })
  previewCosts(@Query() query: QueryVendorCostImportDto, @Request() req) {
    return this.importService.previewCosts(req.user.tenant_id, query.vendor_id);
  }

  @Get('vendor-costs/template')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Descargar template Excel de costos por proveedor' })
  @ApiResponse({ status: 200, description: 'Archivo Excel generado' })
  async exportCostTemplate(
    @Query() query: QueryVendorCostImportDto,
    @Request() req,
    @Res() res,
  ) {
    const { buffer, filename } = await this.importService.exportCostTemplate(
      req.user.tenant_id,
      query.vendor_id,
    );
    this.sendExcel(res, buffer, filename);
  }

  @Post('vendor-costs')
  @RequirePermission('Product', 'Update')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importar costos por proveedor desde el template' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'vendor_id'],
      properties: {
        file: { type: 'string', format: 'binary' },
        vendor_id: { type: 'string', format: 'uuid' },
      },
    },
  })
  importCosts(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: QueryVendorCostImportDto,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('Adjunta el archivo Excel descargado');
    }
    return this.importService.importCosts(req.user.tenant_id, dto.vendor_id, file);
  }

  @Get('vendor-prices/preview')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Conteo de productos del proveedor para una lista de precios' })
  previewPrices(@Query() query: QueryVendorPriceImportDto, @Request() req) {
    return this.importService.previewPrices(
      req.user.tenant_id,
      query.vendor_id,
      query.price_list_id,
    );
  }

  @Get('vendor-prices/template')
  @RequirePermission('Product', 'Update')
  @ApiOperation({ summary: 'Descargar template Excel de precios por proveedor' })
  @ApiResponse({ status: 200, description: 'Archivo Excel generado' })
  async exportPriceTemplate(
    @Query() query: QueryVendorPriceImportDto,
    @Request() req,
    @Res() res,
  ) {
    const { buffer, filename } = await this.importService.exportPriceTemplate(
      req.user.tenant_id,
      query.vendor_id,
      query.price_list_id,
    );
    this.sendExcel(res, buffer, filename);
  }

  @Post('vendor-prices')
  @RequirePermission('Product', 'Update')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importar precios por proveedor desde el template' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'vendor_id', 'price_list_id'],
      properties: {
        file: { type: 'string', format: 'binary' },
        vendor_id: { type: 'string', format: 'uuid' },
        price_list_id: { type: 'string', format: 'uuid' },
      },
    },
  })
  importPrices(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: QueryVendorPriceImportDto,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('Adjunta el archivo Excel descargado');
    }
    return this.importService.importPrices(
      req.user.tenant_id,
      dto.vendor_id,
      dto.price_list_id,
      file,
    );
  }

  private sendExcel(res: any, buffer: Buffer, filename: string): void {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
