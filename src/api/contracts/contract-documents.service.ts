import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractDocument } from '../../entities/contracts/contract-document.entity';
import { S3Service } from '../../common/services/s3.service';

@Injectable()
export class ContractDocumentsService {
  constructor(
    @InjectRepository(ContractDocument)
    private documentRepo: Repository<ContractDocument>,
    private s3Service: S3Service,
  ) {}

  async uploadDocument(
    tenantId: string,
    contractId: string,
    file: any,
    uploadedBy: string,
    notes?: string,
  ): Promise<ContractDocument> {
    // Upload to S3 with contracts path
    const s3Key = await this.s3Service.uploadFile(
      tenantId,
      contractId,
      'contracts',
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // Save document record
    const document = this.documentRepo.create({
      tenant_id: tenantId,
      contract_id: contractId,
      file_name: file.originalname,
      s3_key: s3Key,
      mime_type: file.mimetype,
      file_size: file.size,
      notes: notes,
      uploaded_by: uploadedBy,
      status: 'pending',
    });

    return this.documentRepo.save(document);
  }

  async getContractDocuments(tenantId: string, contractId: string): Promise<any[]> {
    const documents = await this.documentRepo.find({
      where: { tenant_id: tenantId, contract_id: contractId },
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
      relations: ['contract'],
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

    try {
      // Delete from S3
      await this.s3Service.deleteFile(document.s3_key);

      // Delete record only if S3 deletion was successful
      await this.documentRepo.remove(document);
    } catch (error) {
      // Log the error and provide clear feedback
      console.error('Error deleting document:', error);
      throw new Error(
        `No se pudo eliminar el documento: ${error.message || 'Error desconocido'}`
      );
    }
  }

  async updateDocumentStatus(
    tenantId: string,
    documentId: string,
    status: 'pending' | 'approved' | 'rejected',
    notes?: string,
  ): Promise<ContractDocument> {
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
}
