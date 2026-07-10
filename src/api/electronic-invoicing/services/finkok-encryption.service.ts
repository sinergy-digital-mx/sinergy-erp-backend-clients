import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Cifrado AES-256-GCM para credenciales Finkok por cliente.
 */
@Injectable()
export class FinkokEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor() {
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    this.encryptionKey = Buffer.from(keyString, 'hex');
    if (this.encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
  }

  encrypt(plaintext: string): { encryptedValue: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      encryptedValue: `${authTag.toString('hex')}:${encrypted}`,
      iv: iv.toString('hex'),
    };
  }

  decrypt(encryptedValue: string, iv: string): string {
    const parts = encryptedValue.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted value format');
    }

    const ivBuffer = Buffer.from(iv, 'hex');
    const authTag = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, ivBuffer);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
