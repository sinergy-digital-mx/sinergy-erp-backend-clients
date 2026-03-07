import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/purchase-orders/:id/documents')
@ApiTags('Documents')
@ApiBearerAuth()
export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  @Post()
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Update' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document to a purchase order' })
  @ApiParam({ name: 'id', type: 'string', description: 'Purchase Order ID' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  uploadDocument(
    @Param('id') poId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    return this.service.uploadDocument(poId, file, req.user.id, req.user.tenantId);
  }

  @Get()
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Read' })
  @ApiOperation({ summary: 'Get all documents for a purchase order' })
  @ApiParam({ name: 'id', type: 'string', description: 'Purchase Order ID' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  getDocuments(@Param('id') poId: string, @Req() req) {
    return this.service.getDocuments(poId, req.user.tenantId);
  }

  @Delete(':doc-id')
  @RequirePermissions({ entityType: 'purchase_orders', action: 'Update' })
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a document from a purchase order' })
  @ApiParam({ name: 'id', type: 'string', description: 'Purchase Order ID' })
  @ApiParam({ name: 'doc-id', type: 'string', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  deleteDocument(@Param('id') poId: string, @Param('doc-id') docId: string, @Req() req) {
    return this.service.deleteDocument(poId, docId, req.user.tenantId);
  }
}
