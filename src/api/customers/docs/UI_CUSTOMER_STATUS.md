# UI — Estatus de clientes

Guía para Pollux: columna **Estatus** en listado de clientes y edición del estatus en el modal de cliente.

---

## Catálogo de estatus

```
GET /api/tenant/customers/statuses
Permiso: customers:Read
```

Respuesta:

```json
[
  { "id": 1, "code": "ACTIVE", "name": "Activo" },
  { "id": 2, "code": "INACTIVE", "name": "Inactivo" },
  { "id": 3, "code": "SUSPENDED", "name": "Suspendido" },
  { "id": 4, "code": "DELETED", "name": "Eliminado" }
]
```

Cargar **una vez** al abrir el módulo Clientes (o al montar el modal) y cachear en memoria.

---

## Listado de clientes

```
GET /api/tenant/customers?page=1&limit=20
GET /api/tenant/customers?status_id=1
```

Cada cliente incluye el objeto `status`:

```json
{
  "id": 123,
  "name": "Juan",
  "lastname": "Pérez",
  "status_id": 1,
  "status": {
    "id": 1,
    "code": "ACTIVE",
    "name": "Activo"
  }
}
```

### Columna Estatus en tabla

| Origen | Formato UI |
|--------|------------|
| `status.name` | Texto legible: "Activo", "Inactivo", etc. |
| `status.code` | Badge color (opcional) |

Sugerencia de colores:

| code | Badge |
|------|-------|
| `ACTIVE` | Verde |
| `INACTIVE` | Gris |
| `SUSPENDED` | Amarillo |
| `DELETED` | Rojo |

Si `status` es `null` (no debería tras backfill), mostrar "Sin estatus" y permitir editar.

---

## Crear cliente

```
POST /api/tenant/customers
```

`status_id` es **opcional**. Si se omite, el backend asigna **Activo** (`ACTIVE`).

```json
{
  "name": "María",
  "lastname": "López",
  "email": "maria@ejemplo.com",
  "status_id": 1
}
```

---

## Actualizar estatus (editar cliente)

```
PUT /api/tenant/customers/:id
```

Enviar solo `status_id` o incluirlo en el body completo del formulario:

```json
{
  "name": "María",
  "lastname": "López",
  "status_id": 2
}
```

El backend reemplaza la relación `status` con el id indicado.

---

## UI — Modal Editar / Crear cliente

Agregar campo **Estatus** (select):

```
┌─────────────────────────────────────┐
│ Editar cliente                [ X ] │
├─────────────────────────────────────┤
│ Nombre *                            │
│ Apellido                            │
│ Email                               │
│ ...                                 │
│                                     │
│ Estatus *                           │
│ [ Activo                    ▼ ]     │
│   Opciones desde GET /statuses      │
│                                     │
│              [ Cancelar ] [ Guardar ]│
└─────────────────────────────────────┘
```

### Flujo en componente

```typescript
// Al abrir módulo o modal
const statuses = await api.get('/tenant/customers/statuses');

// Al guardar (crear o editar)
const body = {
  ...form,
  status_id: form.statusId ?? statuses.find(s => s.code === 'ACTIVE')?.id,
};
await api.put(`/tenant/customers/${id}`, body);
// o POST al crear
```

### Filtro en listado (opcional)

Dropdown sobre la tabla:

```
Estatus: [ Todos ▼ ] [ Activo ] [ Inactivo ] ...
```

Al elegir uno:

```
GET /tenant/customers?status_id=2&page=1&limit=20
```

---

## Permisos

| Acción UI | Permiso |
|-----------|---------|
| Ver columna / catálogo | `customers:Read` |
| Cambiar estatus al editar | `customers:Update` |

Ocultar el select de estatus si no tiene `customers:Update`.

---

## Checklist Pollux

- [ ] `GET /tenant/customers/statuses` al cargar módulo
- [ ] Columna tabla: `customer.status?.name ?? '—'`
- [ ] Select **Estatus** en modal crear/editar
- [ ] `PUT` con `status_id` al guardar
- [ ] Filtro opcional por `status_id` en listado
- [ ] Badges por `status.code`
