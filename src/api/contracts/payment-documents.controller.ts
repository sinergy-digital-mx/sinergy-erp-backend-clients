import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PaymentDocumentsService } from './payment-documents.service';
import { UploadPaymentDocumentDto } from './dto/upload-payment-document.dto';

@Controller('tenant/contracts/:contractId/payments/:paymentId/documents')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PaymentDocumentsController {
  constructor(
    private paymentDocumentsService: PaymentDocumentsService,
    private tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'Payment', action: 'Update' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('paymentId') paymentId: string,
    @UploadedFile() file: any,
    @Body() dto: UploadPaymentDocumentDto,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const userId = req.user?.userId || req.user?.id;

    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/heif',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: PDF, JPEG, PNG, HEIC',
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    return this.paymentDocumentsService.uploadDocument(
      tenantId,
      paymentId,
      file,
      dto.document_type,
      userId,
      dto.notes,
    );
  }

  @Get()
  @RequirePermissions({ entityType: 'Payment', action: 'Read' })
  async getDocuments(
    @Param('paymentId') paymentId: string,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.paymentDocumentsService.getPaymentDocuments(tenantId, paymentId);
  }

  @Get(':documentId/url')
  @RequirePermissions({ entityType: 'Payment', action: 'Read' })
  async getDocumentUrl(
    @Param('documentId') documentId: string,
    @Req() req: any,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const expires = expiresIn ? parseInt(expiresIn, 10) : 3600;
    const url = await this.paymentDocumentsService.getDocumentUrl(
      tenantId,
      documentId,
      expires,
    );

    return { url };
  }

  @Delete(':documentId')
  @RequirePermissions({ entityType: 'Payment', action: 'Delete' })
  async deleteDocument(
    @Param('documentId') documentId: string,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    await this.paymentDocumentsService.deleteDocument(tenantId, documentId);
    return { message: 'Document deleted successfully' };
  }
}
