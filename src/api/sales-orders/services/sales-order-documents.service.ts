import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from '../../../common/services/s3.service';
import { DocumentLanguage } from '../../../common/enums/document-language.enum';
import { SalesOrderDocument } from '../../../entities/sales-orders/sales-order-document.entity';
import { SalesOrderDocumentType } from '../../../entities/sales-orders/sales-order-document-type.entity';

@Injectable()
export class SalesOrderDocumentsService {
  constructor(
    @InjectRepository(SalesOrderDocument)
    private readonly documentRepository: Repository<SalesOrderDocument>,
    @InjectRepository(SalesOrderDocumentType)
    private readonly documentTypeRepository: Repository<SalesOrderDocumentType>,
    private readonly s3Service: S3Service,
  ) {}

  async uploadDocument(
    salesOrderId: string,
    documentTypeId: number,
    fileName: string,
    filePath: string,
    fileSize: number,
    mimeType: string,
    uploadedBy: string,
    documentLanguage: DocumentLanguage = DocumentLanguage.ES,
  ): Promise<SalesOrderDocument> {
    const docType = await this.documentTypeRepository.findOne({
      where: { id: documentTypeId },
    });

    if (!docType) {
      throw new NotFoundException(`Document type not found: ${documentTypeId}`);
    }

    const document = this.documentRepository.create({
      id: uuidv4(),
      sales_order_id: salesOrderId,
      document_type_id: documentTypeId,
      file_name: fileName,
      file_path: filePath,
      file_size: fileSize,
      mime_type: mimeType,
      uploaded_by: uploadedBy,
      document_language: documentLanguage,
    });

    return this.documentRepository.save(document);
  }

  async getDocuments(salesOrderId: string): Promise<any[]> {
    const documents = await this.documentRepository
      .createQueryBuilder('doc')
      .where('doc.sales_order_id = :salesOrderId', { salesOrderId })
      .leftJoinAndSelect('doc.document_type', 'doc_type')
      .leftJoinAndSelect('doc.uploader', 'uploader')
      .orderBy('doc.created_at', 'DESC')
      .getMany();

    return Promise.all(
      documents.map(async (doc) => {
        let signedUrl: string | null = null;
        try {
          signedUrl = await this.s3Service.getSignedUrl(doc.file_path, 900);
        } catch (error) {
          console.error(`Error generating signed URL for ${doc.file_path}:`, error);
        }

        const uploaderName = doc.uploader
          ? `${doc.uploader.first_name || ''} ${doc.uploader.last_name || ''}`.trim() || 'Unknown'
          : 'Unknown';

        return {
          id: doc.id,
          sales_order_id: doc.sales_order_id,
          document_type_id: doc.document_type_id,
          document_name: doc.file_name,
          file_path: doc.file_path,
          file_key: doc.file_path,
          uploaded_by: doc.uploaded_by,
          uploaded_by_name: uploaderName,
          uploaded_at: doc.created_at,
          document_type_name: doc.document_type?.name || 'Unknown',
          document_language: doc.document_language,
          key: doc.file_path,
          path: signedUrl || doc.file_path,
        };
      }),
    );
  }

  async ensureDocumentType(name: string, description: string): Promise<number> {
    const found = await this.documentTypeRepository.findOne({ where: { name } });
    if (found) return found.id;

    const created = await this.documentTypeRepository.save(
      this.documentTypeRepository.create({ name, description }),
    );
    return created.id;
  }

  async getLastDocumentLanguage(
    salesOrderId: string,
    documentTypeId: number,
  ): Promise<DocumentLanguage> {
    const document = await this.documentRepository.findOne({
      where: {
        sales_order_id: salesOrderId,
        document_type_id: documentTypeId,
      },
      order: { created_at: 'DESC' },
    });

    return document?.document_language ?? DocumentLanguage.ES;
  }

  async deleteDocument(documentId: string): Promise<void> {
    const result = await this.documentRepository.delete(documentId);
    if (result.affected === 0) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }
  }
}
