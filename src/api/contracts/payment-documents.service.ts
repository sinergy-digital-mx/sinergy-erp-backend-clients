import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentDocument } from '../../entities/contracts/payment-document.entity';
import { Payment } from '../../entities/contracts/payment.entity';
import { S3Service } from '../../common/services/s3.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentDocumentsService {
  constructor(
    @InjectRepository(PaymentDocument)
    private paymentDocumentRepo: Repository<PaymentDocument>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    private s3Service: S3Service,
  ) {}

  /**
   * Upload a document for a payment
   */
  async uploadDocument(
    tenantId: string,
    paymentId: string,
    file: any,
    documentType: string,
    uploadedBy: string,
    notes?: string,
  ): Promise<PaymentDocument> {
    // Verify payment exists
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, tenant_id: tenantId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Generate S3 key
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    // Upload to S3
    const s3Key = await this.s3Service.uploadFile(
      tenantId,
      paymentId,
      'payment-documents',
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // Create document record
    const document = this.paymentDocumentRepo.create({
      tenant_id: tenantId,
      payment_id: paymentId,
      document_type: documentType,
      file_name: file.originalname,
      s3_key: s3Key,
      mime_type: file.mimetype,
      file_size: file.size,
      notes,
      uploaded_by: uploadedBy,
    });

    return this.paymentDocumentRepo.save(document);
  }

  /**
   * Get all documents for a payment
   */
  async getPaymentDocuments(
    tenantId: string,
    paymentId: string,
  ): Promise<PaymentDocument[]> {
    return this.paymentDocumentRepo.find({
      where: { tenant_id: tenantId, payment_id: paymentId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get a single document
   */
  async getDocument(
    tenantId: string,
    documentId: string,
  ): Promise<PaymentDocument | null> {
    return this.paymentDocumentRepo.findOne({
      where: { id: documentId, tenant_id: tenantId },
    });
  }

  /**
   * Get document download URL
   */
  async getDocumentUrl(
    tenantId: string,
    documentId: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const document = await this.getDocument(tenantId, documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.s3Service.getSignedUrl(document.s3_key, expiresIn);
  }

  /**
   * Delete a document
   */
  async deleteDocument(tenantId: string, documentId: string): Promise<void> {
    const document = await this.getDocument(tenantId, documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete from S3
    await this.s3Service.deleteFile(document.s3_key);

    // Delete from database
    await this.paymentDocumentRepo.remove(document);
  }

  /**
   * Update document notes
   */
  async updateDocumentNotes(
    tenantId: string,
    documentId: string,
    notes: string,
  ): Promise<PaymentDocument> {
    const document = await this.getDocument(tenantId, documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    document.notes = notes;
    return this.paymentDocumentRepo.save(document);
  }
}
