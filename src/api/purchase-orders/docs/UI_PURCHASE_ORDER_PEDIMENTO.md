# UI — Pedimento en órdenes de compra (proveedor internacional)

Contrato para Pollux. El tipo de proveedor **ya existe** en el catálogo (`vendor_type`: `NATIONAL` | `INTERNATIONAL`). La OC no duplica ese flag: lo deriva del proveedor.

## Cambios

- 2026-11-02: El pedimento solo se guarda si cumple el Anexo 22 (15 dígitos). Se almacena y se muestra con la máscara `26  47  3807  6000123`. Vacío sigue permitido. Si no cumple, **400**.

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
      "pedimento_number": "26  47  3807  6000123",
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

PEDIMENTO          26  47  3807  6000123  ← ✏️ editar (solo internacional)
                   Sin pedimento       ← vacío + ✏️
NO. FACTURA DE PROVEEDOR  A-12345      ← ver UI_PURCHASE_ORDER_VENDOR_INVOICE.md

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
  "pedimento_number": "26  47  3807  6000123"
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
| No son 15 dígitos o trae letras | 400 | El pedimento debe tener 15 dígitos con el formato del SAT… |
| El 9.º dígito no es el último del año ni el del año anterior | 400 | El dígito de año del pedimento debe ser el último dígito del año de validación… |
| Numeración `000000` | 400 | La numeración progresiva del pedimento debe iniciar en 000001 |

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
  "pedimento_number": "26  47  3807  6000123"
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

Input con máscara `00  00  0000  0000000`. Al escribir solo entran dígitos y se pintan los dos espacios entre año, aduana y patente. El dígito de año queda pegado a los 6 de la numeración.

Ejemplo: `26  47  3807  6000123`.

- Vacío → se guarda `null`.
- 15 dígitos válidos → se guarda con la máscara (también si los pegaron sin espacios).
- El 9.º dígito tiene que ser el último del año (el `6` de `26`) o el del año anterior si es consolidado (el `5`).
- La numeración progresiva no puede ser `000000`.
- Cualquier otro texto → no se puede guardar. El backend responde **400** con el mismo criterio.

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
