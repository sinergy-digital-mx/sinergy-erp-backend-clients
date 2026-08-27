# UI — Moneda en costo de proveedor (MXN / USD)

Contrato para Pollux. El costo de un producto **por proveedor + UOM** ahora tiene moneda. Eso define si las OC de ese proveedor con ese producto van en **pesos (MXN)** o **dólares (USD)**.

Valores: `MXN` | `USD`. No usar `USA`, `MX`, `PESOS`, etc.

---

## 1. Modal **Editar Costo** / **Agregar Costo**

Campos actuales: Proveedor, UOM, Costo, IVA %, IEPS %.

**Nuevo campo obligatorio:** **Moneda**

- Control: radio o segmented `MXN` | `USD` (no combo libre).
- Default al crear: `MXN`.
- Al editar: el valor guardado (`currency`).
- Colócalo junto a **Costo** (el número es de esa moneda).
- **Costo** admite hasta **4 decimales** (`2.215`). No redondear a 2 en el input ni al pintar.

```
POST /api/tenant/products/:productId/vendor-costs
PATCH /api/tenant/products/:productId/vendor-costs/:id
```

```json
{
  "vendor_id": "uuid",
  "product_uom_id": "uuid",
  "cost": 2.215,
  "iva_percentage": 0,
  "ieps_percentage": 0,
  "currency": "USD"
}
```

`currency` opcional en API (default `MXN`). **Mándalo siempre** desde el modal.

`GET /api/tenant/products/:productId/vendor-costs` incluye `currency` en cada fila.

---

## 2. Tabla de costos (tab del producto)

Nueva columna **Moneda** (badge):

| `currency` | Badge |
|------------|--------|
| `MXN` | Pesos / MXN |
| `USD` | Dólares / USD |

Una fila = un proveedor + UOM + **una** moneda. No hay dos costos del mismo proveedor/UOM en monedas distintas.

---

## 3. Qué no hacer

- No convertir montos. El número `cost` ya está en esa moneda.
- No inventar un tercer valor de moneda.
- No mezclar en la misma OC productos MXN y USD (lo bloquea el backend). Ver `src/api/purchase-orders/docs/UI_PURCHASE_ORDER_CURRENCY.md`.
