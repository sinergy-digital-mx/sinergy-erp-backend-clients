# Lead Conversation Tracking System

## Overview

Sistema mejorado para trackear el flujo completo de conversaciones con leads, desde el primer contacto hasta conversaciones activas.

## Estados de Conversación

### 1. **No Contactado** 
- `email_contacted = false`
- Lead que aún no ha sido contactado por email

### 2. **Contactado (Sin Respuesta)**
- `email_contacted = true AND customer_answered = false`
- Lead contactado pero el cliente no ha respondido aún

### 3. **Esperando Mi Respuesta** ⏰
- `email_contacted = true AND customer_answered = true AND agent_replied_back = false`
- El cliente ya respondió pero tú no has contestado de vuelta
- **Este es el estado más importante para seguimiento**

### 4. **Conversación Activa** 💬
- `email_contacted = true AND customer_answered = true AND agent_replied_back = true`
- Ambas partes han intercambiado mensajes

## Nuevos Campos en la Base de Datos

```sql
ALTER TABLE leads ADD COLUMN agent_replied_back BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN agent_replied_back_at TIMESTAMP NULL;
```

### Campos de Tracking:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `email_contacted` | boolean | Si ya contactaste al lead |
| `first_email_sent_at` | timestamp | Cuándo enviaste el primer email |
| `customer_answered` | boolean | Si el cliente ya respondió |
| `customer_answered_at` | timestamp | Cuándo respondió el cliente |
| `agent_replied_back` | boolean | Si ya respondiste al cliente |
| `agent_replied_back_at` | timestamp | Cuándo respondiste de vuelta |

## Nuevos Filtros API

### Query Parameters:

```typescript
// Filtros existentes
email_contacted?: boolean          // Filtrar por contactados
customer_answered?: boolean        // Filtrar por respuesta del cliente
contacted_no_reply?: boolean       // Contactados sin respuesta

// Nuevos filtros
awaiting_agent_reply?: boolean     // Esperando tu respuesta
agent_replied_back?: boolean       // Ya respondiste de vuelta
```

### Ejemplos de Uso:

```bash
# Leads esperando tu respuesta (PRIORITARIO)
GET /leads?awaiting_agent_reply=true

# Leads contactados pero sin respuesta del cliente
GET /leads?contacted_no_reply=true

# Conversaciones activas
GET /leads?email_contacted=true&customer_answered=true&agent_replied_back=true

# Leads que no has contactado
GET /leads?email_contacted=false
```

## Estadísticas Mejoradas

### Endpoint: `GET /leads/stats/overview`

```json
{
  "total_leads": 7285,
  "not_contacted": 7279,
  "contacted_via_email": 6,
  "customer_responded_no_reply": 1,
  "awaiting_agent_reply": 5,        // ⏰ NUEVO: Esperando tu respuesta
  "conversation_active": 0,         // 💬 NUEVO: Conversaciones activas
  "customer_responded": 5
}
```

## Flujo de Trabajo Recomendado

### 1. **Prioridad Alta: Esperando Mi Respuesta**
```bash
GET /leads?awaiting_agent_reply=true
```
- Estos leads ya mostraron interés (respondieron)
- Requieren respuesta inmediata para mantener el momentum

### 2. **Seguimiento: Contactados Sin Respuesta**
```bash
GET /leads?contacted_no_reply=true
```
- Leads contactados que no han respondido
- Candidatos para follow-up o segundo contacto

### 3. **Mantenimiento: Conversaciones Activas**
```bash
GET /leads?email_contacted=true&customer_answered=true&agent_replied_back=true
```
- Conversaciones en progreso
- Revisar para próximos pasos

### 4. **Prospección: No Contactados**
```bash
GET /leads?email_contacted=false
```
- Leads frescos para contactar
- Base para nuevas campañas

## Actualización de Estados

### Cuando contactas un lead:
```typescript
await leadService.update(leadId, {
  email_contacted: true,
  first_email_sent_at: new Date()
});
```

### Cuando el cliente responde:
```typescript
await leadService.update(leadId, {
  customer_answered: true,
  customer_answered_at: new Date()
});
```

### Cuando respondes de vuelta:
```typescript
await leadService.update(leadId, {
  agent_replied_back: true,
  agent_replied_back_at: new Date()
});
```

## Dashboard Sugerido

### Tarjetas de Estado:
1. **🔥 Esperando Mi Respuesta** - `awaiting_agent_reply: true`
2. **⏳ Contactados (Sin Respuesta)** - `contacted_no_reply: true`  
3. **💬 Conversaciones Activas** - `conversation_active`
4. **📧 No Contactados** - `email_contacted: false`

### Filtros Rápidos:
- "Contactado" → `contacted_no_reply=true`
- "Esperando Respuesta" → `awaiting_agent_reply=true`
- "Conversación Activa" → `agent_replied_back=true`

## Beneficios del Sistema

✅ **Visibilidad Completa** - Sabes exactamente en qué estado está cada lead  
✅ **Priorización Clara** - Los leads que respondieron tienen prioridad  
✅ **Seguimiento Efectivo** - No se pierden leads en el proceso  
✅ **Métricas Precisas** - Estadísticas detalladas del funnel de conversación  
✅ **Workflow Optimizado** - Flujo de trabajo basado en prioridades  

## Migración Completada

- ✅ Campos agregados a la base de datos
- ✅ Entidad Lead actualizada
- ✅ DTOs actualizados con nuevos filtros
- ✅ Servicio actualizado con nueva lógica
- ✅ Estadísticas mejoradas
- ✅ Datos de ejemplo creados (6 leads contactados, 5 esperando respuesta)

El sistema está listo para usar con mejor tracking de conversaciones.