"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
let S3Service = class S3Service {
    s3Client;
    bucketName;
    constructor() {
        this.bucketName = process.env.AWS_S3_BUCKET || 'sin-customer-documents';
        this.s3Client = new client_s3_1.S3Client({
            region: process.env.AWS_REGION || 'us-east-2',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    async uploadFile(tenantId, entityId, documentType, file, fileName, mimeType) {
        const fileExtension = fileName.split('.').pop();
        const uniqueFileName = `${(0, uuid_1.v4)()}.${fileExtension}`;
        const s3Key = `${tenantId}/${entityId}/${documentType}/${uniqueFileName}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key,
            Body: file,
            ContentType: mimeType,
            ServerSideEncryption: 'AES256',
        });
        await this.s3Client.send(command);
        return s3Key;
    }
    async uploadEntityFile(tenantId, entityType, entityId, documentType, file, fileName, mimeType) {
        const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
        const uniqueFileName = `${(0, uuid_1.v4)()}.${fileExtension}`;
        const safeEntityType = this.toSafePathSegment(entityType);
        const safeDocumentType = this.toSafePathSegment(documentType);
        const safeEntityId = this.toSafePathSegment(String(entityId));
        const s3Key = `${tenantId}/${safeEntityType}/${safeEntityId}/${safeDocumentType}/${uniqueFileName}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key,
            Body: file,
            ContentType: mimeType,
            ServerSideEncryption: 'AES256',
        });
        await this.s3Client.send(command);
        return s3Key;
    }
    toSafePathSegment(value) {
        return value
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9_-]+/g, '_')
            .replace(/^_+|_+$/g, '') || 'unknown';
    }
    async getSignedUrl(s3Key, expiresIn = 3600) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key,
            });
            return (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
        }
        catch (error) {
            console.error('[S3] Error generating signed URL:', error);
            return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com/${s3Key}`;
        }
    }
    async getFileBuffer(s3Key) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key,
        });
        const response = await this.s3Client.send(command);
        const body = response.Body;
        if (!body) {
            throw new Error(`Empty S3 object: ${s3Key}`);
        }
        const chunks = [];
        for await (const chunk of body) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }
    async deleteFile(s3Key) {
        try {
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key,
            });
            await this.s3Client.send(command);
        }
        catch (error) {
            if (error.Code === 'AccessDenied') {
                throw new Error(`AWS S3 Access Denied: El usuario IAM no tiene permisos para eliminar objetos. ` +
                    `Verifica que la política IAM incluya "s3:DeleteObject" para el bucket ${this.bucketName}`);
            }
            throw error;
        }
    }
};
exports.S3Service = S3Service;
exports.S3Service = S3Service = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], S3Service);
//# sourceMappingURL=s3.service.js.map