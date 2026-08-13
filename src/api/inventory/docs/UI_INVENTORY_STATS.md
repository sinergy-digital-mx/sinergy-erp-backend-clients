# UI — Cards de stats de inventario

Guía para Pollux: fila de **KPI cards modernas** arriba del listado (pestañas **Por Lotes** y **Totalizado**).

Los números respetan la cascada razón social → sucursal → almacén. **No** cambian con search ni paginación.

**POS no cambia.**

---

## 1. Dónde van

Encima de la barra de filtros / tabs, full width. Misma fila en Lotes y Totalizado.

```
[ Card Lotes ] [ Card Costo ] [ Card Precio ] [ Card Margen ] [ Card Existencia ]
[ Buscar... ]  [ Razón social ▼ ]  [ Sucursal ▼ ]  [ Almacén ▼ ]
[ Por Lotes | Totalizado ]
```

Al cambiar razón / sucursal / almacén: recargar **stats + listado** en paralelo.

---

## 2. Endpoint

```
GET /api/tenant/inventory/stats
```

Permiso: `inventory:read`.

| Query param | Obligatorio | Default |
|-------------|-------------|---------|
| `fiscal_configuration_id` | No | Todas las razones |
| `billing_branch_id` | Solo si hay almacén | Todas las sucursales de esa razón |
| `warehouse_id` | No | Todos los almacenes de esa sucursal |

Cascada igual que el listado (`UI_INVENTORY_LOCATION_FILTERS.md`). **Todas = no enviar el param.**

```
GET /api/tenant/inventory/stats
GET /api/tenant/inventory/stats?fiscal_configuration_id={uuid}
GET /api/tenant/inventory/stats?fiscal_configuration_id={uuid}&billing_branch_id={uuid}
GET /api/tenant/inventory/stats?fiscal_configuration_id={uuid}&billing_branch_id={uuid}&warehouse_id={uuid}
```

Errores 400: mismos mensajes que lotes/totalizado. Toast con `message`.

Cargar **en paralelo** con `GET /locations` al entrar, y de nuevo al cambiar filtros.

---

## 3. Respuesta

```json
{
  "total_batches": 120,
  "batches_with_stock": 98,
  "batches_depleted": 22,
  "total_products": 45,
  "products_with_stock": 40,
  "total_warehouses": 3,
  "total_available_quantity": "15230.000",
  "total_initial_quantity": "18000.000",
  "total_cost": "450000.00",
  "total_sale_value": "720000.00",
  "average_unit_cost": "29.55",
  "average_unit_price": "47.27",
  "gross_margin": "270000.00",
  "gross_margin_percentage": "37.50",
  "batches_without_cost": 5,
  "quantity_without_cost": "120.000",
  "products_without_price": 2,
  "quantity_without_price": "80.000"
}
```

Montos: string 2 decimales. Cantidades: string 3 decimales. Contadores: number.

### Cómo se calcula (back)

| Campo | Fórmula |
|-------|---------|
| `total_cost` | Σ existencia × costo unitario OC (con conversión de UOM si aplica) |
| `total_sale_value` | Σ existencia × precio sugerido (primera lista activa, mismo que el totalizado) |
| `average_unit_cost` | `total_cost / total_available_quantity` |
| `average_unit_price` | `total_sale_value / total_available_quantity` |
| `gross_margin` | `total_sale_value − total_cost` |
| `gross_margin_percentage` | `gross_margin / total_sale_value × 100` (0 si venta = 0) |

Lotes importados sin OC → costo 0 y entran en `batches_without_cost`. Productos sin lista de precios → venta 0 y entran en `products_without_price`.

---

## 4. Cards (obligatorio: modernas)

5 cards en grid responsive: `1 col` mobile, `2` tablet, `5` desktop. Sin tablas ni texto plano.

Estilo:

- Fondo de superficie, border sutil, radius 12–16, shadow baja
- Icono a la izquierda o arriba (outline, 20–24px)
- **Valor grande** (24–28px, tabular nums)
- Label muted arriba o abajo
- Subtítulo / chip con el dato secundario
- Hover leve (elevate 2–4px). Sin click (no navegan)

MXN con `currency:'MXN'`. Cantidades con 2–3 decimales. `%` con 1–2 decimales.

### Card 1 — Lotes

| UI | Campo |
|----|--------|
| Título | Lotes |
| Valor | `total_batches` |
| Sub | `{batches_with_stock} con stock · {batches_depleted} agotados` |
| Icono | cajas / layers |

### Card 2 — Costo

| UI | Campo |
|----|--------|
| Título | Costo en inventario |
| Valor | `total_cost` (MXN) |
| Sub | `Promedio {average_unit_cost} / u` |
| Icono | recibo / tag de costo |

### Card 3 — Precio

| UI | Campo |
|----|--------|
| Título | Valor a precio de venta |
| Valor | `total_sale_value` (MXN) |
| Sub | `Promedio {average_unit_price} / u` |
| Icono | etiqueta de precio |

### Card 4 — Margen

| UI | Campo |
|----|--------|
| Título | Margen bruto |
| Valor | `gross_margin` (MXN) |
| Sub | `{gross_margin_percentage}%` |
| Color | verde si margen ≥ 0, rojo si < 0 |
| Icono | tendencia / % |

El `%` puede ir como badge grande a la derecha del monto.

### Card 5 — Existencia

| UI | Campo |
|----|--------|
| Título | Existencia |
| Valor | `total_available_quantity` |
| Sub | `{total_products} productos · {total_warehouses} almacenes` |
| Icono | paquete |

### Alertas (dentro de card 5 o chips debajo de la fila)

Mostrar solo si el contador > 0:

| Chip | Condición | Texto |
|------|-----------|--------|
| Warning | `batches_without_cost > 0` | `{batches_without_cost} lotes sin costo` |
| Warning | `products_without_price > 0` | `{products_without_price} productos sin precio` |

Tooltip opcional: `quantity_without_cost` / `quantity_without_price`.

---

## 5. Estados

| Estado | UI |
|--------|----|
| Loading | 5 skeletons del mismo alto que las cards (no spinner bloqueando la tabla) |
| Error | toast + cards en `—` / 0. No romper el listado |
| Vacío | cards en 0 / `$0.00` / `0%`. Sin empty-state extra |
| Filtro | mismos números del alcance seleccionado |

No mezclar stats de “todas las razones” con un listado ya filtrado.

---

## Checklist Pollux

- [ ] 5 cards modernas arriba, compartidas por Lotes y Totalizado
- [ ] `GET /tenant/inventory/stats` al entrar y al cambiar razón / sucursal / almacén
- [ ] Mismos query params de ubicación que el listado
- [ ] MXN + % con color en margen
- [ ] Chips de lotes sin costo / productos sin precio
- [ ] Skeletons en carga; error no tumba la tabla
- [ ] POS sin cambios
