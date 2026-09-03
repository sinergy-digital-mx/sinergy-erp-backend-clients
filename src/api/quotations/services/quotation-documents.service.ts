import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from '../../../common/services/s3.service';
import { DocumentLanguage } from '../../../common/enums/document-language.enum';
import { QuotationDocument } from '../../../entities/quotations/quotation-document.entity';
import { QuotationDocumentType } from '../../../entities/quotations/quotation-document-type.entity';

@Injectable()
export class QuotationDocumentsService {
  constructor(
    @InjectRepository(QuotationDocument)
    private readonly documentRepository: Repository<QuotationDocument>,
    @InjectRepository(QuotationDocumentType)
    private readonly documentTypeRepository: Repository<QuotationDocumentType>,
    private readonly s3Service: S3Service,
  ) {}

  async uploadDocument(
    quotationId: string,
    documentTypeId: number,
    fileName: string,
    filePath: string,
    fileSize: number,
    mimeType: string,
    uploadedBy: string,
    documentLanguage: DocumentLanguage = DocumentLanguage.ES,
  ): Promise<QuotationDocument> {
    const docType = await this.documentTypeRepository.findOne({
      where: { id: documentTypeId },
    });

    if (!docType) {
      throw new NotFoundException(`Document type not found: ${documentTypeId}`);
    }

    const document = this.documentRepository.create({
      id: uuidv4(),
      quotation_id: quotationId,
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

  async getDocuments(quotationId: string): Promise<any[]> {
    const documents = await this.documentRepository
      .createQueryBuilder('doc')
      .where('doc.quotation_id = :quotationId', { quotationId })
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
          ? `${doc.uploader.first_name || ''} ${doc.uploader.last_name || ''}`.trim() ||
            'Unknown'
          : 'Unknown';

        return {
          id: doc.id,
          quotation_id: doc.quotation_id,
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

  async getLastDocumentLanguage(
    quotationId: string,
    documentTypeId: number,
  ): Promise<DocumentLanguage> {
    const document = await this.documentRepository.findOne({
      where: {
        quotation_id: quotationId,
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

  async deleteDocumentsByType(
    quotationId: string,
    documentTypeId: number,
  ): Promise<void> {
    const existing = await this.getDocuments(quotationId);
    for (const doc of existing) {
      if (Number(doc.document_type_id) === Number(documentTypeId)) {
        await this.deleteDocument(doc.id);
      }
    }
  }
}
