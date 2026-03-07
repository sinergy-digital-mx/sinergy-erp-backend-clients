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
import { SubcategoryService } from './subcategory.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { QuerySubcategoryDto } from './dto/query-subcategory.dto';
import { PaginatedSubcategoryDto } from './dto/paginated-subcategory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/subcategories')
@ApiTags('Subcategories')
@ApiBearerAuth()
export class SubcategoryController {
  constructor(private readonly service: SubcategoryService) {}

  @Post()
  @RequirePermissions({ entityType: 'Subcategory', action: 'Create' })
  @ApiOperation({ summary: 'Create a new subcategory' })
  @ApiBody({ type: CreateSubcategoryDto })
  @ApiResponse({ status: 201, description: 'Subcategory created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() dto: CreateSubcategoryDto, @Req() req) {
    return this.service.create(dto, req.user.tenantId);
  }

  @Get()
  @RequirePermissions({ entityType: 'Subcategory', action: 'Read' })
  @ApiOperation({ summary: 'Get paginated subcategories with search and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'category_id', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of subcategories retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() query: QuerySubcategoryDto, @Req() req): Promise<PaginatedSubcategoryDto> {
    return this.service.findAll(req.user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Subcategory', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific subcategory by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Subcategory ID' })
  @ApiResponse({ status: 200, description: 'Subcategory retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Put(':id')
  @RequirePermissions({ entityType: 'Subcategory', action: 'Update' })
  @ApiOperation({ summary: 'Update an existing subcategory' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateSubcategoryDto })
  @ApiResponse({ status: 200, description: 'Subcategory updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(@Param('id') id: string, @Body() dto: UpdateSubcategoryDto, @Req() req) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @HttpCode(200)
  @RequirePermissions({ entityType: 'Subcategory', action: 'Delete' })
  @ApiOperation({ summary: 'Delete a subcategory by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Subcategory deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user.tenantId);
  }
}
