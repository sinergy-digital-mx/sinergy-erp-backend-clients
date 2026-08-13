# UI — Productos en detalle de cliente

Secciones en el **detalle del cliente** (Pollux): **Productos más comprados** y **Productos que le pueden interesar**.

---

## Endpoint

```http
GET /api/tenant/customers/:id/product-insights
Permiso: customers:Read
```

Query opcional:

| Param | Default | Descripción |
|-------|---------|-------------|
| `most_purchased_limit` | `8` | 1–20 |
| `recommended_limit` | `8` | 1–20 |

Ejemplo:

```http
GET /api/tenant/customers/15043/product-insights?most_purchased_limit=8&recommended_limit=8
```

Cargar **en paralelo** con el detalle del cliente (o al montar la vista), no embebido en `GET /customers/:id`.

---

## Respuesta

```json
{
  "customer_id": 15043,
  "most_purchased": [
    {
      "product_id": "uuid",
      "name": "Producto A",
      "sku": "SKU-001",
      "photo": "https://...signed...",
      "category_id": "uuid",
      "category_name": "Herramientas",
      "subcategory_id": "uuid",
      "subcategory_name": "Manuales",
      "times_ordered": 5,
      "total_quantity": 12,
      "total_amount": 720.0,
      "last_purchased_at": "2026-08-01T18:00:00.000Z"
    }
  ],
  "recommended": [
    {
      "product_id": "uuid",
      "name": "Producto B",
      "sku": "SKU-002",
      "photo": "https://...signed...",
      "category_id": "uuid",
      "category_name": "Herramientas",
      "subcategory_id": "uuid",
      "subcategory_name": "Manuales",
      "reason": "same_subcategory",
      "reason_label": "Misma subcategoría"
    }
  ]
}
```

### Reglas de negocio (back)

| Sección | Lógica |
|---------|--------|
| Más comprados | OV del cliente con `general_status != Cancelada`, agrupado por producto, orden por `total_quantity` desc |
| Pueden interesar | Productos **activos** de la misma **subcategoría** (prioridad) o **categoría** de los más comprados, que el cliente **aún no ha comprado** |

Si no hay historial de OV → `most_purchased: []` y `recommended: []`.

`photo` viene firmada (~15 min). Si es `null`, usar placeholder.

---

## Layout sugerido (detalle cliente)

Ubicación: **entre** la card “Información del Cliente” (tabs) y la card “Órdenes de Venta”.

```
┌─────────────────────────────────────────────────────────────┐
│ Información del Cliente  |  Credito  |  Información Fiscal  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐  ┌──────────────────────────────┐
│ Productos más comprados      │  │ Productos que le pueden      │
│                              │  │ interesar                    │
│ [scroll horizontal cards]    │  │ [scroll horizontal cards]    │
└──────────────────────────────┘  └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Órdenes de Venta                                            │
└─────────────────────────────────────────────────────────────┘
```

En mobile: apilar las dos cards (más comprados arriba, sugerencias abajo).

No meter estas secciones como tabs del header; deben verse sin cambiar de tab.

---

## Card de producto (ambas secciones)

Mismo componente visual:

| Elemento | Campo |
|----------|--------|
| Imagen | `photo` o placeholder |
| Nombre | `name` (2 líneas max, ellipsis) |
| SKU | `sku` (secundario) |
| Extra (más comprados) | `times_ordered` → “X veces”; opcional `total_quantity` |
| Extra (sugeridos) | chip `reason_label` (“Misma subcategoría” / “Misma categoría”) |

Click en card → ir a detalle de producto (`/products/:product_id`) o abrir drawer del producto si existe en el sistema.

Ancho card sugerido: ~140–160px; fila con scroll horizontal (no wrap infinito hacia abajo).

---

## Estados vacíos

| Caso | UI |
|------|-----|
| `most_purchased.length === 0` | Texto: “Aún no hay compras registradas” |
| `recommended.length === 0` y sí hay más comprados | “No hay sugerencias por categoría por ahora” |
| Ambos vacíos | Una sola línea o dos empties cortos; no ocultar las secciones |

---

## Checklist

- [ ] `GET .../customers/:id/product-insights` al abrir detalle
- [ ] Dos cards lado a lado (desktop) entre info y OV
- [ ] Scroll horizontal de productos con foto + nombre
- [ ] Chip de motivo en sugeridos
- [ ] Empty states
- [ ] Click → producto
