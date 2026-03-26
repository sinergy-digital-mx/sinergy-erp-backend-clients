# Lead Activity - Campos Requeridos (Resumen)

## POST /leads/:leadId/activities

### ✅ CAMPOS REQUERIDOS (enviar):
```json
{
    "type": "call|email|meeting|note|task|follow_up",
    "title": "string",
    "description": "string", 
    "notes": "string"
}
```

### 🔄 CAMPOS OPCIONALES:
```json
{
    "status": "completed|scheduled|cancelled|in_progress",
    "duration_minutes": 30,
    "outcome": "string",
    "follow_up_date": "2024-02-01T10:00:00Z",
    "metadata": { "key": "value" }
}
```

### 🤖 CAMPOS AUTOMÁTICOS (NO enviar):
- `activity_date` - **Se genera automáticamente con la fecha/hora actual**
- `user_id` - Extraído de la sesión JWT
- `tenant_id` - Extraído de la sesión JWT
- `lead_id` - Extraído de la URL
- `id`, `created_at`, `updated_at` - Generados automáticamente

---

## Ejemplo Mínimo:
```json
{
    "type": "call",
    "title": "Follow-up call",
    "description": "Discussed pricing options",
    "notes": "Client interested in premium package"
}
```

**El `activity_date` se establece automáticamente al momento de crear la actividad.**