import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  Delete,
  Query,
  HttpCode,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import { VendorsExportService } from './services/vendors-export.service';
import { VendorCreditLedgerService } from './services/vendor-credit-ledger.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { QueryVendorExportDto } from './dto/query-vendor-export.dto';
import { PaginatedVendorDto } from './dto/paginated-vendor.dto';
import { CheckVendorDuplicatesDto } from './dto/check-vendor-duplicates.dto';
import { DeleteVendorResultDto } from './dto/vendor-view.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/vendors')
@ApiTags('Vendors')
@ApiBearerAuth()
export class VendorController {
  constructor(
    private readonly service: VendorService,
    private readonly exportService: VendorsExportService,
    private readonly creditLedger: VendorCreditLedgerService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'vendors', action: 'Create' })
  @ApiOperation({ summary: 'Create a new vendor' })
  @ApiBody({ type: CreateVendorDto })
  @ApiResponse({ status: 201, description: 'Vendor created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() dto: CreateVendorDto, @Req() req) {
    return this.service.create(dto, req.user.tenantId);
  }

  @Post('duplicates')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'vendors', action: 'Create' })
  @ApiOperation({ summary: 'Detectar proveedores parecidos antes de crear' })
  @ApiBody({ type: CheckVendorDuplicatesDto })
  @ApiResponse({ status: 200, description: 'Coincidencias de nombre, RFC o datos bancarios' })
  findDuplicates(@Body() dto: CheckVendorDuplicatesDto, @Req() req) {
    return this.service.findDuplicates(dto, req.user.tenantId);
  }

  @Post('fiscal-constancia')
  @HttpCode(200)
  @RequireAnyPermissions(
    { entityType: 'vendors', action: 'Create' },
    { entityType: 'vendors', action: 'Update' },
  )
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Leer la constancia del SAT (PDF) y devolver RFC, razón social y domicilio',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Datos fiscales leídos. No se guardan hasta crear o editar.' })
  @ApiResponse({ status: 400, description: 'El PDF no es una constancia legible' })
  readSatConstancia(
    @UploadedFile()
    file: { buffer?: Buffer; mimetype?: string; originalname?: string; size?: number },
  ) {
    if (!file) {
      throw new BadRequestException('Sube el PDF de la constancia del SAT.');
    }
    return this.service.readSatConstancia(file);
  }

  @Get()
  @RequirePermissions({ entityType: 'vendors', action: 'Read' })
  @ApiOperation({ summary: 'Get paginated vendors with search and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'state', required: false, type: String })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'vendor_type', required: false, enum: ['NATIONAL', 'INTERNATIONAL'] })
  @ApiQuery({ name: 'similar_only', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of vendors retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() query: QueryVendorDto, @Req() req): Promise<PaginatedVendorDto> {
    return this.service.findAll(req.user.tenantId, query);
  }

  @Get('export/excel')
  @RequirePermissions({ entityType: 'vendors', action: 'Read' })
  @ApiOperation({ summary: 'Descargar Excel de proveedores' })
  @ApiResponse({ status: 200, description: 'Archivo Excel generado' })
  async exportExcel(
    @Query() query: QueryVendorExportDto,
    @Req() req,
    @Res() res,
  ) {
    const buffer = await this.exportService.exportVendors(req.user.tenantId, query);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.exportService.getFilename()}"`,
    );
    res.send(buffer);
  }

  @Get(':id/accounts')
  @RequirePermissions({ entityType: 'vendors', action: 'Read' })
  @ApiOperation({ summary: 'Dashboard de adeudo y saldo a favor del proveedor' })
  @ApiParam({ name: 'id', type: 'string', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Totales por moneda y kardex' })
  getAccounts(@Param('id') id: string, @Req() req) {
    return this.creditLedger.describeAccounts(req.user.tenantId, id);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'vendors', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific vendor by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Vendor retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Put(':id')
  @RequirePermissions({ entityType: 'vendors', action: 'Update' })
  @ApiOperation({ summary: 'Update an existing vendor' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateVendorDto })
  @ApiResponse({ status: 200, description: 'Vendor updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(@Param('id') id: string, @Body() dto: UpdateVendorDto, @Req() req) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'vendors', action: 'Delete' })
  @ApiOperation({
    summary: 'Eliminar proveedor. Si hay compras y un parecido, reasigna las OC y borra el duplicado.',
  })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Eliminado, consolidado o desactivado', type: DeleteVendorResultDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string, @Req() req): Promise<DeleteVendorResultDto> {
    return this.service.remove(id, req.user.tenantId);
  }
}
