import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || 'sin-customer-documents';
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Upload file to S3
   * @param tenantId Tenant ID
   * @param entityId Entity ID (customer ID, contract ID, etc.)
   * @param documentType Document type code or folder name
   * @param file File buffer
   * @param fileName Original filename
   * @param mimeType MIME type
   * @returns S3 key
   */
  async uploadFile(
    tenantId: string,
    entityId: number | string,
    documentType: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `${tenantId}/${entityId}/${documentType}/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      Body: file,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
    });

    await this.s3Client.send(command);
    return s3Key;
  }

  /**
   * Upload file to S3 with hierarchical path by entity type.
   * Format: tenant/entityType/entityId/documentType/file
   */
  async uploadEntityFile(
    tenantId: string,
    entityType: string,
    entityId: number | string,
    documentType: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const safeEntityType = this.toSafePathSegment(entityType);
    const safeDocumentType = this.toSafePathSegment(documentType);
    const safeEntityId = this.toSafePathSegment(String(entityId));
    const s3Key = `${tenantId}/${safeEntityType}/${safeEntityId}/${safeDocumentType}/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      Body: file,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
    });

    await this.s3Client.send(command);
    return s3Key;
  }

  private toSafePathSegment(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'unknown';
  }

  /**
   * Generate signed URL for downloading file (valid for 1 hour)
   * @param s3Key S3 key
   * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed URL
   */
  async getSignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      return getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('[S3] Error generating signed URL:', error);
      // If signing fails, return the direct S3 URL
      // This will work if the bucket has public access or if accessed from within AWS
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com/${s3Key}`;
    }
  }

  /**
   * Delete file from S3
   * @param s3Key S3 key
   */
  async deleteFile(s3Key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      if (error.Code === 'AccessDenied') {
        throw new Error(
          `AWS S3 Access Denied: El usuario IAM no tiene permisos para eliminar objetos. ` +
          `Verifica que la política IAM incluya "s3:DeleteObject" para el bucket ${this.bucketName}`
        );
      }
      throw error;
    }
  }
}
