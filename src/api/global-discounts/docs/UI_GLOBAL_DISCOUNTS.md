# UI — Descuentos globales

Guía para Pollux: catálogo de descuentos generales de orden (ej. *Descuento de carpintero*) y su uso en POS / órdenes de venta.

> **Estado backend:** implementado. Descuentos por producto siguen en `tenant/products/:productId/discounts`. Descuentos globales son independientes y se aplican **una vez por orden**.

---

## Ubicación en la UI

Menú **Ventas → Descuentos globales** (módulo `global_discounts`, permiso `GlobalDiscount:ViewMenu`).

Pantalla tipo catálogo (similar a listas de precio / metas):

- Botón **+ Agregar descuento global**
- Tabla con editar / eliminar
- Modal crear / editar

---

## Concepto de negocio

| Regla | Descripción |
|-------|-------------|
| Alcance | Aplica a **toda la orden**, no a un producto |
| Tipos | **Porcentaje** (`percentage`) o **monto fijo** (`fixed`) en MXN |
| Selección | El cajero elige **uno** de la lista activa al cerrar la venta (opcional) |
| Convive con descuento por producto | Sí. Primero descuentos por línea; el global se calcula sobre el subtotal neto |
| Ticket / PDF | Se muestran **separados**: descuentos por producto vs descuento global |

---

## API — Catálogo

Base: `/api/tenant/global-discounts`

| Método | Ruta | Permiso | Uso |
|--------|------|---------|-----|
| GET | `/applicable` | `GlobalDiscount:Read` | Selector en POS (solo activos y vigentes) |
| GET | `/` | `GlobalDiscount:Read` | Tabla administración |
| GET | `/:id` | `GlobalDiscount:Read` | Detalle |
| POST | `/` | `GlobalDiscount:Create` | Crear |
| PATCH | `/:id` | `GlobalDiscount:Update` | Editar |
| DELETE | `/:id` | `GlobalDiscount:Delete` | Eliminar |

### POST crear

```json
{
  "name": "Descuento de carpintero",
  "discount_type": "percentage",
  "value": 15,
  "is_active": true,
  "valid_from": null,
  "valid_to": null
}
```

```json
{
  "name": "Cortesía mostrador",
  "discount_type": "fixed",
  "value": 100,
  "is_active": true
}
```

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|------------|
| `name` | string | Sí | 1–120, único por empresa |
| `discount_type` | `percentage` \| `fixed` | Sí | — |
| `value` | number | Sí | `%`: 0.01–100. `fixed`: > 0 |
| `is_active` | boolean | No | Default `true` |
| `valid_from` / `valid_to` | date | No | `from <= to` |

---

## API — Orden de venta / POS

Al crear la orden (`POST /api/tenant/sales-orders`), enviar opcionalmente:

```json
{
  "sales_order_type": "POS",
  "global_discount_id": "uuid-descuento-global",
  "line_items": [
    {
      "product_id": "...",
      "product_uom_id": "...",
      "quantity": 2,
      "unit_price": 150,
      "product_discount_id": "uuid-descuento-producto-opcional"
    }
  ]
}
```

### Cálculo de totales

1. Por cada línea: subtotal, descuento por producto, IVA/IEPS sobre base neta de línea.
2. `discount_total` = suma descuentos por línea.
3. `global_discount_amount` = descuento global sobre `(subtotal - discount_total)`.
4. `total` = `subtotal - discount_total - global_discount_amount + iva_total + ieps_total`.

### Respuesta detalle orden

`GET /api/tenant/sales-orders/:id` incluye en `data`:

```json
{
  "data": {
    "header": { "subtotal": 300, "discount_total": 30, "global_discount_amount": 45, "total": 325, "...": "..." },
    "discount_summary": {
      "line_discount_total": 30,
      "global_discount_amount": 45,
      "discount_total": 75,
      "line_items": [
        {
          "line_item_id": "uuid",
          "product_name": "Producto A",
          "discount_name": "PROMO",
          "discount_type": "percentage",
          "discount_value": 10,
          "discount_amount": 30
        }
      ],
      "global_discount": {
        "global_discount_id": "uuid",
        "discount_name": "Descuento de carpintero",
        "discount_type": "percentage",
        "discount_value": 15,
        "discount_amount": 45
      }
    },
    "applied_line_discounts": [ /* mismo que discount_summary.line_items */ ],
    "applied_global_discount": { /* mismo que discount_summary.global_discount o null */ },
    "line_items": [
      {
        "line_discount_amount": 30,
        "applied_product_discount": { "id", "name", "discount_type", "value" }
      }
    ]
  }
}
```

**UI detalle OV — sección TOTALES:** mostrar siempre (aunque sea $0):

| Línea | Campo |
|-------|-------|
| Subtotal | `header.subtotal` |
| Desc. por producto | `discount_summary.line_discount_total` |
| Desc. global | `discount_summary.global_discount_amount` + nombre en `discount_summary.global_discount.discount_name` |
| IVA / IEPS | `header.iva_total` / `header.ieps_total` |
| Total | `header.total` |

Si `discount_summary.global_discount` es `null` y `line_discount_total` es 0, ocultar las filas de descuento o mostrar `$0.00`.

---

## Ticket POS (separado)

En el recibo térmico:

```
PRODUCTO A          2 x $150.00    $300.00
  DESC PROD: PROMO MOSTRADOR         -$30.00

Subtotal:                           $300.00
Desc. por producto:                 -$30.00
Desc. global (Descuento carpintero): -$40.50
Total:                              $XXX.XX
```

---

## Permisos (módulo `global_discounts`)

| Acción UI | Permiso |
|-----------|---------|
| Ver menú | `GlobalDiscount:ViewMenu` |
| Ver lista / selector POS | `GlobalDiscount:Read` |
| Crear | `GlobalDiscount:Create` |
| Editar | `GlobalDiscount:Update` |
| Eliminar | `GlobalDiscount:Delete` |

---

## POS — flujo sugerido

1. Al abrir pantalla de cobro, cargar `GET /tenant/global-discounts/applicable`.
2. Mostrar selector **Descuento global** con opción *Sin descuento*.
3. Al confirmar venta, incluir `global_discount_id` en el body de la orden (junto con `product_discount_id` por línea si aplica).
4. En resumen previo al cobro, mostrar ambos tipos de descuento por separado.

---

## Checklist Pollux

- [ ] Pantalla catálogo Descuentos globales
- [ ] CRUD con validaciones (% / monto fijo, vigencia)
- [ ] Selector en POS (applicable)
- [ ] Resumen de orden con descuentos separados
- [ ] Enviar `global_discount_id` al crear orden POS
