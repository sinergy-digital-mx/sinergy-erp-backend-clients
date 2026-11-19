# UI — Facturas de proveedor en órdenes de compra

## Cambios

- 2026-11-03: El documento original imprime `Factura: …` (o `Sin factura de proveedor`). Guardar las facturas regenera ese PDF.
- 2026-11-02: El ejemplo de `pedimento_number` usa la máscara de 15 dígitos.

Contrato para Pollux. Mismo patrón que pedimento (`UI_PURCHASE_ORDER_PEDIMENTO.md`), pero **aplica a cualquier proveedor** (nacional o internacional). Una OC puede tener **varias** facturas.

---

## Qué mostrar

| Dato | Origen | Dónde |
|------|--------|-------|
| Facturas de proveedor | `vendor_invoice_numbers` | **Debajo de PEDIMENTO**, arriba de FECHAS |

Siempre visible. Si no hay pedimento (proveedor nacional), esta card queda arriba de FECHAS.

`vendor_invoice_number` sigue existiendo: es **la primera** factura (búsqueda / compatibilidad). No lo uses para pintar el detalle.

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
      "vendor_invoice_numbers": ["A-12345", "B-67890"],
      "pedimento_number": "26  47  3807  6000123",
      "general_status": "Creada"
    }
  }
}
```

Bindings:

```ts
const invoices = header.vendor_invoice_numbers ?? [];
```

En listado (`GET /api/tenant/purchase-orders`) vienen los mismos campos en cada fila. El `search` encuentra cualquiera de las facturas.

---

## Sidebar detalle (layout)

```
PEDIMENTO                 16 24 3001 0001234  ← solo internacional
NO. FACTURA DE PROVEEDOR  A-12345             ← ✏️ editar
                          B-67890
                          Sin factura de proveedor  ← vacío + ✏️

FECHAS
```

- Título: `NO. FACTURA DE PROVEEDOR`
- Una línea por factura. Si el arreglo está vacío: `Sin factura de proveedor`
- Lápiz para editar (idéntico a PEDIMENTO)
- Visible en proveedor nacional e internacional

---

## Guardar facturas (detalle)

No usar `PUT/PATCH /tenant/purchase-orders/:id` solo para este campo.

```
PATCH /api/tenant/purchase-orders/:id/vendor-invoice
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "vendor_invoice_numbers": ["A-12345", "B-67890"]
}
```

Para borrar todas:

```json
{
  "vendor_invoice_numbers": []
}
```

El campo suelto `vendor_invoice_number` sigue aceptándose (una sola factura o `null` para borrar). Si mandas el arreglo, el arreglo gana.

### Respuesta (200)

Orden completa (mismo shape que `GET /tenant/purchase-orders/:id`).

### Errores

| Caso | HTTP | Mensaje |
|------|------|---------|
| Orden cancelada | 400 | No se puede editar la factura de proveedor de una orden cancelada |
| Más de 60 caracteres | 400 | Cada factura de proveedor no puede exceder 60 caracteres |
| Más de 20 facturas | 400 | No se pueden registrar más de 20 facturas de proveedor |

Estados permitidos: **Creada**, **Recibida**.

---

## Crear / editar encabezado

Lista de inputs **No. Factura de Proveedor** (opcional) en el modal, debajo de Pedimento. Botón para agregar otra.

```
POST /api/tenant/purchase-orders
PUT  /api/tenant/purchase-orders/:id
```

```json
{
  "vendor_id": "uuid",
  "vendor_invoice_numbers": ["A-12345", "B-67890"]
}
```

Cada input: texto corto, placeholder `No. factura de proveedor`, máximo 60 caracteres. Máximo 20 facturas. Duplicados se ignoran.

---

## Función Pollux

```typescript
async function updatePurchaseOrderVendorInvoices(
  purchaseOrderId: string,
  vendorInvoiceNumbers: string[],
): Promise<any> {
  return api.patch(`/tenant/purchase-orders/${purchaseOrderId}/vendor-invoice`, {
    vendor_invoice_numbers: vendorInvoiceNumbers
      .map((value) => value.trim())
      .filter(Boolean),
  });
}
```

---

## Checklist Pollux

- [ ] Sección **NO. FACTURA DE PROVEEDOR** debajo de PEDIMENTO (siempre)
- [ ] Una línea por factura; más de una visible
- [ ] `PATCH /tenant/purchase-orders/:id/vendor-invoice` al guardar (`vendor_invoice_numbers`)
- [ ] Modal crear/editar: varios inputs + agregar
- [ ] Deshabilitar edición si `general_status === 'Cancelada'`

## Inventario (lotes)

No se copia al lote. El detalle de lote lo lee de la OC:

`GET /api/tenant/inventory/batches/:id` → `vendor_invoice_numbers` y `vendor_invoice_number` (primera)
