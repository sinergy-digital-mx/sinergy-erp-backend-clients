# Email Thread - Lead Relationship Fix

## Cambios Realizados

### 1. Agregada Foreign Key en EmailThread
- Nuevo campo: `lead_id` (int, nullable)
- Relación: `ManyToOne` con Lead
- Migración: `1770810000000-add-lead-fk-to-email-threads.ts`

### 2. Agregada Relación Inversa en Lead
- Nuevo campo: `emailThreads` (OneToMany)
- Ahora puedes acceder a todos los threads de un lead directamente

### 3. Actualizado EmailThreadService
- Al crear un thread para un lead, ahora guarda `lead_id`
- Busca el lead por ID y establece la relación

### 4. Actualizado LeadsService
- `findOne()` ahora carga `emailThreads` automáticamente
- Cuando obtienes un lead, ves todos sus threads

## Pasos para Aplicar

```bash
# 1. Ejecutar migraciones
npm run typeorm migration:run

# 2. Crear threads para lead 7286
npm run ts-node src/database/scripts/create-lead-7286-threads.ts
```

## Cómo Funciona Ahora

**Backend:**
```typescript
// Obtener un lead con sus threads
const lead = await leadsService.findOne(7286, tenantId);
console.log(lead.emailThreads); // Array de threads
```

**Frontend:**
```typescript
// GET /api/tenant/leads/7286
// Respuesta incluye:
{
  id: 7286,
  name: "John",
  email: "john@example.com",
  emailThreads: [
    { id: "uuid-1", subject: "Initial Contact", status: "sent" },
    { id: "uuid-2", subject: "Follow-up", status: "replied" }
  ]
}
```

## Queries Útiles

**Obtener threads de un lead:**
```sql
SELECT * FROM email_threads WHERE lead_id = 7286;
```

**Obtener leads con threads:**
```sql
SELECT l.* FROM leads l
JOIN email_threads et ON l.id = et.lead_id
WHERE l.tenant_id = 'tenant-uuid';
```

**Obtener leads sin threads:**
```sql
SELECT * FROM leads l
WHERE l.tenant_id = 'tenant-uuid'
AND l.id NOT IN (SELECT DISTINCT lead_id FROM email_threads WHERE lead_id IS NOT NULL);
```
