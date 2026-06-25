# Divino Dashboard — UI

## Layout

- Header: título + filtro **All time | Mes | Año**
- Grid 12 KPI cards
- All time: sección **Tendencia por año** (`summary.yearly_breakdown`)
- Gráfico Revenue + donut orígenes
- Tabla vendedores

## Filtros

| Modo | Request |
|------|---------|
| All time | `scope=all_time` — ocultar M/Q/S en Revenue |
| Año | `scope=period&year=` |
| Mes | `scope=period&year=&month=` |

Refetch: `summary`, `sellers`, `lead-origins`, `revenue-series`.

## KPI cards

MXN, m² con 2 decimales. Diff % verde/rojo según lista vs cierre.

## Tabla vendedores

Orden: `revenue` DESC. Tours = reuniones completadas en leads.

## Contrato (form)

`lead_group_id`, `lead_id`, `list_price` (override opcional desde lote).

## Menú

Solo tenant Divino + permiso `divino_dashboard:ViewMenu`.
