import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../api/auth/jwt-auth.guard';
import { TenantModuleValidationGuard } from '../../../api/auth/tenant-module-validation.guard';
import { InventoryBatchService } from '../services/inventory-batch.service';
import { QueryInventoryBatchDto } from '../dto/query-inventory-batch.dto';

/**
 * Controller for inventory batch operations
 * Provides endpoints to list and query inventory batches with filtering and pagination
 */
@ApiTags('Inventory Batches')
@Controller('tenant/inventory-batches')
@UseGuards(JwtAuthGuard, TenantModuleValidationGuard)
@ApiBearerAuth()
export class InventoryBatchController {
  constructor(private readonly inventoryBatchService: InventoryBatchService) {}

  /**
   * List inventory batches with filtering and pagination
   * Supports filtering by batch number, product, warehouse, date range, and purchase order
   *
   * @param query - Query parameters for filtering and pagination
   * @param req - Request object containing tenant_id
   * @returns Paginated list of inventory batches
   */
  @Get()
  @ApiOperation({
    summary: 'List inventory batches',
    description: 'Get a paginated list of inventory batches with optional filters',
  })
  @ApiQuery({
    name: 'batch_number',
    required: false,
    type: String,
    description: 'Filter by batch number (partial match)',
  })
  @ApiQuery({
    name: 'product_id',
    required: false,
    type: String,
    description: 'Filter by product ID',
  })
  @ApiQuery({
    name: 'warehouse_id',
    required: false,
    type: String,
    description: 'Filter by warehouse ID',
  })
  @ApiQuery({
    name: 'purchase_order_batch_id',
    required: false,
    type: String,
    description: 'Filter by purchase order batch ID',
  })
  @ApiQuery({
    name: 'created_from',
    required: false,
    type: String,
    description: 'Filter batches created from this date (ISO 8601)',
  })
  @ApiQuery({
    name: 'created_to',
    required: false,
    type: String,
    description: 'Filter batches created until this date (ISO 8601)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    enum: ['batch_number', 'created_at', 'quantity'],
    description: 'Sort by field (default: created_at)',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of inventory batches with pagination metadata',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            batch_number: 'BATCH-2024-001',
            warehouse: { id: 'uuid', name: 'Central' },
            product: { id: 'uuid', name: 'Tornillos' },
            uom: { id: 'uuid', name: 'Unidades' },
            quantity: 500,
            purchase_order: { id: 'uuid', folio: 'OC-123' },
            created_by: 'user-id',
            created_at: '2024-01-15T10:30:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 150,
          pages: 8,
        },
      },
    },
  })
  async listBatches(
    @Query() query: QueryInventoryBatchDto,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    return this.inventoryBatchService.queryBatches(tenantId, query);
  }

  /**
   * Get warehouse inventory statistics
   * Returns total batches, unique products, and total quantity for a warehouse
   *
   * @param warehouseId - Warehouse ID
   * @param req - Request object containing tenant_id
   * @returns Warehouse inventory statistics
   */
  @Get('warehouse/:warehouseId/stats')
  @ApiOperation({
    summary: 'Get warehouse inventory statistics',
    description: 'Get statistics about batches in a specific warehouse',
  })
  @ApiResponse({
    status: 200,
    description: 'Warehouse inventory statistics',
    schema: {
      example: {
        total_batches: 45,
        unique_products: 12,
        total_quantity: 5000,
      },
    },
  })
  async getWarehouseStats(
    @Query('warehouseId') warehouseId: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    return this.inventoryBatchService.getWarehouseStats(tenantId, warehouseId);
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload photo for an inventory batch',
    description: 'Upload or replace an inventory batch photo (label, lot state, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch photo uploaded successfully',
  })
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const tenantId = req.user.tenant_id;
    const batch = await this.inventoryBatchService.uploadPhoto(id, tenantId, file);

    return {
      message: 'Batch photo uploaded successfully',
      data: batch,
    };
  }
}
