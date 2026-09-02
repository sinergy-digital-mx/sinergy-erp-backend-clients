# UI — Stats y filtros del listado de lotes

Contrato para Pollux: **un solo catálogo** — **Grupo de cliente**. No hay “Proyecto”.

`property_groups` ya no aplica a lotes. `properties.group_id` es un UUID de `customer_groups` (el mismo de Clientes y Contratos).

Máximo **4 cards**. No clonar el grid de 12 del Divino Dashboard.

---

## Layout

```
[ Título Lotes ]                         [ + Crear Lote ]

[ Buscar… ] [ Grupo de cliente ▼ ] [ Estado ▼ ]

[ TOTAL ] [ DISPONIBLES ] [ ACTIVOS EN PAGO ] [ PRECIO PROM. $/M² ]

[ Tabla ]
```

**Quitar** el dropdown “Proyecto” / “Todos los proyectos”. **Quitar** `GET /tenant/property-groups` de esta pantalla (listado, crear y editar lote).

Misma familia visual que Contratos: tira de 4, borde superior de color, valor grande, label caps muted, icono chico, 1 línea de sub. Grid: `1` col mobile, `2` tablet, `4` desktop. No clickeables.

---

## Filtros

| UI | Query param | Catálogo |
|----|-------------|----------|
| **Grupo de cliente** | `group_id` | `GET /api/tenant/customers/groups` |
| Estado | `status` | `disponible` \| `vendido` \| `reservado` \| `cancelado` |
| Búsqueda | `search` | ya existe |

Mismo GET de grupos que Clientes y Contratos. Nunca un array fijo ni UUIDs de Divino.

“Todos los grupos de cliente” / “Todos los estados” = **omitir** el param.

Compat (no usar en código nuevo): `groupId` y `customer_group_id` se tratan como `group_id`.

Al cambiar cualquier filtro: refetch **lista + stats en paralelo**.

Filtrar por grupo incluye lotes **disponibles** de ese grupo (el grupo vive en el lote, no solo en el comprador).

---

## Endpoints

| Uso | Ruta | Permiso |
|-----|------|---------|
| Tabla | `GET /api/tenant/properties` | `Property:Read` |
| Cards | `GET /api/tenant/properties/stats` | `Property:Read` |
| Grupos | `GET /api/tenant/customers/groups` | `customers:Read` |

```
GET /api/tenant/properties?group_id={uuid}&status=disponible&page=1&limit=20
GET /api/tenant/properties/stats?group_id={uuid}&status=disponible
```

Stats **sin** `page`/`limit`. Cubren todo el filtro, no la página.

---

## Crear / editar lote

`group_id` en el body = UUID de `GET /tenant/customers/groups`.

```json
{ "group_id": "uuid-del-grupo-de-cliente", "code": "LOT-1-01", "name": "…" }
```

`400` si el uuid no es de esta organización. Select: **Grupo de cliente**, mismas opciones que el filtro.

La respuesta trae `group: { id, name, … }` (customer group). Columna de tabla: `group.name`. No pintar una columna “Proyecto” aparte.

### Precio por m² (opcional)

En crear/editar puedes mandar **una** de estas dos formas:

| Campo | Obligatorio | Qué hace |
| ----- | ----------- | -------- |
| `total_price` | No, si mandas `price_per_m2` | Precio total capturado a mano. |
| `price_per_m2` | No | El backend calcula `total_price = total_area × price_per_m2`. |

```json
{
  "code": "LOT-1-01",
  "name": "Lote 1",
  "group_id": "uuid-del-grupo-de-cliente",
  "total_area": 200,
  "measurement_unit_id": "uuid-m2",
  "price_per_m2": 1850
}
```

Respuesta: `total_price: 370000` y `price_per_m2: 1850`.

Si solo mandas `total_price`, se conserva ese monto y `price_per_m2` se deriva (`total / área`). Si cambias el área y el lote ya tenía `price_per_m2`, el total se recalcula. `400` si en el alta no va ni total ni precio/m².

---

## Respuesta de stats

No sumar `data[]`. `avg_price_per_m2` = Σ precio / Σ m² del filtro.

```json
{
  "currency": "USD",
  "currencies": ["USD"],
  "total": { "count": 120, "area": 45120.5, "value": 8500000 },
  "available": { "count": 48, "area": 18000.25, "value": 3200000 },
  "active_in_payment": { "count": 40, "remaining_balance": 1219701.15 },
  "reserved": { "count": 5 },
  "sold": { "count": 67 },
  "avg_price_per_m2": 188.38
}
```

`reserved` / `sold`: chip opcional en TOTAL. No abrir más cards.

---

## Las 4 cards

| # | Color borde | Título | Valor | Sub |
|---|-------------|--------|--------|-----|
| 1 | navy | TOTAL · Lotes | `total.count` | `{total.area} m² · {total.value}` |
| 2 | verde | DISPONIBLES | `available.count` | `{available.value} · {available.area} m²` |
| 3 | ámbar | ACTIVOS EN PAGO | `active_in_payment.count` | Pendiente `{remaining_balance}` |
| 4 | teal | PRECIO PROM. $/M² | `avg_price_per_m2` | Sobre el filtro actual |

Montos según `stats.currency` (**USD** hoy). `Intl` con esa moneda, no `MXN` fijo: eso pinta `MX$`. Mismo patrón que Contratos (`UI_CONTRACT_CURRENCY.md`). m² con 2 decimales. Vacío: `0` / `$0.00` + badge USD.

En la tabla: `data[].currency` junto a precio y `$/m²`.

---

## Qué no hacer

- Dropdown **Proyecto** ni `GET /tenant/property-groups` en Lotes
- Dos columnas Proyecto + Grupo
- Inventar cards con `data[]`
- Hardcodear grupos
- `style: 'currency', currency: 'MXN'` fijo ni prefijo `MX$`

---

## Checklist Pollux

- [ ] Un solo dropdown **Grupo de cliente** (`group_id` + `GET /tenant/customers/groups`)
- [ ] Crear/editar lote: `group_id` de ese catálogo
- [ ] Crear/editar lote: `price_per_m2` opcional; si va, el backend calcula `total_price`
- [ ] Columna grupo: `group.name`
- [ ] 4 cards + `GET /tenant/properties/stats` con los mismos filtros
- [ ] Cards y tabla con `stats.currency` / `data[].currency` (USD), no MXN
- [ ] Sin “Proyecto” / `property-groups`
