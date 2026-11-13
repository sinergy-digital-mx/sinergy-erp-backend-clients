import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class GpsSecretCipherService {
  private readonly algorithm = 'aes-256-gcm';

  encrypt(secret: string): { encryptedValue: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key(), iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
      encryptedValue: `${authTag.toString('hex')}:${encrypted.toString('hex')}`,
      iv: iv.toString('hex'),
    };
  }

  decrypt(encryptedValue: string, iv: string): string {
    const parts = encryptedValue.split(':');
    if (parts.length !== 2) {
      throw new InternalServerErrorException('No se pudo leer la contraseña de rastreo GPS.');
    }
    const decipher = crypto.createDecipheriv(this.algorithm, this.key(), Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(parts[0], 'hex'));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(parts[1], 'hex')),
      decipher.final(),
    ]);
    return plain.toString('utf8');
  }

  private key(): Buffer {
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
      throw new InternalServerErrorException('No se pudo guardar la contraseña de rastreo GPS.');
    }
    const key = Buffer.from(keyString, 'hex');
    if (key.length !== 32) {
      throw new InternalServerErrorException('No se pudo guardar la contraseña de rastreo GPS.');
    }
    return key;
  }
}
