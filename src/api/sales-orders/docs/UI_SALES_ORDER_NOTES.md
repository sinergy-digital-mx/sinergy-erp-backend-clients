# UI — Notas en órdenes de venta

Guía para Pollux: sección **NOTAS** editable en el detalle de la orden (`#OSV-000010`, etc.).

---

## Problema actual

- `PUT /tenant/sales-orders/:id` solo funciona si `general_status === 'Creada'`.
- Las ventas POS quedan en `Surtida` / `Pagado` → no se pueden editar notas con el PUT completo.
- Usar el endpoint dedicado de notas.

---

## Endpoint

```
PATCH /api/tenant/sales-orders/:id/notes
Authorization: Bearer {token}
Content-Type: application/json
```

### Body

```json
{
  "notes": "Cliente pidió factura. Entregar en mostrador."
}
```

Para borrar notas:

```json
{
  "notes": null
}
```

o

```json
{
  "notes": ""
}
```

### Respuesta (200)

Devuelve la orden completa (mismo shape que `GET /tenant/sales-orders/:id` sin wrapper `data`):

```json
{
  "id": "uuid",
  "folio": "OSV-000010",
  "notes": "Cliente pidió factura. Entregar en mostrador.",
  "general_status": "Surtida",
  "payment_status": "Pagado",
  "line_items": [ ... ]
}
```

### Reglas backend

| Regla | Detalle |
|-------|---------|
| Estados permitidos | Creada, Surtida, En cola, Pagado/Pendiente |
| Bloqueado | `general_status === 'Cancelada'` → 400 |
| Máximo | 5000 caracteres |
| Trim | Espacios al inicio/fin se recortan |

---

## Dónde leer las notas actuales

```
GET /api/tenant/sales-orders/:id
```

```json
{
  "data": {
    "header": {
      "folio": "OSV-000010",
      "notes": "POS Ventas - cventas1",
      "general_status": "Surtida",
      "payment_status": "Pagado"
    },
    "line_items": [ ... ]
  }
}
```

Mostrar en panel lateral: `data.header.notes` o `data.header.notes ?? ''`.

---

## UI — Panel NOTAS (detalle orden)

Estado **lectura** (default):

```
┌─────────────────────────────┐
│ NOTAS                  ✏️   │
├─────────────────────────────┤
│ POS Ventas - cventas1       │
│                             │
└─────────────────────────────┘
```

Estado **edición** (al pulsar ✏️ o clic en el área):

```
┌─────────────────────────────┐
│ NOTAS                       │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ POS Ventas - cventas1   │ │
│ │                         │ │
│ └─────────────────────────┘ │
│ [ Cancelar ]  [ Guardar ]   │
└─────────────────────────────┘
```

- Deshabilitar edición si `general_status === 'Cancelada'`.
- Mostrar toast de éxito/error tras guardar.

---

## Función Pollux

```typescript
async function updateSalesOrderNotes(
  salesOrderId: string,
  notes: string | null,
): Promise<void> {
  const body = {
    notes: notes?.trim() ? notes.trim() : null,
  };

  const updated = await api.patch(
    `/tenant/sales-orders/${salesOrderId}/notes`,
    body,
  );

  // Actualizar estado local del detalle
  return updated;
}
```

### Flujo completo en componente

```typescript
// Al cargar detalle
this.notes = detail.data.header.notes ?? '';
this.notesDraft = this.notes;
this.isEditingNotes = false;

// Guardar
async saveNotes() {
  this.savingNotes = true;
  try {
    const order = await updateSalesOrderNotes(this.orderId, this.notesDraft);
    this.notes = order.notes ?? '';
    this.notesDraft = this.notes;
    this.isEditingNotes = false;
    toast.success('Notas actualizadas');
  } catch (err) {
    toast.error(err?.response?.data?.message ?? 'No se pudieron guardar las notas');
  } finally {
    this.savingNotes = false;
  }
}

cancelNotesEdit() {
  this.notesDraft = this.notes;
  this.isEditingNotes = false;
}
```

---

## Errores

| HTTP | Cuándo | Mensaje UI |
|------|--------|------------|
| 400 | Orden cancelada | "No se pueden editar notas de una orden cancelada" |
| 404 | ID inválido | "Orden no encontrada" |

---

## Checklist Pollux

- [ ] Textarea o input multilínea en sección NOTAS del detalle
- [ ] Botón editar / guardar / cancelar
- [ ] `PATCH /tenant/sales-orders/:id/notes` al guardar
- [ ] Refrescar `header.notes` en pantalla tras respuesta
- [ ] Deshabilitar si `general_status === 'Cancelada'`
