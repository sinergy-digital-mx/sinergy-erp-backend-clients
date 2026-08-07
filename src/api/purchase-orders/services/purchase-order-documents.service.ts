import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderDocument } from '../../../entities/purchase-orders/purchase-order-document.entity';
import { PurchaseOrderDocumentLanguage } from '../../../entities/purchase-orders/purchase-order-document-language.enum';
import { PurchaseOrderDocumentType } from '../../../entities/purchase-orders/purchase-order-document-type.entity';
import { S3Service } from '../../../common/services/s3.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PurchaseOrderDocumentsService {
  constructor(
    @InjectRepository(PurchaseOrderDocument)
    private readonly documentRepository: Repository<PurchaseOrderDocument>,
    @InjectRepository(PurchaseOrderDocumentType)
    private readonly documentTypeRepository: Repository<PurchaseOrderDocumentType>,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Upload a document for a purchase order
   */
  async uploadDocument(
    purchaseOrderId: string,
    documentTypeId: number,
    fileName: string,
    filePath: string,
    fileSize: number,
    mimeType: string,
    uploadedBy: string,
    documentLanguage: PurchaseOrderDocumentLanguage = PurchaseOrderDocumentLanguage.ES,
  ): Promise<PurchaseOrderDocument> {
    // Verify document type exists
    const docType = await this.documentTypeRepository.findOne({
      where: { id: documentTypeId },
    });

    if (!docType) {
      throw new NotFoundException(`Tipo de documento no encontrado: ${documentTypeId}`);
    }

    const document = this.documentRepository.create({
      id: uuidv4(),
      purchase_order_batch_id: purchaseOrderId,
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

  /**
   * Upload a binary file for a purchase order and persist its document record.
   */
  async uploadDocumentFile(
    tenantId: string,
    purchaseOrderId: string,
    documentTypeId: number,
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<PurchaseOrderDocument> {
    const docType = await this.documentTypeRepository.findOne({
      where: { id: documentTypeId },
    });

    if (!docType) {
      throw new NotFoundException(`Tipo de documento no encontrado: ${documentTypeId}`);
    }

    const s3Key = await this.s3Service.uploadEntityFile(
      tenantId,
      'purchase_orders',
      purchaseOrderId,
      docType.name,
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return this.uploadDocument(
      purchaseOrderId,
      documentTypeId,
      file.originalname,
      s3Key,
      file.size,
      file.mimetype,
      uploadedBy,
    );
  }

  /**
   * Get all documents for a purchase order with signed URLs
   */
  async getDocuments(purchaseOrderId: string): Promise<any[]> {
    const documents = await this.documentRepository
      .createQueryBuilder('doc')
      .where('doc.purchase_order_batch_id = :purchaseOrderId', { purchaseOrderId })
      .leftJoinAndSelect('doc.document_type', 'doc_type')
      .leftJoinAndSelect('doc.uploader', 'uploader')
      .orderBy('doc.created_at', 'DESC')
      .getMany();

    // Add signed URLs to each document
    const docsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        let signedUrl: string | null = null;
        try {
          signedUrl = await this.s3Service.getSignedUrl(doc.file_path, 900); // 15 minutes
        } catch (error) {
          console.error(`Error generating signed URL for ${doc.file_path}:`, error);
        }

        const uploaderName = doc.uploader
          ? `${doc.uploader.first_name || ''} ${doc.uploader.last_name || ''}`.trim() || 'Unknown'
          : 'Unknown';

        return {
          id: doc.id,
          purchase_order_id: doc.purchase_order_batch_id,
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

    return docsWithUrls;
  }

  /**
   * Obtiene el idioma del ultimo documento generado de un tipo, o espanol por defecto.
   */
  async getLastDocumentLanguage(
    purchaseOrderId: string,
    documentTypeId: number,
  ): Promise<PurchaseOrderDocumentLanguage> {
    const document = await this.documentRepository.findOne({
      where: {
        purchase_order_batch_id: purchaseOrderId,
        document_type_id: documentTypeId,
      },
      order: { created_at: 'DESC' },
    });

    return document?.document_language ?? PurchaseOrderDocumentLanguage.ES;
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    const result = await this.documentRepository.delete(documentId);
    if (result.affected === 0) {
      throw new NotFoundException(`Documento no encontrado: ${documentId}`);
    }
  }

  /**
   * Get all document types
   */
  async getDocumentTypes(): Promise<PurchaseOrderDocumentType[]> {
    return this.documentTypeRepository.find({
      order: { id: 'ASC' },
    });
  }
}
