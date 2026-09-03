# UI — Cotizaciones

Contrato para Pollux. Una cotización es el mismo documento que una orden de venta (mismas líneas, mismos precios, mismo PDF) **sin facturación y sin ingreso/descuento de lotes**.

Se puede crear desde el **alta manual** (módulo Cotizaciones) o desde **POS Ventas**. Se convierte a OV con `POST /quotations/:id/convert`: ahí sí se retiene inventario.

**Los precios del POS se persisten tal cual (`unit_price` por línea) y al convertir NO se vuelven a consultar listas de precios.**

---

## 1. Qué no tiene este módulo

| OV | Cotización |
|----|------------|
| Facturación / CFDI / autofactura | No. No pintar tabs ni botones de factura |
| Pagos / cobranza / ticket ESC/POS | No |
| Surtido FIFO / lotes / Mesa de Control | No. No hay `fulfill` |
| Estados de almacén (`Surtida`, `En cola`, `En Camino`) | Solo `Creada` / `Convertida` / `Cancelada` |
| `payment_status` | No existe |

---

## 2. Módulo, menú y permisos

Ruta sugerida: `/quotations`  
Menú: **Operación**, junto a Órdenes de Venta. Label: `Cotizaciones`.  
Permiso menú: `quotations:ViewMenu`

Código de módulo RBAC: `quotations` (el guard lee `/tenant/quotations`).

| Acción UI | Permiso |
|-----------|---------|
| Ver listado / detalle / PDF | `quotations:Read` |
| Crear (manual o POS) | `quotations:Create` |
| Editar (solo `Creada`) | `quotations:Update` |
| Cancelar | `quotations:Delete` |
| Convertir a OV | `quotations:Convert` |
| Enviar por correo | `quotations:Send` |

```ts
export const QUOTATION_PERMISSIONS = {
  viewMenu: 'quotations:ViewMenu',
  viewList: 'quotations:Read',
  viewDetail: 'quotations:Read',
  create: 'quotations:Create',
  update: 'quotations:Update',
  delete: 'quotations:Delete',
  convert: 'quotations:Convert',
  send: 'quotations:Send',
} as const;
```

Rutas Angular sugeridas (clon de sales-orders):

| Path | Pantalla |
|------|----------|
| `/quotations` | Listado + dialog detalle |
| `/quotations/create` | Formulario manual (clon del form de OV) |
| `/quotations/:id/edit` | Editar si `can_edit` |

---

## 3. Listado

```
GET /api/tenant/quotations
```

Query:

| Param | Notas |
|-------|-------|
| `search` | Folio o nombre de cliente |
| `general_status` | `Creada`, `Convertida`, `Cancelada` (uno, CSV o repetido) |
| `quotation_type` | `POS` \| `MANUAL` |
| `fiscal_configuration_id` | Razón social |
| `billing_branch_id` | Sucursal |
| `customer_id` | |
| `created_from` / `created_to` | ISO date |
| `page` / `limit` | default 20 |
| `sort_by` | `created_at` \| `folio` \| `total` |
| `sort_order` | `ASC` \| `DESC` |

Respuesta:

```json
{
  "data": [
    {
      "id": "uuid",
      "folio": "COT-000001",
      "quotation_type": "POS",
      "general_status": "Creada",
      "total": "1740.00",
      "razon_social": "Madereria Zona Norte",
      "sucursal": "SUCURSAL BUENOS AIRES",
      "customer": { "id": 14177, "name": "..." },
      "converted_to_sales_order_id": null
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

Columnas: Folio, Fecha, Cliente, Razón social, Sucursal, Tipo (POS/Manual), Estado, Total.  
Si `converted_to_sales_order_id` tiene valor, chip/link a la OV.

**No** pintar columnas de pago, almacén (salvo tipo POS informativo), ni factura.

---

## 4. Alta manual

Clonar el modal/form de OV (`UI_SALES_ORDER_CREATE.md`): razón social → sucursal → cliente → fecha → productos.

Catálogo de productos (mismo shape que OV):

```
GET /api/tenant/quotations/products-summary?fiscal_configuration_id={razonId}&billing_branch_id={sucursalId}&limit=40
```

```
POST /api/tenant/quotations
```

```json
{
  "fiscal_configuration_id": "uuid-razon",
  "billing_branch_id": "uuid-sucursal",
  "customer_id": 14177,
  "expected_delivery_date": "2026-09-15",
  "notes": "opcional",
  "line_items": [
    {
      "product_id": "uuid",
      "product_uom_id": "uuid",
      "quantity": 2,
      "unit_price": 120,
      "iva_percentage": 16,
      "ieps_percentage": 0,
      "product_discount_id": "uuid-opcional"
    }
  ]
}
```

- **No** enviar `warehouse_id` ni `quotation_type` (queda `MANUAL`).
- **No** enviar `requires_selection_assembly`.
- `unit_price` es el precio de la lista/opción que eligió el usuario. El backend lo guarda; no lo recalcula.

Edición: `PUT /api/tenant/quotations/:id` mismo body. Solo si `header.can_edit === true` (`Creada`).

---

## 5. POS Ventas — Cotizar

Mismo carrito que **Registrar venta**. Segundo botón **Cotizar**.

```
POST /api/tenant/quotations
```

Payload = `buildVentasPosOrderPayload()` con un cambio: `quotation_type: "POS"` en lugar de `sales_order_type`.

```json
{
  "fiscal_configuration_id": "uuid",
  "warehouse_id": "uuid",
  "expected_delivery_date": "2026-09-02",
  "quotation_type": "POS",
  "seller_user_id": "uuid-vendedor",
  "notes": "POS Ventas - POS Ventas 1",
  "global_discount_id": "uuid-opcional",
  "line_items": [
    {
      "product_id": "uuid",
      "product_uom_id": "uuid",
      "quantity": 2,
      "unit_price": 150.00,
      "iva_percentage": 16,
      "ieps_percentage": 0,
      "product_discount_id": "uuid-opcional"
    }
  ]
}
```

**Crítico — precio del POS**

1. El catálogo sigue siendo `GET /api/tenant/inventory/pos/summary`.
2. El carrito ya tiene `unit_price` de `suggested_unit_price` o de `pricing_options[]`.
3. Mandar **ese** `unit_price` (y descuentos/IVA/IEPS). No omitirlo. No mandar `price_list_id` esperando que el backend resuelva.
4. El detalle y el PDF muestran ese precio. Convertir a OV reusa las mismas cifras.

Tras cotizar:

- Toast: folio `COT-000012`. *“Cotización guardada. No se retuvo inventario.”*
- **No** mandar a cobranza.
- Vaciar carrito igual que al registrar venta.
- Opcional: abrir PDF (`documents[].path`).

Permiso POS: si el usuario tiene `quotations:Create` (o el módulo quotations habilitado). Si no, ocultar **Cotizar**.

---

## 6. Detalle

```
GET /api/tenant/quotations/:id
```

```json
{
  "data": {
    "header": {
      "id": "uuid",
      "folio": "COT-000001",
      "quotation_type": "POS",
      "general_status": "Creada",
      "total": "1740.00",
      "subtotal": "1500.00",
      "iva_total": "240.00",
      "discount_total": "0.00",
      "global_discount_amount": "0.00",
      "razon_social": "...",
      "sucursal": "...",
      "customer_display_name": "...",
      "seller_user": { "id": "...", "first_name": "..." },
      "can_convert": true,
      "can_cancel": true,
      "can_edit": true,
      "converted_to_sales_order_id": null,
      "discount_summary": {}
    },
    "line_items": [
      {
        "product_id": "...",
        "quantity": 2,
        "unit_price": 150,
        "iva_percentage": 16,
        "line_subtotal": 300,
        "line_discount_amount": 0,
        "uom_name": "PZA",
        "applied_product_discount": null
      }
    ],
    "documents": [
      {
        "id": "...",
        "document_type_name": "DOCUMENTO_ORIGINAL",
        "path": "https://signed-url...",
        "document_language": "es"
      }
    ],
    "discount_summary": {}
  }
}
```

Pintar **Precio unit.** por línea (el del POS). Totales iguales que OV.

Botones:

| Botón | Condición | Acción |
|-------|-----------|--------|
| Ver PDF | siempre si hay `documents` | abrir `path` |
| Regenerar PDF | `quotations:Update` | `POST /:id/regenerate-documento-original` `{ "language": "es" }` |
| Convertir a venta | `header.can_convert` + `quotations:Convert` | ver §7 |
| Cancelar | `header.can_cancel` | `POST /:id/cancel` |
| Editar | `header.can_edit` | navegar a form |
| Ir a OV | `converted_to_sales_order_id` | abrir detalle de esa OV |

Notas: `PATCH /api/tenant/quotations/:id/notes` `{ "notes": "..." }` (no si Cancelada).

---

## 7. Convertir a venta

```
POST /api/tenant/quotations/:id/convert
```

```json
{
  "customer_id": 14177,
  "notes": "opcional"
}
```

`customer_id` opcional: si se omite se usa el de la cotización. En POS-mostrador conviene pedir cliente aquí (o dejar público en general).

201:

```json
{
  "quotation": { "header": { "general_status": "Convertida", "converted_to_sales_order_id": "uuid-ov" } },
  "sales_order": {
    "id": "uuid-ov",
    "folio": "OSV-000088",
    "general_status": "Surtida",
    "payment_status": "Pendiente",
    "sales_order_type": "POS",
    "total": 1740,
    "converted_from_quotation_id": "uuid-cot"
  }
}
```

Comportamiento:

| Origen | OV creada | Inventario | Siguiente paso |
|--------|-----------|------------|----------------|
| POS | `sales_order_type: POS` | Se descuenta FIFO al convertir | Cobranza cobra la OV como cualquier pendiente |
| MANUAL | `MANUAL` | No se descuenta aún | Flujo normal de OV (`Creada` → surtir) |

Los `line_items` de la OV salen de la cotización: mismo `unit_price`, `product_discount_id`, `iva_percentage`, `ieps_percentage`, `global_discount_id`.

Tras convertir: toast con folio OV y botón “Ver orden”. Si era POS, *“Pase a cobranza con este folio.”*

400 si no está `Creada`.

---

## 8. PDF

Mismo layout que OV. Título **COTIZACIÓN** / folio `COT-######`. Sin renglón de pago. Sin documento ENTREGA ni ticket.

Regenerar:

```
POST /api/tenant/quotations/:id/regenerate-documento-original
{ "language": "es", "keep_previous": false }
```

---

## 8.1 Correo

Tab **Correo** en el detalle. Adjunta el PDF y usa la configuración de correo activa (Resend).

```
POST /api/tenant/quotations/:id/send-email
```

```json
{
  "to_email": "cliente@correo.com",
  "cc": ["copia@correo.com"],
  "subject": "Cotización COT-000001",
  "message": "Adjuntamos la cotización."
}
```

Si omites `to_email`, se usa el correo del cliente. 400 si está `Cancelada` o no hay destino.

El detalle incluye `emails[]` (historial) y `header.customer_email`, `header.can_send`.

---

## 9. OV convertida

La OV queda con `converted_from_quotation_id`. En el detalle de OV, si viene ese campo, mostrar chip “Desde cotización” y link a `/quotations` detalle.

---

## 10. Checklist Pollux

- [ ] Menú Cotizaciones + rutas + `QUOTATION_PERMISSIONS`
- [ ] Listado / detalle / form clonados de OV **sin** pago, factura, lotes, ticket
- [ ] POS Ventas: botón **Cotizar** con el mismo payload de precios
- [ ] Detalle muestra `unit_price` del POS (no el de lista actual)
- [ ] Convertir a venta + toast con folio OV
- [ ] PDF vía `documents[].path`
- [ ] No llamar endpoints de invoices / payments / fulfill / ticket sobre cotizaciones
