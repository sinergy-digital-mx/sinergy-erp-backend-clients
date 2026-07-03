# UI — Notas en órdenes de compra

Guía para Pollux: sección **NOTAS** editable en el detalle de la orden de compra.

Mismo patrón que ventas (`UI_SALES_ORDER_NOTES.md`).

---

## Endpoint

```
PATCH /api/tenant/purchase-orders/:id/notes
Authorization: Bearer {token}
Content-Type: application/json
```

### Body

```json
{
  "notes": "Proveedor confirmó entrega el viernes"
}
```

Para borrar:

```json
{
  "notes": null
}
```

### Respuesta (200)

Orden completa (mismo shape que el objeto `header` de `GET /tenant/purchase-orders/:id`):

```json
{
  "id": "uuid",
  "folio": "OC-000045",
  "notes": "Proveedor confirmó entrega el viernes",
  "general_status": "Recibida",
  "payment_status": "Pendiente",
  "line_items": [ ... ]
}
```

### Reglas backend

| Regla | Detalle |
|-------|---------|
| Estados permitidos | Creada, Recibida |
| Bloqueado | `general_status === 'Cancelada'` → 400 |
| Máximo | 5000 caracteres |

**No usar** `PUT/PATCH /tenant/purchase-orders/:id` solo para notas: ese endpoint reemplaza toda la OC y solo funciona en estado **Creada**.

---

## Leer notas actuales

```
GET /api/tenant/purchase-orders/:id
```

```json
{
  "data": {
    "header": {
      "folio": "OC-000045",
      "notes": "Entrega en muelle 2",
      "general_status": "Recibida"
    },
    "products": [ ... ]
  }
}
```

Mostrar: `data.header.notes ?? ''`.

---

## Función Pollux

```typescript
async function updatePurchaseOrderNotes(
  purchaseOrderId: string,
  notes: string | null,
): Promise<any> {
  return api.patch(`/tenant/purchase-orders/${purchaseOrderId}/notes`, {
    notes: notes?.trim() ? notes.trim() : null,
  });
}
```

### Flujo en componente

```typescript
async saveNotes() {
  const order = await updatePurchaseOrderNotes(this.orderId, this.notesDraft);
  this.notes = order.notes ?? '';
  this.notesDraft = this.notes;
  this.isEditingNotes = false;
}
```

---

## UI — Panel NOTAS

- Modo lectura + ✏️ editar
- Textarea + Guardar / Cancelar
- Deshabilitar si `general_status === 'Cancelada'`

---

## Checklist Pollux

- [ ] Textarea en sección NOTAS del detalle OC
- [ ] `PATCH /tenant/purchase-orders/:id/notes` al guardar
- [ ] Refrescar `header.notes` tras respuesta
- [ ] Deshabilitar si orden cancelada
