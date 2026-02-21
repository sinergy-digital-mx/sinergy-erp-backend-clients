import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CustomerDocument } from '../../entities/customers/customer-document.entity';
import { DocumentType } from '../../entities/customers/document-type.entity';
import { S3Service } from '../../common/services/s3.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class CustomerDocumentsService {
  constructor(
    @InjectRepository(CustomerDocument)
    private documentRepo: Repository<CustomerDocument>,
    @InjectRepository(DocumentType)
    private documentTypeRepo: Repository<DocumentType>,
    private s3Service: S3Service,
  ) {}

  async uploadDocument(
    tenantId: string,
    customerId: number,
    dto: UploadDocumentDto,
    file: any,
    uploadedBy: string,
  ): Promise<CustomerDocument> {
    // Verify document type exists
    const documentType = await this.documentTypeRepo.findOne({
      where: { id: dto.document_type_id },
    });

    if (!documentType) {
      throw new Error('Document type not found');
    }

    // Upload to S3
    const s3Key = await this.s3Service.uploadFile(
      tenantId,
      customerId,
      documentType.code,
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // Save document record
    const document = this.documentRepo.create({
      tenant_id: tenantId,
      customer_id: customerId,
      document_type_id: dto.document_type_id,
      file_name: file.originalname,
      s3_key: s3Key,
      mime_type: file.mimetype,
      file_size: file.size,
      expiration_date: dto.expiration_date ? new Date(dto.expiration_date) : null,
      notes: dto.notes,
      uploaded_by: uploadedBy,
      status: 'pending',
    });

    return this.documentRepo.save(document);
  }

  async getCustomerDocuments(tenantId: string, customerId: number): Promise<any[]> {
    const documents = await this.documentRepo.find({
      where: { tenant_id: tenantId, customer_id: customerId },
      relations: ['document_type'],
      order: { created_at: 'DESC' },
    });

    // Generate signed URLs for each document
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const signedUrl = await this.s3Service.getSignedUrl(doc.s3_key);
        return {
          ...doc,
          download_url: signedUrl,
        };
      }),
    );

    return documentsWithUrls;
  }

  async getDocument(tenantId: string, documentId: string): Promise<any> {
    const document = await this.documentRepo.findOne({
      where: { id: documentId, tenant_id: tenantId },
      relations: ['document_type', 'customer'],
    });

    if (!document) {
      throw new Error('Document not found');
    }

    const signedUrl = await this.s3Service.getSignedUrl(document.s3_key);

    return {
      ...document,
      download_url: signedUrl,
    };
  }

  async deleteDocument(tenantId: string, documentId: string): Promise<void> {
    const document = await this.documentRepo.findOne({
      where: { id: documentId, tenant_id: tenantId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete from S3
    await this.s3Service.deleteFile(document.s3_key);

    // Delete record
    await this.documentRepo.remove(document);
  }

  async updateDocumentStatus(
    tenantId: string,
    documentId: string,
    status: 'pending' | 'approved' | 'rejected',
    notes?: string,
  ): Promise<CustomerDocument> {
    const document = await this.documentRepo.findOne({
      where: { id: documentId, tenant_id: tenantId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    document.status = status;
    if (notes) {
      document.notes = notes;
    }

    return this.documentRepo.save(document);
  }

  // Document Types Management
  async getDocumentTypes(tenantId: string): Promise<DocumentType[]> {
    return this.documentTypeRepo.find({
      where: [
        { tenant_id: IsNull(), is_active: true }, // Global types
        { tenant_id: tenantId, is_active: true }, // Tenant-specific types
      ],
      order: { name: 'ASC' },
    });
  }

  async createDocumentType(tenantId: string, data: Partial<DocumentType>): Promise<DocumentType> {
    const documentType = this.documentTypeRepo.create({
      ...data,
      tenant_id: tenantId,
    });

    return this.documentTypeRepo.save(documentType);
  }
}
