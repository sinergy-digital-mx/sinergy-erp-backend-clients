# UI — Clonar orden de venta

Pestaña **Clonar orden** en el detalle de la orden. Crea una venta nueva con los mismos datos; solo se editan el concepto y el precio de cada línea (y notas).

---

## Historial

- **2026-11-02** — Clonar conserva vendedor y comisionado aunque no tengan código POS. Cambiarlos a mano sigue exigiendo el código.
- **2026-10-21** — Alta: `POST /sales-orders/:id/clone`, campo `custom_description` por línea.

---

## Endpoint

```
POST /api/tenant/sales-orders/:id/clone
Authorization: Bearer {token}
Content-Type: application/json
```

### Body

```json
{
  "lines": [
    {
      "line_id": "uuid-de-la-linea-origen",
      "custom_description": "Desarrollo de software septiembre",
      "unit_price": 4500
    }
  ],
  "notes": "Notas libres de la nueva venta",
  "expected_delivery_date": "2026-10-21"
}
```

| Campo | Obligatorio | Descripción |
| --- | --- | --- |
| `lines[].line_id` | sí | ID de la línea de la orden origen (`line_items[].id`). |
| `lines[].custom_description` | no | Concepto nuevo. Si se omite se conserva el actual. |
| `lines[].unit_price` | no | Precio unitario nuevo (hasta 4 decimales). Si se omite se copia. |
| `notes` | no | Notas de la nueva orden. Si se omite se copian las originales. |
| `expected_delivery_date` | no | `YYYY-MM-DD`. Si se omite, hoy. |

Las líneas que no se envían se copian igual (producto, unidad, cantidad, impuestos, descuento).

### Qué se copia

Cliente, razón social, sucursal, razón fiscal, moneda, tipo de venta (`sale_scope`), vendedor y comisionado, descuento global y cantidades. La nueva orden nace `Pendiente` de pago y con folio nuevo; no se copian pagos, facturas ni documentos.

El comisionado se copia tal cual, aunque no tenga código POS. Esa exigencia aplica al cambiar vendedor o comisionado, no al clonar.

### Respuesta (201)

Misma forma que `POST /sales-orders` (orden completa). Usar `id` y `folio` para abrir la nueva orden.

### Errores (400)

- `Solo se pueden clonar órdenes manuales` — las ventas POS no se clonan.
- `La línea ... no pertenece a la orden`.
- Cualquier validación de creación (producto inactivo, descuento vencido, etc.).

---

## Concepto libre por línea (`custom_description`)

- Nuevo campo opcional en `line_items[]` de `POST /sales-orders` y de las respuestas de la orden. Máx. 255 caracteres.
- Si existe, **reemplaza el nombre del producto** en: detalle de la orden, PDF, factura (CFDI `Descripcion`, incluidas suscripciones y autofactura), anticipos y exportación.
- `null` o vacío → se usa el nombre del producto.
- `PUT /sales-orders/:id` conserva el concepto de la línea con el mismo producto y unidad si el formulario no lo envía.

---

## UI sugerida

1. Pestaña **Clonar orden** (visible con permiso de crear y orden manual).
2. Tabla con una fila por línea: producto (solo lectura), input de concepto (prellenado con el actual), input de precio y cantidad (solo lectura).
3. Campo de notas libres.
4. Botón **Crear orden clonada** → al terminar, abrir la orden nueva.
