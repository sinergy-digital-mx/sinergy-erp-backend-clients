import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  Delete,
  Query,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { PaginatedVendorDto } from './dto/paginated-vendor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/vendors')
@ApiTags('Vendors')
@ApiBearerAuth()
export class VendorController {
  constructor(private readonly service: VendorService) {}

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

  @Get()
  @RequirePermissions({ entityType: 'vendors', action: 'Read' })
  @ApiOperation({ summary: 'Get paginated vendors with search and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'state', required: false, type: String })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of vendors retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() query: QueryVendorDto, @Req() req): Promise<PaginatedVendorDto> {
    return this.service.findAll(req.user.tenantId, query);
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
  @ApiOperation({ summary: 'Delete a vendor by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Vendor deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user.tenantId);
  }
}
