# UI — Descuentos por producto

Guía para Pollux: nueva pestaña **Descuentos** en el modal **Editar producto**, al mismo nivel que Precios, UOMs, etc.

> **Estado backend:** API propuesta en este documento (mismo patrón que `tenant/products/:productId/prices`). Implementar en backend antes de conectar en producción.

---

## Ubicación en la UI

```
Editar Producto
├── Detalles
├── UOMs
├── Precios
├── Descuentos          ← NUEVA
├── Costos de Proveedor
└── Fotos
```

Misma estructura visual que la pestaña **Precios**:
- Botón superior derecho **+ Agregar descuento**
- Tabla con acciones editar / eliminar
- Modal secundario para crear o editar un descuento

---

## Concepto de negocio

| Regla | Descripción |
|-------|-------------|
| Varios descuentos | Un producto puede tener **0..N** descuentos configurados |
| Tipos | **Porcentaje** (`percentage`) o **monto fijo** (`fixed`) en MXN |
| Disponibilidad | Solo los descuentos con `is_active: true` se ofrecen en POS / ventas |
| Aplicación en POS | El cajero/vendedor **elige uno** de la lista disponible al agregar el producto (no se aplican todos automáticamente) |
| UOM | Opcional: el descuento puede aplicar a una UOM específica o a **todas** las UOM del producto |

---

## API propuesta (espejo de Precios)

Base: `/api/tenant/products/:productId/discounts`

| Método | Ruta | Permiso | Uso |
|--------|------|---------|-----|
| GET | `.../discounts` | `Product:Read` | Cargar tabla al abrir pestaña |
| GET | `.../discounts/:id` | `Product:Read` | Editar (opcional si GET lista trae todo) |
| POST | `.../discounts` | `Product:Update` | Crear |
| PATCH | `.../discounts/:id` | `Product:Update` | Editar |
| DELETE | `.../discounts/:id` | `Product:Delete` | Eliminar |

### GET lista — respuesta esperada

```json
[
  {
    "id": "uuid",
    "product_id": "uuid",
    "name": "Promo mostrador",
    "discount_type": "percentage",
    "value": 10,
    "product_uom_id": null,
    "product_uom": null,
    "is_active": true,
    "valid_from": null,
    "valid_to": null,
    "created_at": "2026-06-25T12:00:00Z",
    "updated_at": "2026-06-25T12:00:00Z"
  },
  {
    "id": "uuid",
    "product_id": "uuid",
    "name": "Descuento $5",
    "discount_type": "fixed",
    "value": 5,
    "product_uom_id": "uuid-uom",
    "product_uom": {
      "id": "uuid-uom",
      "uom": { "id": "...", "name": "Pieza" }
    },
    "is_active": true,
    "valid_from": "2026-06-01",
    "valid_to": "2026-06-30",
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### POST crear

```json
{
  "name": "Promo verano",
  "discount_type": "percentage",
  "value": 15,
  "product_uom_id": null,
  "is_active": true,
  "valid_from": "2026-06-01",
  "valid_to": "2026-08-31"
}
```

```json
{
  "name": "Descuento empleado",
  "discount_type": "fixed",
  "value": 50,
  "product_uom_id": "uuid-product-uom",
  "is_active": true
}
```

| Campo | Tipo | Obligatorio | Validación UI |
|-------|------|-------------|---------------|
| `name` | string | Sí | 1–120 caracteres |
| `discount_type` | `percentage` \| `fixed` | Sí | Radio o select |
| `value` | number | Sí | Si `%`: 0.01–100. Si `fixed`: > 0 |
| `product_uom_id` | uuid \| null | No | Select de UOMs del producto; `null` = todas |
| `is_active` | boolean | No | Default `true` |
| `valid_from` | date | No | ≤ `valid_to` si ambos existen |
| `valid_to` | date | No | ≥ `valid_from` |

### PATCH editar

Mismos campos, todos opcionales.

### DELETE

Confirmación modal: *"¿Eliminar el descuento «{name}»?"*

---

## Tabla principal (pestaña Descuentos)

Columnas sugeridas (alineadas con Precios):

| Columna | Origen | Formato |
|---------|--------|---------|
| Nombre | `name` | Texto |
| Tipo | `discount_type` | `%` → "Porcentaje", `fixed` → "Monto fijo" |
| Valor | `value` | `%` → `10%`, `fixed` → `$50.00` |
| UOM | `product_uom.uom.name` | "Todas" si `product_uom_id` es null |
| Vigencia | `valid_from` / `valid_to` | "Siempre" o `01/06 – 30/06/2026` |
| Estado | `is_active` | Badge verde "Activo" / gris "Inactivo" |
| Acciones | — | ✏️ Editar, 🗑 Eliminar |

**Estado vacío:**

```
Sin descuentos configurados
Los descuentos activos aparecerán disponibles en POS al vender este producto.
[+ Agregar descuento]
```

---

## Modal — Agregar / Editar descuento

```
┌─────────────────────────────────────────────┐
│  Agregar descuento                    [ X ] │
├─────────────────────────────────────────────┤
│  Nombre *                                   │
│  [ Promo mostrador___________________ ]     │
│                                             │
│  Tipo de descuento *                        │
│  (•) Porcentaje   ( ) Monto fijo (MXN)      │
│                                             │
│  Valor *                                    │
│  [ 10___________ ] %                        │
│  (si fixed: prefijo $ en lugar de %)        │
│                                             │
│  UOM                                        │
│  [ Todas las UOMs          ▼ ]              │
│  (opciones: UOMs ya creadas en pestaña UOMs)│
│                                             │
│  Vigencia (opcional)                        │
│  Desde [ __/__/____ ]  Hasta [ __/__/____ ] │
│                                             │
│  [x] Activo (disponible en ventas)          │
│                                             │
│              [ Cancelar ]  [ Guardar ]      │
└─────────────────────────────────────────────┘
```

### Validaciones cliente

1. `name` no vacío.
2. `value > 0`.
3. Si `discount_type === 'percentage'` → `value <= 100`.
4. Si `valid_from` y `valid_to` → `from <= to`.
5. Si se elige UOM, debe existir en la lista de UOMs del producto (cargar de pestaña UOMs o `GET products/:id`).

### Vista previa (opcional, bajo el valor)

Con precio de referencia de la lista comercial (si existe en pestaña Precios):

```
Precio base: $12.00  →  Con descuento: $10.80  (ahorro $1.20)
```

Cálculo UI:
- `percentage`: `precio * (1 - value/100)`
- `fixed`: `max(0, precio - value)`

---

## Flujo de datos en el componente

```typescript
// Al abrir pestaña Descuentos
async loadDiscounts(productId: string) {
  const discounts = await api.get(`/tenant/products/${productId}/discounts`);
  this.discounts = discounts;
}

// Al guardar modal
async saveDiscount(productId: string, form: DiscountForm, editingId?: string) {
  const body = {
    name: form.name.trim(),
    discount_type: form.discountType,
    value: Number(form.value),
    product_uom_id: form.productUomId || null,
    is_active: form.isActive,
    valid_from: form.validFrom || null,
    valid_to: form.validTo || null,
  };

  if (editingId) {
    await api.patch(`/tenant/products/${productId}/discounts/${editingId}`, body);
  } else {
    await api.post(`/tenant/products/${productId}/discounts`, body);
  }
  await this.loadDiscounts(productId);
}
```

---

## Uso en POS (referencia para otra pantalla)

Cuando el vendedor agrega un producto al carrito:

1. Cargar descuentos activos del producto (mismo GET o campo embebido en inventario).
2. Filtrar:
   - `is_active === true`
   - Fecha actual dentro de `valid_from` / `valid_to` (si aplican)
   - UOM de la línea coincide con `product_uom_id` o es null
3. Mostrar selector **"Descuento"** (dropdown) con opción **"Sin descuento"** + lista de nombres.
4. Al crear la línea de `sales-orders`, enviar el descuento elegido (campo a definir en backend POS, ej. `discount_id` o `discount_percentage` calculado).

**Importante:** configurar descuentos aquí **no** los aplica solos; solo los deja **disponibles** para elegir en venta.

---

## Permisos

Igual que Precios:

| Acción UI | Permiso |
|-----------|---------|
| Ver pestaña / tabla | `Product:Read` |
| Crear / editar | `Product:Update` |
| Eliminar | `Product:Delete` |

Ocultar botón **+ Agregar descuento** si no tiene `Product:Update`.

---

## Errores API a mostrar

| HTTP | Mensaje sugerido |
|------|-----------------|
| 400 | Mostrar `message` del backend (valor inválido, fechas, etc.) |
| 404 | "Producto o descuento no encontrado" |
| 409 | "Ya existe un descuento con ese nombre para este producto" (si backend lo valida) |

---

## Checklist Pollux

- [ ] Pestaña **Descuentos** en modal Editar producto
- [ ] Tabla con columnas Nombre, Tipo, Valor, UOM, Vigencia, Estado, Acciones
- [ ] Modal crear/editar con tipo % / monto fijo
- [ ] Select UOM (opcional, default "Todas")
- [ ] Toggle Activo
- [ ] Fechas vigencia opcionales
- [ ] Confirmación al eliminar
- [ ] Recargar tabla tras POST/PATCH/DELETE
- [ ] Validaciones cliente antes de guardar
- [ ] (POS) Selector de descuento al agregar producto — fase 2
