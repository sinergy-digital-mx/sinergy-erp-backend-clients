import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../../entities/purchase-orders/document.entity';
import { PurchaseOrderService } from './purchase-order.service';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private repo: Repository<Document>,
    private poService: PurchaseOrderService,
  ) {}

  async uploadDocument(
    purchaseOrderId: string,
    file: Express.Multer.File,
    uploaderId: string,
    tenantId: string,
  ): Promise<Document> {
    // Verify PO exists and belongs to tenant
    await this.poService.findOne(purchaseOrderId, tenantId);

    // In a real implementation, upload to S3 and get the URL
    // For now, we'll create a mock S3 key and URL
    const s3Key = `purchase-orders/${purchaseOrderId}/${Date.now()}-${file.originalname}`;
    const s3Url = `https://s3.amazonaws.com/bucket/${s3Key}`;

    const document = this.repo.create({
      purchase_order_id: purchaseOrderId,
      filename: file.originalname,
      file_type: file.mimetype,
      s3_key: s3Key,
      s3_url: s3Url,
      uploader_id: uploaderId,
      file_size: file.size,
    });

    return this.repo.save(document);
  }

  async deleteDocument(
    purchaseOrderId: string,
    documentId: string,
    tenantId: string,
  ): Promise<void> {
    // Verify PO exists and belongs to tenant
    await this.poService.findOne(purchaseOrderId, tenantId);

    const document = await this.repo.findOne({
      where: { id: documentId, purchase_order_id: purchaseOrderId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // In a real implementation, delete from S3
    // For now, just delete the record

    await this.repo.remove(document);
  }

  async getDocuments(purchaseOrderId: string, tenantId: string): Promise<Document[]> {
    // Verify PO exists and belongs to tenant
    await this.poService.findOne(purchaseOrderId, tenantId);

    return this.repo.find({
      where: { purchase_order_id: purchaseOrderId },
    });
  }
}
