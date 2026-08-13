# UI — Cancelar orden de venta

Guía para Pollux. Botón de cancelación en el **menú lateral izquierdo del detalle** de la OV.

---

## 1. Dónde va

Detalle de OV (drawer `#OSV-000020`). En el **rail / menú de acciones de la izquierda** (junto a imprimir, documentos, etc.), al final:

**Cancelar orden**

Estilo: botón **rojizo moderno** (danger). Ejemplo: fondo `red-600`, hover `red-700`, texto blanco, `rounded-lg`, ícono de X o papelera a la izquierda. No usar rojo chillón ni outline débil.

Si `general_status === 'Cancelada'` → **ocultar** el botón.

---

## 2. Cuándo habilitar

Viene en el detalle:

```
GET /api/tenant/sales-orders/:id
→ data.header.can_cancel
→ data.header.cancel_blocked_reason
```

| Campo | Tipo | Uso |
|-------|------|-----|
| `can_cancel` | boolean | `true` → botón activo |
| `cancel_blocked_reason` | string \| null | Tooltip / texto si está deshabilitado |

Si `can_cancel === false` y la orden no está cancelada: mostrar el botón **deshabilitado** con tooltip = `cancel_blocked_reason` (típicamente factura CFDI vigente).

No hace falta consultar el tab Facturación para decidir. El header ya trae el flag.

---

## 3. Diálogo de confirmación

Click en el botón **nunca** cancela de inmediato. Abrir modal:

**Título:** Cancelar orden de venta

**Cuerpo:**

> Se cancelará la orden **{folio}**. Si hay lotes asignados, se liberan al inventario. Esta acción no se puede deshacer.

**Botones:**

| Botón | Estilo | Acción |
|-------|--------|--------|
| Volver | secundario / ghost | Cierra el modal |
| Cancelar orden | rojo, mismo look que el botón del rail | Llama al API |

Mientras corre el request: spinner en el botón rojo, no cerrar el modal.

---

## 4. Endpoint

```http
POST /api/tenant/sales-orders/{id}/cancel
```

Sin body.

Alias equivalente (no usar en UI nueva): `DELETE /api/tenant/sales-orders/{id}`.

### Respuesta (200)

Orden con `general_status: "Cancelada"`. Refrescar el detalle (`GET /:id`).

### Errores

| Status | Cuándo | UI |
|--------|--------|----|
| 400 | Ya cancelada | Toast con el mensaje |
| 400 | Factura CFDI vigente | Toast + no cambiar estado. Ejemplo: `No se puede cancelar la orden: tiene una factura CFDI vigente (UUID …). Cancela la factura primero.` |
| 404 | OV no existe | Toast |

Si el toast habla de CFDI vigente: link o hint al tab **Facturación** para cancelar la factura.

---

## 5. Qué hace el backend

1. Bloquea si `general_status === 'Cancelada'`.
2. Bloquea si hay factura CFDI **vigente** ligada a la OV:
   - `sat_status === 'Vigente'`, o
   - timbrada (`stamped` / `cancel_pending` / `cancel_error`) y SAT **no** ha confirmado `Cancelado`.
3. Si hay lotes en `batch_allocations` (surtido, corroboración, etc.), los **libera** (cantidad de vuelta al lote) y borra las asignaciones.
4. Pasa la OV a `Cancelada`.

Facturas `pending_stamp`, `stamp_error` o ya `cancelled` / SAT `Cancelado` **no** bloquean.

---

## 6. Después de cancelar

- Badge de estado → **Cancelada**.
- Ocultar el botón Cancelar.
- Deshabilitar editar notas / vendedor / facturar / surtir (ya existente).
- Toast éxito: `Orden {folio} cancelada`.

---

## 7. Checklist Pollux

- [ ] Botón rojo moderno **Cancelar orden** en el menú izquierdo del detalle
- [ ] Ocultar si ya está `Cancelada`
- [ ] Deshabilitar + tooltip si `can_cancel === false`
- [ ] Dialog de confirmación (Volver / Cancelar orden)
- [ ] `POST /api/tenant/sales-orders/:id/cancel`
- [ ] Refrescar detalle al 200
- [ ] Toast 400 de CFDI vigente con hint a Facturación
