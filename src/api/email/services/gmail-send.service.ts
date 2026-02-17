import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { EmailMessageService } from './email-message.service';
import { ThirdPartyConfig } from '../../../entities/integrations/third-party-config.entity';
import { EncryptionService } from '../../integrations/services/encryption.service';

@Injectable()
export class GmailSendService {
  private readonly logger = new Logger(GmailSendService.name);

  constructor(
    @InjectRepository(ThirdPartyConfig)
    private configRepo: Repository<ThirdPartyConfig>,
    private emailMessageService: EmailMessageService,
    private encryptionService: EncryptionService,
  ) {}

  /**
   * Enviar email a través de Gmail
   */
  async sendViaGmail(
    tenantId: string,
    threadId: string,
    fromEmail: string,
    toEmail: string,
    subject: string,
    body: string,
    bodyHtml?: string,
    cc?: string,
    bcc?: string,
  ): Promise<string> {
    this.logger.log(`Enviando email a través de Gmail: ${toEmail}`);

    // Obtener configuración de Gmail
    const config = await this.configRepo.findOne({
      where: { tenant_id: tenantId, provider: 'gmail' },
    });

    if (!config) {
      throw new BadRequestException('Gmail no está configurado para este tenant');
    }

    if (!config.is_enabled) {
      throw new BadRequestException('Gmail está deshabilitado para este tenant');
    }

    // Refrescar token si es necesario
    await this.refreshAccessTokenIfNeeded(config);

    try {
      // Desencriptar credenciales
      const clientId = this.encryptionService.decrypt(config.encrypted_api_key);
      const clientSecret = config.encrypted_api_secret
        ? this.encryptionService.decrypt(config.encrypted_api_secret)
        : '';
      const refreshToken = config.metadata.refresh_token;
      const accessToken = config.metadata.access_token;

      // Crear cliente OAuth
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      // Crear cliente de Gmail
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Crear mensaje de email
      const message = this.createEmailMessage(
        fromEmail,
        toEmail,
        subject,
        body,
        bodyHtml,
        cc,
        bcc,
      );

      // Enviar a través de Gmail
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: Buffer.from(message).toString('base64'),
        },
      });

      const gmailMessageId = response.data.id;
      if (!gmailMessageId) {
        throw new BadRequestException('No message ID returned from Gmail');
      }
      this.logger.log(`Email enviado exitosamente. Gmail ID: ${gmailMessageId}`);

      // Guardar en email thread
      await this.emailMessageService.sendMessage(
        tenantId,
        threadId,
        fromEmail,
        toEmail,
        subject,
        body,
        bodyHtml,
        cc,
        bcc,
      );

      return gmailMessageId;
    } catch (error) {
      this.logger.error(`Error enviando email con Gmail: ${error.message}`, error.stack);
      throw new BadRequestException(`Error al enviar email con Gmail: ${error.message}`);
    }
  }

  /**
   * Crear mensaje de email en formato RFC 2822
   */
  private createEmailMessage(
    from: string,
    to: string,
    subject: string,
    body: string,
    bodyHtml?: string,
    cc?: string,
    bcc?: string,
  ): string {
    const headers: string[] = [
      `From: ${from}`,
      `To: ${to}`,
    ];

    if (cc) {
      headers.push(`Cc: ${cc}`);
    }

    if (bcc) {
      headers.push(`Bcc: ${bcc}`);
    }

    headers.push(`Subject: ${subject}`);
    headers.push('MIME-Version: 1.0');

    if (bodyHtml) {
      headers.push('Content-Type: text/html; charset="UTF-8"');
    } else {
      headers.push('Content-Type: text/plain; charset="UTF-8"');
    }

    return headers.join('\r\n') + '\r\n\r\n' + (bodyHtml || body);
  }

  /**
   * Refrescar token de acceso si está expirado
   */
  async refreshAccessTokenIfNeeded(config: ThirdPartyConfig): Promise<void> {
    const expiresAt = new Date(config.metadata.expires_at);
    const now = new Date();

    // Si expira en menos de 5 minutos, refrescar
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      this.logger.log('Refrescando access token de Gmail...');

      try {
        const clientId = this.encryptionService.decrypt(config.encrypted_api_key);
        const clientSecret = config.encrypted_api_secret
          ? this.encryptionService.decrypt(config.encrypted_api_secret)
          : '';
        const refreshToken = config.metadata.refresh_token;

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const { credentials } = await oauth2Client.refreshAccessToken();

        // Actualizar configuración
        config.metadata.access_token = credentials.access_token;
        if (credentials.expiry_date) {
          config.metadata.expires_at = new Date(credentials.expiry_date).toISOString();
        }

        await this.configRepo.save(config);
        this.logger.log('Access token refrescado exitosamente');
      } catch (error) {
        this.logger.error(`Error refrescando token: ${error.message}`, error.stack);
        throw new BadRequestException(`Error refrescando token de Gmail: ${error.message}`);
      }
    }
  }

  /**
   * Obtener configuración de Gmail para un tenant
   */
  async getGmailConfig(tenantId: string): Promise<ThirdPartyConfig> {
    const config = await this.configRepo.findOne({
      where: { tenant_id: tenantId, provider: 'gmail' },
    });

    if (!config) {
      throw new BadRequestException('Gmail no está configurado para este tenant');
    }

    return config;
  }

  /**
   * Verificar si Gmail está configurado y habilitado
   */
  async isGmailConfigured(tenantId: string): Promise<boolean> {
    const config = await this.configRepo.findOne({
      where: { tenant_id: tenantId, provider: 'gmail' },
    });

    return config !== null && config.is_enabled;
  }

  /**
   * Probar configuración de Gmail
   */
  async testGmailConfig(tenantId: string): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getGmailConfig(tenantId);

      if (!config.is_enabled) {
        return { success: false, message: 'Gmail está deshabilitado' };
      }

      // Refrescar token
      await this.refreshAccessTokenIfNeeded(config);

      // Intentar conectar a Gmail
      const clientId = this.encryptionService.decrypt(config.encrypted_api_key);
      const clientSecret = config.encrypted_api_secret
        ? this.encryptionService.decrypt(config.encrypted_api_secret)
        : '';
      const accessToken = config.metadata.access_token;

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({ access_token: accessToken });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Obtener perfil para verificar conexión
      await gmail.users.getProfile({ userId: 'me' });

      this.logger.log('Configuración de Gmail verificada exitosamente');
      return { success: true, message: 'Configuración de Gmail es válida' };
    } catch (error) {
      this.logger.error(`Error probando Gmail: ${error.message}`, error.stack);
      return { success: false, message: `Error: ${error.message}` };
    }
  }
}
