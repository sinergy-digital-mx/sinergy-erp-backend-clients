import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantModuleValidationGuard } from '../../auth/tenant-module-validation.guard';
import { PurchaseOrderDocumentsService } from '../services/purchase-order-documents.service';
import { PurchaseOrderService } from '../services/purchase-order.service';

@Controller('tenant/purchase-orders')
@UseGuards(JwtAuthGuard, TenantModuleValidationGuard)
export class PurchaseOrderDocumentsController {
  constructor(
    private readonly documentsService: PurchaseOrderDocumentsService,
    private readonly purchaseOrderService: PurchaseOrderService,
  ) {}

  /**
   * Upload a document for a purchase order
   */
  @Post(':orderId/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('orderId') orderId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('document_type_id') documentTypeId: string,
    @Req() req: any,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!documentTypeId) {
      throw new BadRequestException('document_type_id is required');
    }

    // Verify purchase order exists
    await this.purchaseOrderService.findOne(orderId, tenantId);

    const document = await this.documentsService.uploadDocumentFile(
      tenantId,
      orderId,
      parseInt(documentTypeId),
      file,
      userId,
    );

    return {
      message: 'Document uploaded successfully',
      data: document,
    };
  }

  /**
   * Get all documents for a purchase order
   */
  @Get(':orderId/documents')
  async getDocuments(@Param('orderId') orderId: string, @Req() req: any) {
    const tenantId = req.user.tenant_id;

    // Verify purchase order exists
    await this.purchaseOrderService.findOne(orderId, tenantId);

    const documents = await this.documentsService.getDocuments(orderId);

    return {
      data: documents,
      total: documents.length,
    };
  }

  /**
   * Delete a document
   */
  @Delete('documents/:documentId')
  async deleteDocument(@Param('documentId') documentId: string) {
    await this.documentsService.deleteDocument(documentId);

    return {
      message: 'Document deleted successfully',
    };
  }

  /**
   * Get all document types
   */
  @Get('document-types/list')
  async getDocumentTypes() {
    const documentTypes = await this.documentsService.getDocumentTypes();

    return {
      data: documentTypes,
      total: documentTypes.length,
    };
  }
}
