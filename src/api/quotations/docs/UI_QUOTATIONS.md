# UI — Cotizaciones

## 2026-11-25
En POS, Folios pide `GET /tenant/pos/folio-quotations`: todas las cotizaciones de la sucursal y la razón social, de cualquier vendedor. El listado del módulo sigue limitado a las del usuario si no tiene ver todas. La búsqueda también coincide con `company_name`.

## 2026-11-10
Al abrir el listado, **Razón social** y **Sucursal** quedan en la sucursal principal del usuario. Limpiar filtros muestra todas.

## 2026-10-19
Al crear una cotización, si la unidad que viene del inventario (por ejemplo Pieza) ya no está ligada al producto, el alta la vuelve a asociar y la cotización se guarda. Antes respondía `UOM no encontrado` y no dejaba crear el documento.

En el detalle, el clic en la tarjeta **Cliente** abre `/customers/detail/{customer_id}` en otra pestaña.

Contrato para Pollux. Una cotización es el mismo documento que una orden de venta (mismas líneas, mismos precios, mismo PDF) **sin facturación y sin ingreso/descuento de lotes**.

Se puede crear desde el **alta manual** (módulo Cotizaciones) o desde **POS Ventas**. Se convierte a OV con `POST /quotations/:id/convert`: ahí sí se retiene inventario.

**Los precios del POS se persisten tal cual (`unit_price` por línea) y al convertir NO se vuelven a consultar listas de precios.**

---

## 1. Qué no tiene este módulo

| OV | Cotización |
|----|------------|
| Facturación / CFDI / autofactura | No, salvo **factura de anticipo** si la razón social la tiene activada. Ver `UI_QUOTATION_ADVANCE_AND_COLLECTION.md` |
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
| Ver **todas** las cotizaciones (no solo las propias) | `quotations:ViewAll` |
| Ver cotizaciones de **todas las sucursales** | `quotations:ViewAllBranches` |
| Crear (manual o POS) | `quotations:Create` |
| Editar (solo `Creada`) | `quotations:Update` |
| Cancelar | `quotations:Delete` |
| Convertir a OV | `quotations:Convert` |
| Enviar por correo | `quotations:Send` |

`ViewAll` y `ViewAllBranches` se asignan en Roles (no dependen del nombre del rol). El rol Admin los recibe por seed/migración; Gerente / dirección / etc. hay que marcarlos a mano. Tras asignarlos, recargar sesión (sube `permissions_version`).

```ts
export const QUOTATION_PERMISSIONS = {
  viewMenu: 'quotations:ViewMenu',
  viewList: 'quotations:Read',
  viewDetail: 'quotations:Read',
  viewAll: 'quotations:ViewAll',
  viewAllBranches: 'quotations:ViewAllBranches',
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

Alcance (servidor, no solo UI). **No** se decide por rol Admin:

| Permiso | Qué ve |
|---------|--------|
| `quotations:Read` sin `ViewAll` | Solo cotizaciones donde es **vendedor POS** (`seller_user_id`) o **comisionado** (`assigned_seller_user_id`) |
| `quotations:ViewAll` | Todas las de **sus sucursales** (si no tiene `ViewAllBranches`) o de todas. Puede filtrar por vendedor |
| `quotations:Read` sin `ViewAllBranches` | Solo cotizaciones de **sucursales asignadas** (`user_billing_branches`) |
| `quotations:ViewAllBranches` | Todas las sucursales. Puede filtrar por `billing_branch_id` |

Si no tiene `ViewAll` y manda `assigned_seller_user_id` de otra persona: **403**. Si no tiene `ViewAllBranches` y manda `billing_branch_id` de una sucursal no asignada: **403**. Detalle / editar / convertir / correo de una cotización ajena (vendedor o sucursal): **404**. Sin sucursales asignadas y sin `ViewAllBranches`: listado vacío.

Query:

| Param | Notas |
|-------|-------|
| `search` | Folio o nombre de cliente |
| `general_status` | `Creada`, `Convertida`, `Cancelada` (uno, CSV o repetido) |
| `quotation_type` | `POS` \| `MANUAL` |
| `fiscal_configuration_id` | Razón social |
| `billing_branch_id` | Sucursal. Sin `ViewAllBranches` debe ser una asignada |
| `customer_id` | |
| `assigned_seller_user_id` | Solo con `ViewAll`. Coincide con vendedor POS **o** comisionado |
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
      "expires_at": "2026-09-16",
      "quotation_expiration_days": 15,
      "razon_social": "Madereria Zona Norte",
      "sucursal": "SUCURSAL BUENOS AIRES",
      "customer": { "id": 14177, "name": "..." },
      "seller_user": { "id": "...", "first_name": "Ana", "pos_user_code": 12 },
      "assigned_seller_user": { "id": "...", "first_name": "Luis", "pos_user_code": 7 },
      "converted_to_sales_order_id": null
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "can_view_all": true,
  "can_view_all_branches": true
}
```

`expires_at` sale de `created_at + quotation_expiration_days` de la razón social. `null` si esa razón no tiene días. Un cron diario (1:00) cancela las `Creada` cuando `expires_at <= hoy`. El campo se configura en Configuración Fiscal. Ver `src/api/billing/docs/UI_QUOTATION_EXPIRATION.md`.

En el listado pinta columna **Vence**. En detalle, en FECHAS: **Vence** (o “Sin vigencia”).

Catálogo para el combo de vendedor (usuarios con código POS). Requiere `ViewAll`:

```
GET /api/tenant/quotations/sellers
```

```json
{
  "can_view_all": true,
  "sellers": [
    { "id": "uuid", "first_name": "Luis", "last_name": "Pérez", "pos_user_code": 7 }
  ]
}
```

Sin `ViewAll`: `{ "can_view_all": false, "sellers": [] }`. No pintar el combo.

UI:

- Sin `ViewAll`: subtítulo *Tus cotizaciones como vendedor o comisionado*.
- Sin `ViewAllBranches`: subtítulo *Solo sucursales asignadas*. Combo sucursal limitado a las asignadas.
- Con `ViewAll`: en **Más filtros**, combo **Vendedor**. Label `Nombre (código POS)`.
- Columnas: Folio, Cliente, **Vendedor** (comisionado; si no hay, vendedor POS), Sucursal, Estado, Total, Tipo, Fecha.
- Si `converted_to_sales_order_id` tiene valor, chip/link a la OV.

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

En Pollux: botón **Editar cotización** en el detalle. Abre el mismo modal de alta con renglones, cantidades, precios, IVA/IEPS, descuentos, cliente, fecha de entrega y observaciones. Al guardar se regenera `DOCUMENTO_ORIGINAL`.

POS: razón social y sucursal quedan fijas. El PUT reenvía `warehouse_id` y `seller_user_id` originales. No se puede editar `Convertida` ni `Cancelada`.

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

Misma visibilidad que el listado: si no tienes `ViewAll` / `ViewAllBranches` y la cotización no es tuya o no es de tus sucursales, **404**.

```json
{
  "data": {
    "header": {
      "id": "uuid",
      "folio": "COT-000001",
      "quotation_type": "POS",
      "general_status": "Creada",
      "total": "1740.00",
      "expires_at": "2026-09-16",
      "quotation_expiration_days": 15,
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
      "can_edit_lines": true,
      "can_edit_notes": true,
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

Pintar **Precio** por línea (el del POS), **Importe** s/IVA · c/IVA, columnas IVA/IEPS y cantidad. Totales iguales que OV.

La edición de líneas es **en este mismo diálogo**, igual que la OV. No abrir el modal de alta para cambiar cantidad, precio o IVA.

`can_edit_lines` (mismo criterio que `can_edit`: solo `Creada` + `quotations:Update`).

| Acción | UI | API |
|--------|----|-----|
| Editar línea | lápiz | `PATCH /quotations/:id/line-items/:lineItemId` `{ quantity, unit_price, iva_percentage, ieps_percentage }` |
| Eliminar línea | basura | `DELETE /quotations/:id/line-items/:lineItemId` (debe quedar ≥ 1 producto) |
| Agregar producto | **Agregar producto** | `POST /quotations/:id/line-items` + buscador `GET /quotations/products-summary` |

Respuesta 200/201 = mismo shape que `GET /quotations/:id`. Reemplazar el detalle. Regenera el PDF.

Si `can_edit_lines === false`: oculta lápiz, basura y “Agregar producto”.

Botones laterales:

| Botón | Condición | Acción |
|-------|-----------|--------|
| Ver PDF | siempre si hay `documents` | abrir `path` |
| Regenerar PDF | `quotations:Update` | `POST /:id/regenerate-documento-original` `{ "language": "es" }` |
| Convertir a venta | `header.can_convert` + `quotations:Convert` | ver §7 |
| Cancelar | `header.can_cancel` | `POST /:id/cancel` |
| Ir a OV | `converted_to_sales_order_id` | abrir detalle de esa OV |

Notas / observaciones: `PATCH /api/tenant/quotations/:id/notes` `{ "notes": "..." }` si `header.can_edit_notes` (no Cancelada). El texto sale en el PDF como **Observaciones**. Al guardar se regenera `DOCUMENTO_ORIGINAL`.

Alta: campo **Observaciones** en el formulario (`notes`). POS: se puede completar después en el detalle.

---

## 7. Convertir a venta

```
POST /api/tenant/quotations/:id/convert
```

```json
{
  "customer_id": 14177,
  "notes": "opcional",
  "send_to_pos_caja": true
}
```

`customer_id` opcional: si se omite se usa el de la cotización. En POS-mostrador conviene pedir cliente aquí (o dejar público en general).

Las cotizaciones **sí tienen sucursal** (`billing_branch_id` / `sucursal`). Al convertir, preguntar:

> ¿Generar el cobro en el corte abierto de {sucursal}?

Antes del diálogo: `GET /quotations/:id/collection-preview`. Si `open_shift` es null, no se ofrece el sí.

| Respuesta | Body | OV |
|-----------|------|----|
| Sí, generar cobro | `send_to_pos_caja: true` | `POS` en el **corte abierto** de esa sucursal. Si no hay corte: **400**, la cotización sigue `Creada` |
| No, crear sin cobro | `send_to_pos_caja: false` | `MANUAL`. No entra a caja ni genera deuda. Después: `POST /sales-orders/:id/send-to-collection` |
| (omitido, clientes viejos) | — | Igual que antes: POS si la cotización era POS. Sin corte abierto responde **400** |

Si manda a caja y la sucursal no tiene almacén activo → **400**. Si no hay sucursal → **400**.

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
    "converted_from_quotation_id": "uuid-cot",
    "sent_to_pos_caja": true,
    "pos_daily_shift_id": "uuid-corte-o-null"
  }
}
```

Comportamiento:

| `send_to_pos_caja` | OV | Inventario | Siguiente paso |
|--------------------|----|------------|----------------|
| `true` | `POS` en el corte abierto | FIFO al convertir | Caja de esa sucursal cobra el folio. Sin corte: **400** |
| `false` | `MANUAL`, sin deuda | FIFO al convertir (aparta lotes, la orden queda `Creada`) | `POST /sales-orders/:id/send-to-collection` cuando haya corte |

Los `line_items` de la OV salen de la cotización: mismo `unit_price`, `discount_percentage`, `discount_unit`, `product_discount_id`, `iva_percentage`, `ieps_percentage`, `global_discount_id` y `global_discount_amount`.

**No se vuelven a consultar listas de precios ni se revalidan descuentos vigentes.** Si el catálogo cambió después de cotizar, la OV conserva el unitario y los descuentos pactados.

Tras convertir: toast con folio OV. Si fue a caja: *“En caja de {sucursal} para cobrar.”* Si no: *“Sin cobro en caja. Puedes enviarla después desde la orden.”*

400 si no está `Creada`. 400 si `send_to_pos_caja: true` y no hay corte abierto.

---

## 8. PDF

Mismo layout que OV. Título **COTIZACIÓN** / folio `COT-######`. Sin renglón de pago. Sin documento ENTREGA ni ticket. Bloque **Observaciones** (`notes`) junto a los totales.

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
- [ ] Convertir a venta: preguntar si enviar a caja POS de la sucursal; toast con folio OV
- [ ] Convertir conserva `unit_price` y descuentos pactados aunque el catálogo haya cambiado
- [ ] Observaciones en alta, detalle y PDF (`notes`); PATCH `/:id/notes` regenera el documento
- [ ] Editar líneas en el detalle (`PATCH/POST/DELETE /quotations/:id/line-items`); no abrir el modal de alta
- [ ] Listado prefiltrado por vendedor/comisionado y sucursales asignadas; `ViewAll` / `ViewAllBranches` ven todas
- [ ] No llamar endpoints de invoices / payments / fulfill / ticket sobre cotizaciones
