# Leads API - Campos Requeridos vs Automáticos

## 1. POST /leads (Crear Lead)

### Campos REQUERIDOS:
```json
{
    "name": "string",           // ✅ REQUERIDO - Nombre del lead
    "lastname": "string",       // ✅ REQUERIDO - Apellido del lead  
    "email": "string",          // ✅ REQUERIDO - Email válido
    "phone": "string",          // ✅ REQUERIDO - Teléfono
    "phone_country": "string",  // ✅ REQUERIDO - Código país (ej: "US")
    "phone_code": "string"      // ✅ REQUERIDO - Código telefónico (ej: "+1")
}
```

### Campos OPCIONALES:
```json
{
    "status_id": "number",      // 🔄 OPCIONAL - Si no se envía, usa status "new" por defecto
    "source": "string",         // 🔄 OPCIONAL - Fuente del lead
    "company_name": "string",   // 🔄 OPCIONAL - Nombre de la empresa
    "company_phone": "string",  // 🔄 OPCIONAL - Teléfono de la empresa
    "website": "string"         // 🔄 OPCIONAL - Sitio web
}
```

### Campos AUTOMÁTICOS (no enviar):
```json
{
    "id": "number",             // 🤖 AUTO - ID generado automáticamente
    "tenant_id": "string",      // 🤖 AUTO - Extraído del JWT del usuario
    "created_at": "datetime"    // 🤖 AUTO - Timestamp de creación
}
```

### Ejemplo de Request Mínimo:
```json
{
    "name": "John",
    "lastname": "Doe", 
    "email": "john@example.com",
    "phone": "+1234567890",
    "phone_country": "US",
    "phone_code": "+1"
}
```

### Ejemplo de Request Completo:
```json
{
    "name": "John",
    "lastname": "Doe",
    "email": "john@example.com", 
    "phone": "+1234567890",
    "phone_country": "US",
    "phone_code": "+1",
    "status_id": 1,
    "source": "Website Form",
    "company_name": "Acme Corp",
    "company_phone": "+1234567890",
    "website": "https://acme.com"
}
```

---

## 2. POST /leads/:leadId/activities (Crear Actividad de Lead)

### Campos REQUERIDOS:
```json
{
    "type": "string",           // ✅ REQUERIDO - Tipo: "call", "email", "meeting", "note", "task", "follow_up"
    "title": "string",          // ✅ REQUERIDO - Título de la actividad
    "activity_date": "string"   // ✅ REQUERIDO - Fecha ISO (ej: "2024-01-27T14:30:00Z")
}
```

### Campos OPCIONALES:
```json
{
    "status": "string",             // 🔄 OPCIONAL - "completed" (default), "scheduled", "cancelled", "in_progress"
    "description": "string",        // 🔄 OPCIONAL - Descripción detallada
    "duration_minutes": "number",   // 🔄 OPCIONAL - Duración en minutos (1-1440)
    "outcome": "string",            // 🔄 OPCIONAL - Resultado de la actividad
    "follow_up_date": "string",     // 🔄 OPCIONAL - Fecha de seguimiento ISO
    "notes": "string",              // 🔄 OPCIONAL - Notas adicionales
    "metadata": "object"            // 🔄 OPCIONAL - Datos adicionales como JSON
}
```

### Campos AUTOMÁTICOS (no enviar):
```json
{
    "id": "string",             // 🤖 AUTO - UUID generado automáticamente
    "lead_id": "number",        // 🤖 AUTO - Extraído de la URL (:leadId)
    "user_id": "string",        // 🤖 AUTO - ID del usuario del JWT
    "tenant_id": "string",      // 🤖 AUTO - Tenant del usuario del JWT
    "created_at": "datetime",   // 🤖 AUTO - Timestamp de creación
    "updated_at": "datetime"    // 🤖 AUTO - Timestamp de actualización
}
```

### Ejemplo de Request Mínimo:
```json
{
    "type": "call",
    "title": "Follow-up call",
    "activity_date": "2024-01-27T14:30:00Z"
}
```

### Ejemplo de Request Completo (tu ejemplo):
```json
{
    "type": "call",
    "status": "completed",
    "title": "Follow-up call with prospect",
    "description": "Discussed pricing and next steps",
    "activity_date": "2024-01-27T14:30:00Z",
    "duration_minutes": 30,
    "outcome": "Interested in premium package",
    "follow_up_date": "2024-02-01T10:00:00Z",
    "notes": "Customer seemed very interested, send proposal by Friday",
    "metadata": {
        "call_quality": "excellent",
        "customer_mood": "positive"
    }
}
```

---

## 3. Tipos de Actividad Válidos

```typescript
enum ActivityType {
    CALL = 'call',
    EMAIL = 'email', 
    MEETING = 'meeting',
    NOTE = 'note',
    TASK = 'task',
    FOLLOW_UP = 'follow_up'
}
```

## 4. Estados de Actividad Válidos

```typescript
enum ActivityStatus {
    COMPLETED = 'completed',      // Por defecto
    SCHEDULED = 'scheduled',
    CANCELLED = 'cancelled', 
    IN_PROGRESS = 'in_progress'
}
```

---

## 5. Notas Importantes

### Para Leads:
- El `tenant_id` se extrae automáticamente del JWT del usuario autenticado
- Si no se especifica `status_id`, se asigna automáticamente el status "new"
- Los campos de teléfono son requeridos para validación y formateo

### Para Actividades:
- El `lead_id` se extrae de la URL del endpoint
- El `user_id` se extrae del JWT del usuario autenticado
- El `status` por defecto es "completed"
- Las fechas deben estar en formato ISO 8601
- `duration_minutes` tiene un máximo de 1440 (24 horas)
- `metadata` puede contener cualquier objeto JSON para datos personalizados

### Autenticación:
- Todos los endpoints requieren header: `Authorization: Bearer <token>`
- El usuario debe tener permisos `Lead:Create` y `Lead:Activity:Create` respectivamente