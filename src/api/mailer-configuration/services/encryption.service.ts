import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * MailerConfigurationEncryptionService
 * Handles encryption and decryption of Resend API keys using AES-256-GCM
 */
@Injectable()
export class MailerConfigurationEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor() {
    // Get encryption key from environment variable
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    // Key should be 32 bytes (256 bits) for aes-256
    this.encryptionKey = Buffer.from(keyString, 'hex');
    if (this.encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
  }

  /**
   * Encrypt a Resend API key
   * Returns encrypted key and IV separately for storage in ResendConfiguration entity
   *
   * @param apiKey - The plaintext API key
   * @returns Object with encryptedKey and iv
   */
  encryptResendApiKey(apiKey: string): { encryptedKey: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: authTag:encryptedData (IV stored separately)
    const encryptedKey = `${authTag.toString('hex')}:${encrypted}`;

    return {
      encryptedKey,
      iv: iv.toString('hex'),
    };
  }

  /**
   * Decrypt a Resend API key
   *
   * @param encryptedKey - The encrypted key in format authTag:encryptedData
   * @param iv - The IV in hex format
   * @returns Decrypted API key
   */
  decryptResendApiKey(encryptedKey: string, iv: string): string {
    const parts = encryptedKey.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted key format');
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

  /**
   * Generate a random encryption key (for setup)
   * Returns a 32-byte key in hex format
   *
   * @returns 64-character hex string representing 32 bytes
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
