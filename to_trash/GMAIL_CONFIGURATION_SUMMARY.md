# Configuración de Gmail - Resumen Completo

## 📍 Dónde se Guardan los Valores

Los valores de configuración de Gmail se guardan en la tabla **`third_party_configs`**:

```sql
SELECT * FROM third_party_configs 
WHERE provider = 'gmail' AND tenant_id = 'YOUR_TENANT_ID';
```

**Estructura:**
```
id: UUID (identificador único)
tenant_id: UUID (aislamiento multi-tenant)
provider: 'gmail'
name: 'Gmail Production' (nombre descriptivo)
encrypted_api_key: Client ID (encriptado con AES-256-GCM)
encrypted_api_secret: Client Secret (encriptado con AES-256-GCM)
metadata: JSON con:
  - refresh_token: Token permanente para renovar acceso
  - access_token: Token actual para enviar emails
  - email_account: Tu email de Gmail
  - scopes: Permisos solicitados
  - expires_at: Cuándo expira el access_token
is_enabled: true/false (habilitar/deshabilitar)
is_test_mode: true/false (modo prueba)
created_at: Cuándo se creó
updated_at: Última actualización
created_by: Usuario que lo creó
updated_by: Usuario que lo actualizó
```

---

## 🔧 Pasos para Configurar Gmail

### Paso 1: Obtener Credenciales de Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto: "Synergy Email"
3. Habilita Gmail API
4. Crea credenciales OAuth 2.0 (tipo: Web application)
5. Descarga el JSON con:
   - `client_id`
   - `client_secret`

### Paso 2: Obtener Refresh Token

Crea un archivo `get-gmail-token.js`:

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = 'TU_CLIENT_ID';
const CLIENT_SECRET = 'TU_CLIENT_SECRET';
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

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent',
});

console.log('Abre esta URL:\n', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Pega el código: ', async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log('\n✅ Tokens:');
  console.log('Access Token:', tokens.access_token);
  console.log('Refresh Token:', tokens.refresh_token);
  console.log('Expiry Date:', tokens.expiry_date);
  rl.close();
});
```

Ejecuta:
```bash
node get-gmail-token.js
```

### Paso 3: Guardar en la Base de Datos

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

---

## 📤 Nuevos Endpoints para Enviar Emails

### 1. Enviar Email a través de Gmail

```bash
POST /api/tenant/email-threads/:threadId/messages/send-via-gmail
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "fromEmail": "tu-email@gmail.com",
  "toEmail": "recipient@example.com",
  "subject": "Asunto del email",
  "body": "Cuerpo del email en texto plano",
  "bodyHtml": "<p>Cuerpo del email en HTML</p>",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Email enviado a través de Gmail",
  "gmailMessageId": "gmail-message-id-123"
}
```

### 2. Verificar si Gmail está Configurado

```bash
GET /api/tenant/email-threads/gmail/status
Authorization: Bearer YOUR_TOKEN
```

**Respuesta:**
```json
{
  "success": true,
  "gmailConfigured": true
}
```

### 3. Probar Configuración de Gmail

```bash
POST /api/tenant/email-threads/gmail/test
Authorization: Bearer YOUR_TOKEN
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Configuración de Gmail es válida"
}
```

---

## 🚀 Flujo Completo de Uso

### 1. Crear un Thread

```bash
curl -X POST http://localhost:3000/api/tenant/email-threads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "lead",
    "entityId": "lead-uuid",
    "emailTo": "prospect@example.com",
    "subject": "Seguimiento",
    "body": "Hola, quería hacer seguimiento..."
  }'
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "thread": {
      "id": "thread-uuid",
      "status": "draft"
    },
    "message": {
      "id": "msg-uuid"
    }
  }
}
```

### 2. Enviar a través de Gmail

```bash
curl -X POST http://localhost:3000/api/tenant/email-threads/thread-uuid/messages/send-via-gmail \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromEmail": "tu-email@gmail.com",
    "toEmail": "prospect@example.com",
    "subject": "Seguimiento",
    "body": "Hola, quería hacer seguimiento..."
  }'
```

Respuesta:
```json
{
  "success": true,
  "message": "Email enviado a través de Gmail",
  "gmailMessageId": "gmail-msg-123"
}
```

### 3. Verificar Estado

```bash
curl -X GET http://localhost:3000/api/tenant/email-threads/thread-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔐 Seguridad

✅ **Encriptación:** Los valores sensibles se guardan encriptados
✅ **Aislamiento:** Cada tenant tiene su propia configuración
✅ **Permisos:** Solo usuarios con `EmailMessage:Create` pueden enviar
✅ **Audit:** Se registra quién creó/actualizó la configuración
✅ **Token Refresh:** Se refresca automáticamente antes de expirar

---

## 📋 Tabla de Referencia

| Acción | Endpoint | Método | Permiso Requerido |
|--------|----------|--------|------------------|
| Crear thread | `/api/tenant/email-threads` | POST | EmailThread:Create |
| Listar threads | `/api/tenant/email-threads` | GET | EmailThread:Read |
| Enviar email (Gmail) | `/api/tenant/email-threads/:id/messages/send-via-gmail` | POST | EmailMessage:Create |
| Verificar Gmail | `/api/tenant/email-threads/gmail/status` | GET | EmailMessage:Read |
| Probar Gmail | `/api/tenant/email-threads/gmail/test` | POST | EmailMessage:Read |

---

## ⚠️ Notas Importantes

1. **Refresh Token:** Es permanente, guárdalo seguro
2. **Access Token:** Se refresca automáticamente cada 5 minutos antes de expirar
3. **Encriptación:** Los valores se guardan encriptados en la BD
4. **Multi-tenant:** Cada tenant puede tener su propia configuración
5. **Permisos:** Asegúrate de que los usuarios tengan los permisos necesarios

---

## 🆘 Troubleshooting

### Error: "Gmail no está configurado"
- Verifica que existe un registro en `third_party_configs` con `provider = 'gmail'`
- Verifica que `is_enabled = true`

### Error: "Invalid refresh token"
- El refresh token expiró
- Obtén uno nuevo con el script

### Error: "Unauthorized"
- El access token expiró
- Se refresca automáticamente, pero verifica el refresh token

### Error: "Invalid credentials"
- Verifica que Client ID y Client Secret sean correctos
- Verifica que no estén encriptados dos veces

---

## 📚 Archivos Creados

- `src/api/email/services/gmail-send.service.ts` - Servicio para enviar emails
- `src/api/email/email.module.ts` - Actualizado con GmailSendService
- `src/api/email/controllers/email-thread.controller.ts` - Nuevos endpoints
- `GMAIL_SETUP_GUIDE.md` - Guía detallada de configuración
- `GMAIL_CONFIGURATION_SUMMARY.md` - Este archivo

---

## ✅ Verificación

Para verificar que todo está funcionando:

```bash
# 1. Verificar que Gmail está configurado
curl -X GET http://localhost:3000/api/tenant/email-threads/gmail/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Probar la configuración
curl -X POST http://localhost:3000/api/tenant/email-threads/gmail/test \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Enviar un email de prueba
curl -X POST http://localhost:3000/api/tenant/email-threads/THREAD_ID/messages/send-via-gmail \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromEmail": "tu-email@gmail.com",
    "toEmail": "test@example.com",
    "subject": "Test",
    "body": "Test email"
  }'
```

---

## 🎯 Resumen

✅ Configuración de Gmail guardada en `third_party_configs`
✅ Valores encriptados con AES-256-GCM
✅ Servicio GmailSendService creado
✅ Nuevos endpoints para enviar emails
✅ Token refresh automático
✅ Multi-tenant support
✅ RBAC integration

**Status: ✅ LISTO PARA USAR**
