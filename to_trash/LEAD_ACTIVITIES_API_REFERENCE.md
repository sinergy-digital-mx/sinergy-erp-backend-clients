# Lead Activities API - Referencia Completa

## POST /leads/:leadId/activities (Crear Actividad)

### URL
```
POST /leads/{leadId}/activities
```

### Headers Requeridos
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Campos REQUERIDOS ✅
```json
{
    "type": "string",           // ✅ REQUERIDO - Tipo de actividad
    "title": "string",          // ✅ REQUERIDO - Título de la actividad  
    "description": "string",    // ✅ REQUERIDO - Descripción detallada
    "notes": "string"           // ✅ REQUERIDO - Notas adicionales
}
```

### Campos OPCIONALES 🔄
```json
{
    "status": "string",             // 🔄 OPCIONAL - Estado (default: "completed")
    "duration_minutes": "number",   // 🔄 OPCIONAL - Duración en minutos
    "outcome": "string",            // 🔄 OPCIONAL - Resultado de la actividad
    "follow_up_date": "string",     // 🔄 OPCIONAL - Fecha de seguimiento ISO UTC
    "metadata": "object"            // 🔄 OPCIONAL - Datos adicionales JSON
}
```

### Campos AUTOMÁTICOS 🤖 (NO enviar)
```json
{
    "id": "uuid",               // 🤖 AUTO - UUID generado
    "lead_id": "number",        // 🤖 AUTO - Extraído de la URL (:leadId)
    "user_id": "string",        // 🤖 AUTO - ID del usuario de la sesión JWT
    "tenant_id": "string",      // 🤖 AUTO - Tenant del usuario de la sesión JWT
    "activity_date": "timestamp", // 🤖 AUTO - Timestamp UTC actual (cuando se crea)
    "created_at": "timestamp",  // 🤖 AUTO - Timestamp UTC de creación
    "updated_at": "timestamp"   // 🤖 AUTO - Timestamp UTC de actualización
}
```

## Tipos de Actividad Válidos

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

## Estados de Actividad Válidos

```typescript
enum ActivityStatus {
    COMPLETED = 'completed',      // Por defecto
    SCHEDULED = 'scheduled',
    CANCELLED = 'cancelled',
    IN_PROGRESS = 'in_progress'
}
```

## Ejemplo de Request Mínimo

```json
{
    "type": "call",
    "title": "Follow-up call",
    "description": "Discussed pricing options with the client",
    "notes": "Client is interested in the premium package"
}
```

## Ejemplo de Request Completo

```json
{
    "type": "call",
    "status": "completed",
    "title": "Follow-up call with prospect",
    "description": "Discussed pricing and next steps",
    "notes": "Customer seemed very interested, send proposal by Friday",
    "duration_minutes": 30,
    "outcome": "Interested in premium package",
    "follow_up_date": "2024-02-01T10:00:00Z",
    "metadata": {
        "call_quality": "excellent",
        "customer_mood": "positive",
        "priority": "high"
    }
}
```

## Ejemplo de Respuesta

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "call",
    "status": "completed",
    "title": "Follow-up call with prospect",
    "description": "Discussed pricing and next steps",
    "notes": "Customer seemed very interested, send proposal by Friday",
    "activity_date": "2024-01-27T14:30:00.000Z",
    "duration_minutes": 30,
    "outcome": "Interested in premium package",
    "follow_up_date": "2024-02-01T10:00:00.000Z",
    "metadata": {
        "call_quality": "excellent",
        "customer_mood": "positive",
        "priority": "high"
    },
    "lead_id": 123,
    "user_id": "user-uuid-here",
    "tenant_id": "tenant-uuid-here",
    "created_at": "2024-01-27T14:30:15.123Z",
    "updated_at": "2024-01-27T14:30:15.123Z"
}
```

## Validaciones

### Fechas:
- `activity_date`: **AUTO-GENERADO** - Se establece automáticamente al momento de crear la actividad (UTC)
- `follow_up_date`: Formato ISO 8601 con timezone UTC (opcional)

### Duración:
- `duration_minutes`: Entre 1 y 1440 minutos (máximo 24 horas)

### Strings:
- `type`: Debe ser uno de los valores del enum ActivityType
- `status`: Debe ser uno de los valores del enum ActivityStatus
- `title`, `description`, `notes`: Strings no vacíos

## Permisos Requeridos

- **Crear**: `Lead:Activity:Create`
- **Leer**: `Lead:Activity:Read`
- **Actualizar**: `Lead:Activity:Update`
- **Eliminar**: `Lead:Activity:Delete`

## Notas Importantes

1. **Usuario Automático**: El `user_id` se extrae automáticamente del JWT del usuario autenticado
2. **Tenant Automático**: El `tenant_id` se extrae automáticamente del JWT del usuario autenticado
3. **Fecha Automática**: El `activity_date` se genera automáticamente con el timestamp actual en UTC
4. **Lead Validation**: Se verifica que el lead exista y pertenezca al tenant del usuario
5. **UTC Storage**: Todas las fechas se almacenan en UTC en la base de datos
6. **Metadata**: Puede contener cualquier objeto JSON para datos personalizados
7. **Fecha Inmutable**: Una vez creada, el `activity_date` no se puede modificar

## Endpoints Relacionados

- `GET /leads/:leadId/activities` - Listar actividades (con paginación y filtros)
- `GET /leads/:leadId/activities/:id` - Obtener actividad específica
- `PATCH /leads/:leadId/activities/:id` - Actualizar actividad
- `DELETE /leads/:leadId/activities/:id` - Eliminar actividad
- `GET /leads/:leadId/activities/summary` - Resumen de actividades