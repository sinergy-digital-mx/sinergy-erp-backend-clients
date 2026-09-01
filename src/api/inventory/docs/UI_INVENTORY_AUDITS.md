# Auditoría de inventario por lote — Guía para UI

Conteo físico y corrección de existencias **por lote**, con trazabilidad de quién contó, cuándo y quién autorizó.

No existía: el inventario solo tenía consulta, transferencias e importación. Este flujo es el único que **escribe `available_quantity`** de un lote ya creado (fuera de ventas/transferencias).

## Modelo

```
Organización
 └── Razón social → sucursal → almacén
      └── Auditoría AUD-000001 (documento)
           └── Línea por lote: sistema vs contado → corrección
```

| Concepto | Descripción |
|----------|-------------|
| **Auditoría** | Documento `AUD-000001` sobre un almacén (opcionalmente un producto). |
| **Snapshot** | Al crear, se congela `available_quantity` de cada lote como `system_quantity`. |
| **Conteo** | El usuario captura `counted_quantity` por lote. `0` es válido (no había mercancía). |
| **Varianza** | `counted_quantity - system_quantity`. Si hay diferencia, el motivo es obligatorio. |
| **Autorización** | Al autorizar, `available_quantity` del lote **queda igual** a lo contado. |

### Estados

```
draft → submitted → posted
  │         │
  └── cancel  └── cancel
              └── reject → draft (se puede recapturar)
```

| Estado | UI | Quién actúa |
|--------|----|-------------|
| `draft` | Borrador / conteo en curso | Contador (`Inventory:Count`) |
| `submitted` | En revisión | Autorizador (`Inventory:Authorize`) |
| `posted` | Aplicada (solo lectura) | — |
| `cancelled` | Cancelada (no tocó stock) | — |

Una sola auditoría **abierta** (`draft` o `submitted`) por almacén. Si el alcance es un producto, no puede haber otra abierta del mismo producto ni una del almacén completo.

## Endpoints

Base: `/api/tenant/inventory/audits`

| Método | Ruta | Permiso | Uso |
|--------|------|---------|-----|
| `GET` | `/context?warehouse_id=&product_id=` | Count | Preview de lotes + si ya hay abierta |
| `POST` | `/` | Count | Crear snapshot (borrador) |
| `GET` | `/` | Read | Historial paginado |
| `GET` | `/:id` | Read | Detalle + líneas |
| `PATCH` | `/:id/lines` | Count | Guardar cantidades contadas |
| `POST` | `/:id/lines` | Count | Agregar lote extra (p. ej. existencia 0) |
| `POST` | `/:id/submit` | Count | Enviar a autorización |
| `POST` | `/:id/authorize` | Authorize | Aplicar corrección al lote |
| `POST` | `/:id/reject` | Authorize | Devolver a borrador |
| `POST` | `/:id/cancel` | Count | Cancelar sin aplicar |

Detalle de lote (`GET /api/tenant/inventory/batches/:id`) incluye `audit_history`, `movements` (tab Movimientos, ver `UI_INVENTORY_BATCH_MOVEMENTS.md`) y `movement_summary.by_type.adjustments`.

## Flujo UI sugerido

### 1. Listado — `/inventario/auditorias`

Filtros: búsqueda (folio / producto), razón social → sucursal → almacén (`GET /api/tenant/inventory/locations`), estado, fechas.

Columnas: folio, almacén (3 niveles), producto o “Todo el almacén”, estado, lotes contados / total, varíanza, creado por / fecha, autorizado por / fecha.

Badge de estado:

| status | Label | Color |
|--------|-------|-------|
| `draft` | Borrador | gris |
| `submitted` | En revisión | ámbar |
| `posted` | Aplicada | verde |
| `cancelled` | Cancelada | rojo suave |

Botón **Nueva auditoría** solo con `Inventory:Count`.

### 2. Crear

1. `GET /context?warehouse_id=` (y `product_id` si aplica).
2. Si `open_audit_id` viene, no crear: ir a esa auditoría o pedir cancelarla.
3. Mostrar tabla de lotes a incluir y total.
4. Checkbox **Incluir lotes en cero** → `include_empty_lots`.
5. `POST /` con `{ warehouse_id, product_id?, include_empty_lots?, notes? }`.

Pausar salidas del almacén mientras dura el conteo: al autorizar se **sobrescribe** la existencia con lo contado.

### 3. Captura (borrador)

Tabla por lote: número, producto, SKU, medida, UOM, **sistema** (solo lectura), **contado** (input), diferencia (color), motivo (si diferencia ≠ 0).

- Autosave o botón Guardar → `PATCH /:id/lines` con `{ lines: [{ id, counted_quantity, reason? }] }`.
- Cantidades a 3 decimales. `0` permitido. Negativos no.
- `totals.pending_lines` para el progress (“12 / 40 lotes”).
- **Agregar lote** (`POST /:id/lines`) si encontraron mercancía de un lote que no salió en el snapshot (típico: existencia 0).
- **Enviar a autorización** deshabilitado si `pending_lines > 0` o hay diferencia sin motivo.

### 4. Revisión

Quien tiene `Inventory:Authorize` ve las líneas con diferencia primero.

- Autorizar: `POST /:id/authorize` `{ notes? }` → toast `AUD-xxxxxx aplicada`.
- Rechazar: `POST /:id/reject` `{ reason }` (mín. 3 caracteres) → vuelve a `draft`.
- Tras autorizar, cada línea trae `quantity_before_post`, `quantity_after_post` y `stock_moved_during_count` si el lote se movió entre snapshot y post.

### 5. Detalle de lote

En `audit_history`: folio, sistema vs contado, varíanza, quién contó, quién autorizó, fecha, motivo.

## Respuesta (detalle)

```json
{
  "id": "uuid",
  "folio": "AUD-000001",
  "status": "draft",
  "warehouse": {
    "id": "uuid",
    "name": "Bodega",
    "code": "BDG",
    "billing_branch_id": "uuid",
    "billing_branch_code": "SBA",
    "fiscal_razon_social": "MADERERIA ZONA NORTE",
    "fiscal_rfc": "MZN010101XXX"
  },
  "product_id": null,
  "include_empty_lots": false,
  "created_by_user": { "id": "uuid", "name": "Ana Pérez", "email": "ana@empresa.com" },
  "submitted_by_user": null,
  "authorized_by_user": null,
  "rejected_by_user": null,
  "cancelled_by_user": null,
  "totals": {
    "total_lines": 40,
    "counted_lines": 12,
    "pending_lines": 28,
    "lines_with_variance": 3,
    "total_system_quantity": "1500.000",
    "total_counted_quantity": "420.000",
    "total_variance": "-15.000"
  },
  "lines": [
    {
      "id": "uuid",
      "inventory_batch_id": "uuid",
      "batch_number": "MZN-SBA-BDG-00011",
      "product_name": "Pino 2x4",
      "system_quantity": "10.000",
      "counted_quantity": "8.000",
      "variance": "-2.000",
      "reason": "Merma por humedad",
      "counted_by_user": { "id": "uuid", "name": "Ana Pérez", "email": "ana@empresa.com" },
      "counted_at": "2026-08-31T18:00:00.000Z",
      "stock_moved_during_count": false
    }
  ]
}
```

`product_id` null = todo el almacén. Usuarios nulos si esa acción no ocurrió.

Errores 400: toast con `message` (auditoría abierta, lotes faltantes, motivo requerido, estado inválido).

## Permisos y menú

| Acción UI | Permiso |
|-----------|---------|
| Ver listado / detalle | `Inventory:Read` |
| Crear, contar, enviar, cancelar, agregar lote | `Inventory:Count` |
| Autorizar / rechazar (aplica stock) | `Inventory:Authorize` |

Separados de `Write` y de `Transfer`. Admin los recibe por migración.

Tras asignar: **cerrar sesión / refresh token** (`permissions_version`).

Menú sugerido:

- Inventario → Resumen
- Inventario → Lotes
- Inventario → Transferencias
- Inventario → **Auditorías**

El autorizador puede no tener `Count`. El contador puede no tener `Authorize`. Si una sola persona tiene ambos, el API lo permite (misma persona cuenta y autoriza).

## Notas UI

1. Decimales: 3, igual que el resto de inventario.
2. No uses catálogos de almacenes aparte: `GET /inventory/locations` para filtros y create.
3. Refrescar detalle después de cada PATCH/POST.
4. En revisión, destacar `lines_with_variance`.
5. Documento `posted` / `cancelled`: solo lectura.
6. `initial_quantity` del lote **no cambia**. Solo `available_quantity`.
