import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName = 'sin-customer-documents';

  constructor() {
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
   * Generate signed URL for downloading file (valid for 1 hour)
   * @param s3Key S3 key
   * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed URL
   */
  async getSignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Delete file from S3
   * @param s3Key S3 key
   */
  async deleteFile(s3Key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });

    await this.s3Client.send(command);
  }
}
