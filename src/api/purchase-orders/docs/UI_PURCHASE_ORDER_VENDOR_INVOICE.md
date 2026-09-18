# UI — Factura de proveedor en órdenes de compra

Contrato para Pollux. Mismo patrón que pedimento (`UI_PURCHASE_ORDER_PEDIMENTO.md`), pero **aplica a cualquier proveedor** (nacional o internacional).

---

## Qué mostrar

| Dato | Origen | Dónde |
|------|--------|-------|
| No. Factura de Proveedor | `vendor_invoice_number` | **Debajo de PEDIMENTO**, arriba de FECHAS |

Siempre visible. Si no hay pedimento (proveedor nacional), esta card queda arriba de FECHAS.

---

## Lectura

```
GET /api/tenant/purchase-orders/:id
```

```json
{
  "data": {
    "header": {
      "folio": "ODC-000015",
      "vendor_invoice_number": "A-12345",
      "pedimento_number": "162430010001234",
      "general_status": "Creada"
    }
  }
}
```

Bindings:

```ts
const vendorInvoice = header.vendor_invoice_number ?? '';
```

En listado (`GET /api/tenant/purchase-orders`) viene el mismo campo en cada fila.

---

## Sidebar detalle (layout)

```
PEDIMENTO                 16 24 3001 0001234  ← solo internacional
NO. FACTURA DE PROVEEDOR  A-12345             ← ✏️ editar
                          Sin factura de proveedor  ← vacío + ✏️

FECHAS
```

- Título: `NO. FACTURA DE PROVEEDOR`
- Valor: `vendor_invoice_number` o `Sin factura de proveedor`
- Lápiz para editar (idéntico a PEDIMENTO)
- Visible en proveedor nacional e internacional

---

## Guardar factura (detalle)

No usar `PUT/PATCH /tenant/purchase-orders/:id` solo para este campo.

```
PATCH /api/tenant/purchase-orders/:id/vendor-invoice
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "vendor_invoice_number": "A-12345"
}
```

Para borrar:

```json
{
  "vendor_invoice_number": null
}
```

### Respuesta (200)

Orden completa (mismo shape que `GET /tenant/purchase-orders/:id`).

### Errores

| Caso | HTTP | Mensaje |
|------|------|---------|
| Orden cancelada | 400 | No se puede editar la factura de proveedor de una orden cancelada |
| Más de 60 caracteres | 400 | validación |

Estados permitidos: **Creada**, **Recibida**.

---

## Crear / editar encabezado

Input **No. Factura de Proveedor** (opcional) en el modal, debajo de Pedimento.

```
POST /api/tenant/purchase-orders
PUT  /api/tenant/purchase-orders/:id
```

```json
{
  "vendor_id": "uuid",
  "vendor_invoice_number": "A-12345"
}
```

Input: texto corto, placeholder `No. factura de proveedor`, máximo 60 caracteres.

---

## Función Pollux

```typescript
async function updatePurchaseOrderVendorInvoice(
  purchaseOrderId: string,
  vendorInvoiceNumber: string | null,
): Promise<any> {
  return api.patch(`/tenant/purchase-orders/${purchaseOrderId}/vendor-invoice`, {
    vendor_invoice_number: vendorInvoiceNumber?.trim()
      ? vendorInvoiceNumber.trim()
      : null,
  });
}
```

---

## Checklist Pollux

- [ ] Sección **NO. FACTURA DE PROVEEDOR** debajo de PEDIMENTO (siempre)
- [ ] `PATCH /tenant/purchase-orders/:id/vendor-invoice` al guardar
- [ ] Modal crear/editar: input factura de proveedor
- [ ] Deshabilitar edición si `general_status === 'Cancelada'`

## Inventario (lotes)

No se copia al lote. El detalle de lote lo lee de la OC:

`GET /api/tenant/inventory/batches/:id` → `vendor_invoice_number`
