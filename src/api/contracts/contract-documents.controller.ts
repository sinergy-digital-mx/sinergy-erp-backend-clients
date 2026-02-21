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
import { ContractDocumentsService } from './contract-documents.service';

@Controller('tenant/contracts/:contractId/documents')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ContractDocumentsController {
  constructor(
    private documentsService: ContractDocumentsService,
    private tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'ContractDocument', action: 'Create' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('contractId') contractId: string,
    @Body('notes') notes: string,
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
      contractId,
      file,
      userId,
      notes,
    );
  }

  @Get()
  @RequirePermissions({ entityType: 'ContractDocument', action: 'Read' })
  async getDocuments(@Param('contractId') contractId: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.documentsService.getContractDocuments(tenantId, contractId);
  }

  @Get(':documentId')
  @RequirePermissions({ entityType: 'ContractDocument', action: 'Read' })
  async getDocument(@Param('documentId') documentId: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    return this.documentsService.getDocument(tenantId, documentId);
  }

  @Delete(':documentId')
  @RequirePermissions({ entityType: 'ContractDocument', action: 'Delete' })
  async deleteDocument(@Param('documentId') documentId: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    await this.documentsService.deleteDocument(tenantId, documentId);
    return { success: true };
  }

  @Patch(':documentId/status')
  @RequirePermissions({ entityType: 'ContractDocument', action: 'Update' })
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
