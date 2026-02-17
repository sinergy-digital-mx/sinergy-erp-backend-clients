# Gmail - Referencia Rápida

## 📍 ¿Dónde se guardan los valores?

**Tabla:** `third_party_configs`

```sql
SELECT * FROM third_party_configs 
WHERE provider = 'gmail' AND tenant_id = 'YOUR_TENANT_ID';
```

**Columnas importantes:**
- `encrypted_api_key` → Client ID (encriptado)
- `encrypted_api_secret` → Client Secret (encriptado)
- `metadata` → JSON con refresh_token, access_token, email_account, etc.

---

## 🔧 Configuración en 3 Pasos

### 1️⃣ Obtener Credenciales
- Ve a [Google Cloud Console](https://console.cloud.google.com)
- Crea proyecto → Habilita Gmail API → Crea OAuth 2.0
- Descarga JSON con `client_id` y `client_secret`

### 2️⃣ Obtener Refresh Token
```bash
node get-gmail-token.js
# Sigue las instrucciones para obtener:
# - access_token
# - refresh_token
# - expiry_date
```

### 3️⃣ Guardar en BD
```bash
curl -X POST http://localhost:3000/api/tenant/third-party-configs \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail",
    "name": "Gmail Production",
    "encrypted_api_key": "CLIENT_ID",
    "encrypted_api_secret": "CLIENT_SECRET",
    "metadata": {
      "refresh_token": "REFRESH_TOKEN",
      "access_token": "ACCESS_TOKEN",
      "email_account": "tu-email@gmail.com",
      "scopes": ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.modify"],
      "expires_at": "2026-02-10T15:00:00Z"
    },
    "is_enabled": true
  }'
```

---

## 📤 Enviar Emails

### Crear Thread
```bash
curl -X POST http://localhost:3000/api/tenant/email-threads \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "entityType": "lead",
    "entityId": "lead-uuid",
    "emailTo": "prospect@example.com",
    "subject": "Asunto",
    "body": "Mensaje"
  }'
```

### Enviar a través de Gmail
```bash
curl -X POST http://localhost:3000/api/tenant/email-threads/THREAD_ID/messages/send-via-gmail \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "fromEmail": "tu-email@gmail.com",
    "toEmail": "recipient@example.com",
    "subject": "Asunto",
    "body": "Mensaje"
  }'
```

---

## ✅ Verificar Configuración

```bash
# ¿Gmail está configurado?
curl -X GET http://localhost:3000/api/tenant/email-threads/gmail/status \
  -H "Authorization: Bearer TOKEN"

# Probar conexión
curl -X POST http://localhost:3000/api/tenant/email-threads/gmail/test \
  -H "Authorization: Bearer TOKEN"
```

---

## 🔐 Seguridad

- ✅ Valores encriptados en BD
- ✅ Aislamiento por tenant
- ✅ Token refresh automático
- ✅ Permisos RBAC requeridos

---

## 📚 Documentación Completa

- `GMAIL_SETUP_GUIDE.md` - Guía paso a paso
- `GMAIL_CONFIGURATION_SUMMARY.md` - Referencia completa
- `EMAIL_GMAIL_INTEGRATION_GUIDE.md` - Integración avanzada

---

## 🆘 Problemas Comunes

| Problema | Solución |
|----------|----------|
| "Gmail no configurado" | Verifica que existe en `third_party_configs` |
| "Invalid refresh token" | Obtén uno nuevo con el script |
| "Unauthorized" | Verifica que el access token sea válido |
| "Invalid credentials" | Verifica Client ID y Secret |

---

**¡Listo para enviar emails con Gmail!** 🚀
