# UI — Pedimento en órdenes de compra (proveedor internacional)

Contrato para Pollux. El tipo de proveedor **ya existe** en el catálogo (`vendor_type`: `NATIONAL` | `INTERNATIONAL`). La OC no duplica ese flag: lo deriva del proveedor.

---

## Qué mostrar

| Dato | Origen | Dónde |
|------|--------|-------|
| Compra internacional | `is_international_vendor` | Badge en card **PROVEEDOR** |
| Pedimento | `pedimento_number` | **Arriba de FECHAS** (sidebar detalle) |

El campo pedimento **solo se muestra** si `is_international_vendor === true`. En proveedor nacional no hay pedimento.

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
      "vendor_id": "uuid",
      "vendor": {
        "id": "uuid",
        "name": "Proveedor Prueba",
        "vendor_type": "INTERNATIONAL"
      },
      "is_international_vendor": true,
      "pedimento_number": "162430010001234",
      "expected_delivery_date": "2026-08-11",
      "general_status": "Creada"
    }
  }
}
```

Bindings:

```ts
const isInternational = header.is_international_vendor === true
  || header.vendor?.vendor_type === 'INTERNATIONAL';

const pedimento = header.pedimento_number ?? '';
```

En listado (`GET /api/tenant/purchase-orders`) vienen los mismos campos en cada fila.

---

## Sidebar detalle (layout)

Orden de cards, **arriba de FECHAS**:

```
PROVEEDOR          Proveedor Prueba
                   [Internacional]     ← solo si is_international_vendor

RAZÓN SOCIAL       ...
SUCURSAL           ...
ALMACÉN            Bodega

PEDIMENTO          16 24 3001 0001234  ← ✏️ editar (solo internacional)
                   Sin pedimento       ← vacío + ✏️

FECHAS
  Fecha esperada   11 de agosto
```

- Título: `PEDIMENTO`
- Valor: `pedimento_number` o `Sin pedimento` / `—`
- Icono: documento / aduana
- Lápiz para editar (mismo patrón que NOTAS)
- **No mostrar** la sección si el proveedor es nacional

Badge en PROVEEDOR: texto `Internacional`, color distinto al nacional (p. ej. azul). No hace falta switch: el tipo vive en el proveedor.

---

## Guardar pedimento (detalle)

No usar `PUT/PATCH /tenant/purchase-orders/:id` solo para pedimento: ese endpoint reemplaza toda la OC y solo funciona en **Creada**.

```
PATCH /api/tenant/purchase-orders/:id/pedimento
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "pedimento_number": "162430010001234"
}
```

Para borrar:

```json
{
  "pedimento_number": null
}
```

### Respuesta (200)

Orden completa (mismo shape que `GET /tenant/purchase-orders/:id` → `data.header`).

### Errores

| Caso | HTTP | Mensaje |
|------|------|---------|
| Orden cancelada | 400 | No se puede editar el pedimento de una orden cancelada |
| Proveedor nacional | 400 | El número de pedimento solo aplica a compras de proveedor internacional |
| Más de 30 caracteres | 400 | validación |

Estados permitidos: **Creada**, **Recibida**.

---

## Crear / editar encabezado

Si el proveedor seleccionado es internacional, mostrar input **Pedimento** (opcional) en el modal.

```
POST /api/tenant/purchase-orders
PUT  /api/tenant/purchase-orders/:id
```

Campo extra en el body:

```json
{
  "vendor_id": "uuid",
  "pedimento_number": "162430010001234"
}
```

- Proveedor internacional + sin pedimento → OK (`null`)
- Proveedor nacional + `pedimento_number` con valor → **400**
- Al cambiar a proveedor nacional, el backend limpia el pedimento

Catálogo de proveedores ya trae `vendor_type`. En el combo:

```ts
vendor.vendor_type === 'INTERNATIONAL'
```

Al cambiar el proveedor en el modal: si pasa a nacional, ocultar y vaciar el input de pedimento.

---

## Función Pollux

```typescript
async function updatePurchaseOrderPedimento(
  purchaseOrderId: string,
  pedimentoNumber: string | null,
): Promise<any> {
  return api.patch(`/tenant/purchase-orders/${purchaseOrderId}/pedimento`, {
    pedimento_number: pedimentoNumber?.trim() ? pedimentoNumber.trim() : null,
  });
}
```

```typescript
async savePedimento() {
  const order = await updatePurchaseOrderPedimento(
    this.orderId,
    this.pedimentoDraft,
  );
  this.pedimento = order.pedimento_number ?? '';
  this.pedimentoDraft = this.pedimento;
  this.isEditingPedimento = false;
}
```

Input: texto corto, placeholder `Número de pedimento`, máximo 30 caracteres. No validar formato SAT en UI (el backend guarda el texto recortado).

---

## Checklist Pollux

- [ ] Badge **Internacional** en card PROVEEDOR si `is_international_vendor`
- [ ] Sección **PEDIMENTO** en sidebar **arriba de FECHAS** (solo internacional)
- [ ] `PATCH /tenant/purchase-orders/:id/pedimento` al guardar
- [ ] Ocultar pedimento si proveedor nacional
- [ ] Modal crear/editar: input pedimento cuando `vendor_type === 'INTERNATIONAL'`
- [ ] Deshabilitar edición si `general_status === 'Cancelada'`

---

## Inventario (lotes)

No se copia el pedimento al lote. El detalle de lote lo lee de la OC:

`GET /api/tenant/inventory/batches/:id` → `pedimento_number`

Ver `src/api/inventory/docs/UI_INVENTORY_BATCH_PEDIMENTO.md`.
