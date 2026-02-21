import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { CustomerDocumentsService } from './customer-documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Controller('tenant/customers/:customerId/documents')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CustomerDocumentsController {
  constructor(
    private documentsService: CustomerDocumentsService,
    private tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'CustomerDocument', action: 'Create' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('customerId') customerId: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|pdf|doc|docx)$/,
          }),
        ],
      }),
    )
    file: any,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const userId = req.user?.sub || 'system';

    return this.documentsService.uploadDocument(
      tenantId,
      parseInt(customerId),
      dto,
      file,
      userId,
    );
  }

  @Get()
  @RequirePermissions({ entityType: 'CustomerDocument', action: 'Read' })
  async getDocuments(@Param('customerId') customerId: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.documentsService.getCustomerDocuments(tenantId, parseInt(customerId));
  }

  @Get(':documentId')
  @RequirePermissions({ entityType: 'CustomerDocument', action: 'Read' })
  async getDocument(@Param('documentId') documentId: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.documentsService.getDocument(tenantId, documentId);
  }

  @Delete(':documentId')
  @RequirePermissions({ entityType: 'CustomerDocument', action: 'Delete' })
  async deleteDocument(@Param('documentId') documentId: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    await this.documentsService.deleteDocument(tenantId, documentId);
    return { success: true };
  }

  @Patch(':documentId/status')
  @RequirePermissions({ entityType: 'CustomerDocument', action: 'Update' })
  async updateStatus(
    @Param('documentId') documentId: string,
    @Body() body: { status: 'pending' | 'approved' | 'rejected'; notes?: string },
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.documentsService.updateDocumentStatus(
      tenantId,
      documentId,
      body.status,
      body.notes,
    );
  }
}

@Controller('tenant/document-types')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DocumentTypesController {
  constructor(
    private documentsService: CustomerDocumentsService,
    private tenantContext: TenantContextService,
  ) {}

  @Get()
  @RequirePermissions({ entityType: 'CustomerDocument', action: 'Read' })
  async getDocumentTypes(@Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.documentsService.getDocumentTypes(tenantId);
  }

  @Post()
  @RequirePermissions({ entityType: 'CustomerDocument', action: 'Create' })
  async createDocumentType(@Body() body: any, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.documentsService.createDocumentType(tenantId, body);
  }
}
