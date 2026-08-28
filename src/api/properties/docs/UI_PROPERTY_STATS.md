# UI — Stats y filtros del listado de lotes

Contrato para Pollux: el listado de **Lotes** lleva una tira de KPI (como Contratos) y un filtro de **grupo de cliente**. Los números siguen el **proyecto** y el resto de filtros; no se calculan en el front.

Máximo **4 cards**. No clonar el grid de 12 del Divino Dashboard.

---

## Layout

Entre la barra de filtros y la tabla:

```
[ Título Lotes ]                         [ + Crear Lote ]

[ Buscar… ] [ Proyecto ▼ ] [ Estado ▼ ] [ Grupo de cliente ▼ ]

[ TOTAL ] [ DISPONIBLES ] [ ACTIVOS EN PAGO ] [ PRECIO PROM. $/M² ]

[ Tabla ]
```

Misma familia visual que Contratos (tira de 4, pastel + borde superior de color) con el acabado de Divino: valor grande, label en caps muted, icono chico, 1 línea de subdato. Grid: `1` col mobile, `2` tablet, `4` desktop.

No son clickeables.

---

## Filtros

| UI | Query param | Catálogo |
|----|-------------|----------|
| Proyecto | `groupId` | `GET /api/tenant/property-groups` (ya existe) |
| Estado | `status` | `disponible` \| `vendido` \| `reservado` \| `cancelado` |
| Grupo de cliente | `customer_group_id` | `GET /api/tenant/customers/groups` |
| Búsqueda | `search` | ya existe |

**`groupId` ≠ `customer_group_id`.** El primero es el proyecto (property group). El segundo es el grupo de clientes. No enviar `group_id` en lotes: ese nombre es de contratos/clientes.

Opciones de grupo de cliente: mismo catálogo que Clientes/Contratos. No hardcodear.

“Todos los proyectos” / “Todos los grupos” / “Todos los estados” = **omitir** el param.

`customer_group_id` deja lotes **con al menos un contrato** cuyo cliente está en ese grupo. Los disponibles sin cliente **salen** del listado y de las cards. Es correcto: el grupo aplica a quién compró, no al inventario vacío.

Al cambiar cualquier filtro: refetch **lista + stats en paralelo**.

---

## Endpoints

| Uso | Ruta | Permiso |
|-----|------|---------|
| Tabla | `GET /api/tenant/properties` | `Property:Read` |
| Cards | `GET /api/tenant/properties/stats` | `Property:Read` |
| Grupos de cliente | `GET /api/tenant/customers/groups` | `customers:Read` |
| Proyectos | `GET /api/tenant/property-groups` | `Property:Read` |

Stats **antes** de `/:id` en el back; el path es `/properties/stats`.

Mismos filtros en ambos GET (stats **sin** `page`/`limit`):

```
GET /api/tenant/properties?groupId={proyecto}&customer_group_id={grupo}&status=disponible&page=1&limit=20
GET /api/tenant/properties/stats?groupId={proyecto}&customer_group_id={grupo}&status=disponible
```

Solo un proyecto:

```
GET /api/tenant/properties/stats?groupId={uuid}
```

---

## Respuesta de stats

No sumar `data[]`. `avg_price_per_m2` es Σ precio / Σ m² del filtro (ponderado por área).

```json
{
  "total": { "count": 120, "area": 45120.5, "value": 8500000 },
  "available": { "count": 48, "area": 18000.25, "value": 3200000 },
  "active_in_payment": { "count": 40, "remaining_balance": 1219701.15 },
  "reserved": { "count": 5 },
  "sold": { "count": 67 },
  "avg_price_per_m2": 188.38
}
```

Contadores: number. Montos y m²: number (2 decimales en UI). Vacío: 0.

`active_in_payment`: lotes con contrato `activo` (en proceso de pago), dentro del filtro.

`reserved` y `sold` van en el payload por si se usan como chip; **no** abrir una 5ª/6ª card.

---

## Las 4 cards

Estilo: borde superior de color (~3px), icono outline 20–24px arriba a la derecha, número 24–28px tabular, label 11px caps muted, sub 12px.

| # | Color borde | Título | Valor | Sub | Icono |
|---|-------------|--------|--------|-----|--------|
| 1 | navy / slate | TOTAL · Lotes | `total.count` | `{total.area} m² · {total.value}` | grid / parcela |
| 2 | verde | DISPONIBLES | `available.count` | `{available.value} · {available.area} m²` | check / lote libre |
| 3 | ámbar | ACTIVOS EN PAGO | `active_in_payment.count` | Pendiente `{active_in_payment.remaining_balance}` | calendario / pagos |
| 4 | teal | PRECIO PROM. $/M² | `avg_price_per_m2` | Sobre el filtro actual | regla / m² |

Chip opcional en card 1, solo si > 0: `{sold.count} vendidos · {reserved.count} reservados`.

Formatos: moneda MXN, m² con 2 decimales, entero en conteos, `$0.00` / `0` / `0.00` si no hay datos.

---

## Cliente en la fila

El cliente de la tabla ahora puede traer grupo:

```json
{
  "customer": {
    "id": 12,
    "name": "Ana",
    "lastname": "Ruiz",
    "fullName": "Ana Ruiz",
    "group_id": "uuid",
    "group": { "id": "uuid", "name": "Mayoreo" }
  }
}
```

Sin cliente: `customer: null`. Columna grupo opcional: `customer.group?.name ?? '—'`.

---

## Estados

| Estado | UI |
|--------|----|
| Loading | 4 skeletons del alto de las cards; la tabla puede ir aparte |
| Error | toast + cards en 0; no romper el listado |
| Vacío | cards en 0; tabla empty-state de siempre |
| Filtro | lista y cards del **mismo** alcance |

---

## Qué no hacer

- Inventar las cards con `data[]` (paginación)
- Olvidar `groupId` al cambiar de proyecto
- Mandar `group_id` en lotes (usar `customer_group_id`)
- Poner 8–12 KPIs; esto no es Divino Dashboard
- Hardcodear grupos de cliente

---

## Checklist Pollux

- [ ] 4 cards arriba de la tabla, estilo Contratos + borde de color
- [ ] Dropdown **Grupo de cliente** (`customer_group_id`) + **Proyecto** (`groupId`)
- [ ] `GET /tenant/properties/stats` al entrar y al cambiar filtros (mismo query que la lista, sin page)
- [ ] Cards leen el GET stats, no la página
- [ ] `$/m²` = `avg_price_per_m2`; disponibles = `available.count`; en pago = `active_in_payment.count`
- [ ] Skeletons; error no tumba la tabla
