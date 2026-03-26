# Configuración de Gmail para Enviar Emails

## 📍 Dónde se Guardan los Valores

Los valores de configuración de Gmail se guardan en la tabla **`third_party_configs`** con:
- `provider = 'gmail'`
- `encrypted_api_key` = Client ID (encriptado)
- `encrypted_api_secret` = Client Secret (encriptado)
- `metadata` = Tokens y configuración adicional (JSON)

**Importante:** Los valores sensibles se guardan encriptados usando AES-256-GCM.

---

## 🔧 Paso 1: Obtener Credenciales de Google Cloud

### 1.1 Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto
3. Nombre: "Synergy Email" (o el que prefieras)
4. Click en "CREATE"

### 1.2 Habilitar Gmail API

1. En el menú, ve a "APIs & Services" → "Library"
2. Busca "Gmail API"
3. Click en "Gmail API"
4. Click en "ENABLE"

### 1.3 Crear Credenciales OAuth 2.0

1. Ve a "APIs & Services" → "Credentials"
2. Click en "Create Credentials" → "OAuth client ID"
3. Si te pide, primero configura la "OAuth consent screen":
   - User Type: "External"
   - Click "CREATE"
   - Rellena:
     - App name: "Synergy CRM"
     - User support email: tu email
     - Developer contact: tu email
   - Click "SAVE AND CONTINUE"
   - En "Scopes", click "ADD OR REMOVE SCOPES"
   - Busca y agrega:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.modify`
   - Click "UPDATE"
   - Click "SAVE AND CONTINUE"

4. Vuelve a "Credentials" y click "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Name: "Synergy Backend"
7. En "Authorized redirect URIs", agrega:
   ```
   http://localhost:3000/api/auth/gmail/callback
   http://localhost:3000/webhooks/gmail/callback
   ```
8. Click "CREATE"
9. Descarga el JSON (guárdalo seguro)

---

## 🔑 Paso 2: Obtener Refresh Token

Necesitas un refresh token para que tu app pueda enviar emails sin intervención del usuario.

### Opción A: Usar Script de Node.js (Recomendado)

Crea un archivo `get-gmail-token.js`:

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = 'TU_CLIENT_ID_AQUI';
const CLIENT_SECRET = 'TU_CLIENT_SECRET_AQUI';
const REDIRECT_URL = 'http://localhost:3000/api/auth/gmail/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL,
);

const scopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];

// Generar URL de autenticación
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent', // Fuerza a mostrar el consentimiento
});

console.log('Abre esta URL en tu navegador:');
console.log(authUrl);

// Esperar el código
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Pega el código de autorización aquí: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n✅ Tokens obtenidos:');
    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);
    console.log('Expiry Date:', tokens.expiry_date);
    
    // Guarda estos valores
    console.log('\n📝 Guarda estos valores para la configuración de Gmail');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  rl.close();
});
```

Ejecuta:
```bash
node get-gmail-token.js
```

---

## 💾 Paso 3: Guardar Configuración en la Base de Datos

Una vez tengas los tokens, guarda la configuración usando el endpoint:

```bash
curl -X POST http://localhost:3000/api/tenant/third-party-configs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail",
    "name": "Gmail Production",
    "encrypted_api_key": "YOUR_CLIENT_ID",
    "encrypted_api_secret": "YOUR_CLIENT_SECRET",
    "metadata": {
      "refresh_token": "YOUR_REFRESH_TOKEN",
      "access_token": "YOUR_ACCESS_TOKEN",
      "email_account": "tu-email@gmail.com",
      "scopes": [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify"
      ],
      "expires_at": "2026-02-10T15:00:00Z"
    },
    "is_enabled": true,
    "is_test_mode": false
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "id": "config-uuid",
    "tenant_id": "tenant-uuid",
    "provider": "gmail",
    "name": "Gmail Production",
    "is_enabled": true,
    "created_at": "2026-02-10T10:00:00Z"
  }
}
```

---

## 🚀 Paso 4: Crear Servicio para Enviar Emails

Crea `src/api/email/services/gmail-send.service.ts`:

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { EmailMessageService } from './email-message.service';
import { ThirdPartyConfig } from '../../../entities/integrations/third-party-config.entity';
import { EncryptionService } from '../../integrations/services/encryption.service';

@Injectable()
export class GmailSendService {
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
  ): Promise<string> {
    // Obtener configuración de Gmail
    const config = await this.configRepo.findOne({
      where: { tenant_id: tenantId, provider: 'gmail' },
    });

    if (!config || !config.is_enabled) {
      throw new BadRequestException('Gmail no está configurado para este tenant');
    }

    // Desencriptar credenciales
    const clientId = this.encryptionService.decrypt(config.encrypted_api_key);
    const clientSecret = this.encryptionService.decrypt(config.encrypted_api_secret);
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
    );

    try {
      // Enviar a través de Gmail
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: Buffer.from(message).toString('base64'),
        },
      });

      const gmailMessageId = response.data.id;

      // Guardar en email thread
      await this.emailMessageService.sendMessage(
        tenantId,
        threadId,
        fromEmail,
        toEmail,
        subject,
        body,
        bodyHtml,
      );

      return gmailMessageId;
    } catch (error) {
      console.error('Error enviando email con Gmail:', error);
      throw new BadRequestException('Error al enviar email con Gmail');
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
  ): string {
    const headers = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
    ];

    if (bodyHtml) {
      headers[3] = 'Content-Type: text/html; charset="UTF-8"';
    }

    return headers.join('\r\n') + '\r\n\r\n' + (bodyHtml || body);
  }

  /**
   * Refrescar token de acceso si está expirado
   */
  async refreshAccessTokenIfNeeded(tenantId: string): Promise<void> {
    const config = await this.configRepo.findOne({
      where: { tenant_id: tenantId, provider: 'gmail' },
    });

    if (!config) {
      throw new BadRequestException('Gmail no está configurado');
    }

    const expiresAt = new Date(config.metadata.expires_at);
    const now = new Date();

    // Si expira en menos de 5 minutos, refrescar
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      const clientId = this.encryptionService.decrypt(config.encrypted_api_key);
      const clientSecret = this.encryptionService.decrypt(config.encrypted_api_secret);
      const refreshToken = config.metadata.refresh_token;

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const { credentials } = await oauth2Client.refreshAccessToken();

      // Actualizar configuración
      config.metadata.access_token = credentials.access_token;
      config.metadata.expires_at = new Date(credentials.expiry_date).toISOString();

      await this.configRepo.save(config);
    }
  }
}
```

---

## 📤 Paso 5: Usar el Servicio para Enviar Emails

Actualiza el controller para usar Gmail:

```typescript
import { GmailSendService } from '../services/gmail-send.service';

@Controller('api/tenant/email-threads')
export class EmailThreadController {
  constructor(
    private threadService: EmailThreadService,
    private messageService: EmailMessageService,
    private gmailSendService: GmailSendService,
    private tenantContext: TenantContextService,
  ) {}

  @Post(':threadId/messages/send-via-gmail')
  @RequirePermissions({ entityType: 'EmailMessage', action: 'Create' })
  async sendMessageViaGmail(
    @Param('threadId') threadId: string,
    @Body()
    body: {
      fromEmail: string;
      toEmail: string;
      subject: string;
      body: string;
      bodyHtml?: string;
    },
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    // Refrescar token si es necesario
    await this.gmailSendService.refreshAccessTokenIfNeeded(tenantId);

    // Enviar a través de Gmail
    const gmailMessageId = await this.gmailSendService.sendViaGmail(
      tenantId,
      threadId,
      body.fromEmail,
      body.toEmail,
      body.subject,
      body.body,
      body.bodyHtml,
    );

    return {
      success: true,
      message: 'Email enviado a través de Gmail',
      gmailMessageId,
    };
  }
}
```

---

## 🧪 Paso 6: Probar Envío de Email

```bash
# 1. Crear un thread
curl -X POST http://localhost:3000/api/tenant/email-threads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "lead",
    "entityId": "lead-uuid",
    "emailTo": "prospect@example.com",
    "subject": "Test Email",
    "body": "This is a test email"
  }'

# 2. Enviar email a través de Gmail
curl -X POST http://localhost:3000/api/tenant/email-threads/THREAD_ID/messages/send-via-gmail \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromEmail": "tu-email@gmail.com",
    "toEmail": "recipient@example.com",
    "subject": "Test Email",
    "body": "This is a test email"
  }'
```

---

## 🔐 Seguridad

✅ **Encriptación:** Los valores sensibles se guardan encriptados
✅ **Aislamiento:** Cada tenant tiene su propia configuración
✅ **Permisos:** Solo usuarios con permisos pueden enviar emails
✅ **Audit:** Se registra quién creó/actualizó la configuración

---

## 📋 Resumen de Valores

| Valor | Dónde Obtenerlo | Dónde Guardarlo |
|-------|-----------------|-----------------|
| Client ID | Google Cloud Console | `encrypted_api_key` |
| Client Secret | Google Cloud Console | `encrypted_api_secret` |
| Refresh Token | Script get-gmail-token.js | `metadata.refresh_token` |
| Access Token | Script get-gmail-token.js | `metadata.access_token` |
| Email Account | Tu email de Gmail | `metadata.email_account` |
| Expires At | Del token | `metadata.expires_at` |

---

## ⚠️ Notas Importantes

1. **Refresh Token:** Guárdalo seguro, es permanente
2. **Access Token:** Se refresca automáticamente
3. **Scopes:** Necesitas los 3 scopes para enviar y recibir
4. **Encriptación:** Los valores se guardan encriptados en la BD
5. **Tenant:** Cada tenant puede tener su propia configuración de Gmail

---

## 🆘 Troubleshooting

### Error: "Gmail no está configurado"
- Verifica que la configuración existe en `third_party_configs`
- Verifica que `is_enabled = true`
- Verifica que `provider = 'gmail'`

### Error: "Invalid refresh token"
- El refresh token expiró
- Obtén uno nuevo con el script

### Error: "Unauthorized"
- El access token expiró
- Se refresca automáticamente, pero verifica que el refresh token sea válido

### Error: "Invalid credentials"
- Verifica que Client ID y Client Secret sean correctos
- Verifica que no estén encriptados dos veces
