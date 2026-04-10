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
import { PosConfigurationService } from './pos-configuration.service';
import { CreatePosConfigurationDto } from './dto/create-pos-configuration.dto';
import { UpdatePosConfigurationDto } from './dto/update-pos-configuration.dto';
import { QueryPosConfigurationDto } from './dto/query-pos-configuration.dto';
import { PaginatedPosConfigurationDto } from './dto/paginated-pos-configuration.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

/**
 * POS Configuration Controller
 * 
 * Manages POS equipment configurations with RBAC-based access control.
 * 
 * **Security:**
 * - All endpoints require JWT authentication (JwtAuthGuard)
 * - All endpoints require RBAC permissions (PermissionGuard)
 * - Entity type: "pos_configurations"
 * - Actions: Create, Read, Update, Delete
 * - Unauthorized access returns 403 Forbidden
 * 
 * **Validates: Requirements 6.2, 6.3, 6.4**
 */
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/pos-configurations')
@ApiTags('POS Configurations')
@ApiBearerAuth()
export class PosConfigurationController {
  constructor(private readonly service: PosConfigurationService) {}

  /**
   * Create a new POS configuration
   * 
   * **RBAC:** Requires "pos_configurations:Create" permission
   * **Validates: Requirements 6.2, 6.3**
   */
  @Post()
  @RequirePermissions({ entityType: 'pos_configurations', action: 'Create' })
  @ApiOperation({ summary: 'Create a new POS configuration' })
  @ApiBody({ type: CreatePosConfigurationDto })
  @ApiResponse({ status: 201, description: 'POS configuration created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() dto: CreatePosConfigurationDto, @Req() req) {
    return this.service.create(dto, req.user.tenantId);
  }

  /**
   * Get paginated POS configurations with search and filters
   * 
   * **RBAC:** Requires "pos_configurations:Read" permission
   * **Validates: Requirements 6.2, 6.3**
   */
  @Get()
  @RequirePermissions({ entityType: 'pos_configurations', action: 'Read' })
  @ApiOperation({ summary: 'Get paginated POS configurations with search and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: Number })
  @ApiQuery({ name: 'sucursal', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of POS configurations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() query: QueryPosConfigurationDto, @Req() req): Promise<PaginatedPosConfigurationDto> {
    return this.service.findAll(req.user.tenantId, query);
  }

  /**
   * Get a specific POS configuration by ID
   * 
   * **RBAC:** Requires "pos_configurations:Read" permission
   * **Validates: Requirements 6.2, 6.3, 6.4**
   */
  @Get(':id')
  @RequirePermissions({ entityType: 'pos_configurations', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific POS configuration by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'POS Configuration ID' })
  @ApiResponse({ status: 200, description: 'POS configuration retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.service.findOne(id, req.user.tenantId);
  }

  /**
   * Update an existing POS configuration
   * 
   * **RBAC:** Requires "pos_configurations:Update" permission
   * **Validates: Requirements 6.2, 6.3, 6.4**
   */
  @Put(':id')
  @RequirePermissions({ entityType: 'pos_configurations', action: 'Update' })
  @ApiOperation({ summary: 'Update an existing POS configuration' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdatePosConfigurationDto })
  @ApiResponse({ status: 200, description: 'POS configuration updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(@Param('id') id: string, @Body() dto: UpdatePosConfigurationDto, @Req() req) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  /**
   * Delete a POS configuration by ID
   * 
   * **RBAC:** Requires "pos_configurations:Delete" permission
   * **Validates: Requirements 6.2, 6.3, 6.4**
   */
  @Delete(':id')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'pos_configurations', action: 'Delete' })
  @ApiOperation({ summary: 'Delete a POS configuration by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'POS configuration deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user.tenantId);
  }
}
