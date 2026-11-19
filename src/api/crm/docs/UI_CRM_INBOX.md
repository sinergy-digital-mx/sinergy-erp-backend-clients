# UI — Portal CRM (inbox de actividades)

## Cambios

- 2026-11-02: Cada fila trae `seller` y lo muestra como **Vendedor**. Es el autor de la actividad; si la nota no tiene autor, el vendedor asignado al cliente; si tampoco, quien lo registró. El Excel usa el mismo nombre.
- 2026-10-15: Filtro y columna **Resultado** en el inbox. Query `outcome`. `none` = sin resultado. Valores: `satisfied`, `unsatisfied`, `issue_resolved`, `escalated`, `follow_up_needed`.

Contrato para Pollux. Las actividades se siguen capturando en el detalle del cliente. Este módulo es el inbox / portal de seguimiento.

Ruta UI: `/crm`

Permiso: `customers:Read` (menú: `customers:ViewMenu`). Escribir desde el inbox reusa `customers:Update`.

---

## Quién ve qué

| Usuario | Alcance |
|---------|---------|
| Cualquiera con `customers:Read` | Solo las actividades que **él creó** (`user_id` = JWT) |
| `is_crm_admin = true` o rol Admin | Todas las actividades. Filtro por autor |

`is_crm_admin` se configura en el modal de usuario → tab **Información general**. No es un tab nuevo.

Login y `GET /api/tenant/users/:id` incluyen `is_crm_admin`.

---

## Endpoints

Base: `/api/tenant/crm`

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/activities` | Listado paginado |
| GET | `/activities/stats` | KPIs del periodo + pendientes |
| GET | `/activities/authors` | Autores que ya crearon actividad (admin CRM) |
| GET | `/activities/export/excel` | Excel de todas las filas con los filtros actuales. Ver `UI_CRM_EXPORT.md` |

Editar una fila: el modal existente

```
PATCH /api/tenant/customers/:customerId/activities/:id
```

`customer_id` viene en cada fila.

---

## Filtros del listado

Mismos query params en list y stats (salvo `attention`, que solo aplica al listado).

| Param | Valores | Default |
|-------|---------|---------|
| `search` | texto en nota, título o descripción | — |
| `type` | `call` `whatsapp` `email` `home_visit` `store_visit` `meeting` `note` `task` `follow_up` `purchase` `support` | — |
| `status` | `completed` `scheduled` `cancelled` `in_progress` | — |
| `outcome` | `satisfied` `unsatisfied` `issue_resolved` `escalated` `follow_up_needed` `none` | — |
| `user_id` | uuid del vendedor | admin CRM filtra a cualquiera; si no, solo el propio |
| `period` | `today` `week` `month` `year` `range` | `month` |
| `date_from` / `date_to` | `YYYY-MM-DD` | solo si `period=range` |
| `attention` | `follow_up_pending` `follow_up_overdue` `call_pending` `task_pending` | — |
| `page` / `limit` | | 1 / 20 (máx 100) |
| `sort_by` | `activity_date` `follow_up_date` `created_at` `title` `type` `status` | `activity_date` (o `follow_up_date` si hay `attention`) |
| `sort_order` | `ASC` `DESC` | `DESC` |

Periodo: **un solo** chip activo, igual que reporte de ventas. `Hoy` / `Semana` / `Mes` / `Año` **no** mandan fechas. Solo **Rango** manda `period=range` + `date_from` + `date_to`. Usar `app-report-period-selector` con `includeYear` y `monthAsServerPreset`.

Si hay `attention`, el listado **no** recorta por `activity_date` (para no esconder vencidos de otro mes).

Un no-admin que mande `user_id` de otra persona recibe 403.

```
GET /api/tenant/crm/activities?period=month&search=llamar&type=call&page=1&limit=20
GET /api/tenant/crm/activities?period=range&date_from=2026-09-01&date_to=2026-09-30&user_id={uuid}
GET /api/tenant/crm/activities?attention=follow_up_overdue
```

---

## Respuesta listado

```json
{
  "activities": [
    {
      "id": "uuid",
      "customer_id": 12,
      "customer": {
        "id": 12,
        "name": "Ana",
        "lastname": "López",
        "company_name": null,
        "display_name": "Ana López",
        "created_by": {
          "id": "uuid-alta",
          "first_name": "María",
          "last_name": "García",
          "email": "maria@acme.mx",
          "display_name": "María García"
        },
        "assigned_seller": {
          "id": "uuid-vendedor",
          "first_name": "Luis",
          "last_name": "Nava",
          "email": "luis@acme.mx",
          "display_name": "Luis Nava"
        }
      },
      "user_id": "uuid-autor",
      "user": {
        "id": "uuid-autor",
        "first_name": "Carlos",
        "last_name": "Ruiz",
        "email": "carlos@acme.mx",
        "display_name": "Carlos Ruiz"
      },
      "seller": {
        "id": "uuid-autor",
        "first_name": "Carlos",
        "last_name": "Ruiz",
        "email": "carlos@acme.mx",
        "display_name": "Carlos Ruiz"
      },
      "type": "call",
      "status": "scheduled",
      "title": "Llamar para cotización",
      "description": null,
      "notes": "Prefiere por la tarde",
      "activity_date": "2026-09-10T17:00:00.000Z",
      "follow_up_date": "2026-09-12T15:00:00.000Z",
      "duration_minutes": 15,
      "outcome": null,
      "is_overdue_follow_up": false,
      "created_at": "2026-09-10T17:00:00.000Z",
      "updated_at": "2026-09-10T17:00:00.000Z"
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "hasNext": false,
  "hasPrev": false,
  "is_crm_admin": true
}
```

`is_crm_admin` en la respuesta = puede ver a todos (flag **o** rol Admin). El buscador de vendedor usa `/activities/authors`.

Cliente: navegar a `/customers/detail/:customer_id`.

Bajo el nombre del cliente, **Vendedor** es `seller`. Orden: autor de la actividad (`user`), vendedor asignado al cliente (`customer.assigned_seller`), quien dio de alta al cliente (`customer.created_by`). Si los tres vienen vacíos, no mostrar la línea. `user` sigue siendo el autor real; en notas viejas puede ser `null`.

---

## Stats

```
GET /api/tenant/crm/activities/stats?period=month
```

`totals` respeta periodo + `search` + `type` + `user_id`.

`attention` **no** usa el periodo: es el inbox de ahora (sí respeta `user_id` del admin).

```json
{
  "is_crm_admin": false,
  "period": {
    "period": "month",
    "date_from": "2026-09-01",
    "date_to": "2026-09-10",
    "label": "Mes"
  },
  "totals": {
    "activities": 12,
    "by_type": { "call": 4, "note": 8 },
    "by_status": { "completed": 9, "scheduled": 3 }
  },
  "attention": {
    "pending_calls": 3,
    "pending_follow_ups": 5,
    "overdue_follow_ups": 2,
    "upcoming_follow_ups": 3,
    "pending_tasks": 1
  }
}
```

Cards recomendadas (clic filtra el listado con `attention`):

| Card | Campo | `attention` |
|------|-------|-------------|
| Actividades del periodo | `totals.activities` | quitar `attention` |
| Llamadas pendientes | `attention.pending_calls` | `call_pending` |
| Seguimientos pendientes | `attention.pending_follow_ups` | `follow_up_pending` |
| Seguimientos vencidos | `attention.overdue_follow_ups` | `follow_up_overdue` |

Pendiente = `scheduled` / `in_progress`. Seguimiento = tiene `follow_up_date` y no está `completed` / `cancelled`.

---

## Autores (filtro vendedor)

```
GET /api/tenant/crm/activities/authors
```

Solo quienes **ya crearon** al menos una actividad. No es el catálogo de usuarios.

- Admin CRM / rol Admin: todos los autores con actividad.
- Si no: solo el usuario actual, y únicamente si ya creó alguna.

```json
{
  "is_crm_admin": true,
  "authors": [
    {
      "id": "uuid",
      "first_name": "Carlos",
      "last_name": "Ruiz",
      "email": "carlos@acme.mx",
      "display_name": "Carlos Ruiz",
      "activity_count": 14
    }
  ]
}
```

UI: autocomplete **Vendedor** con búsqueda local (mismo patrón que proveedor en órdenes de compra). Opción “Todos los vendedores”. Filtrar por nombre.

---

## UI

1. Header **CRM** + **Descargar Excel** (filtros actuales, ver `UI_CRM_EXPORT.md`) + chip de periodo (`app-report-period-selector`).
2. Filtros: search de nota, tipo, estado, resultado, vendedor (autocomplete).
3. Cuatro KPIs. El de pendientes/vencidos se ilumina si hay conteo > 0.
4. Tabla: cliente + vendedor (misma columna, el vendedor en pill gris: `Vendedor {seller.display_name}`), tipo, título/nota, estado, resultado, fecha (`dd/MM/yyyy`), seguimiento (`dd/MM/yyyy` + tag Vencido). Sin columna de acciones. Resultado vacío se muestra como "—". El filtro **Sin resultado** manda `outcome=none`.
5. Clic en la fila abre el mismo modal de actividad del cliente (`customers:Update`). El nombre del cliente abre su detalle. La palomita para completar el seguimiento está en ese modal (`PATCH` con `status: completed`), no en la tabla. No se muestra si la actividad ya está completada o cancelada.
