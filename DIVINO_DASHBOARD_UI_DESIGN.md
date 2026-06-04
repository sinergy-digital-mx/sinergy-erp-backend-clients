# Divino Dashboard – UI Design

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Divino Dashboard            [All time|Mes|Año] [▼ Mes ▼ Año]  │
├─────────────────────────────────────────────────────────────┤
│  KPI GRID (4 cols desktop, 2 tablet, 1 mobile)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ $/m² avg │ │ Total $  │ │ Total m² │ │ Lotes    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Lista vs │ │ Diff %   │ │ Max/Min  │ │ Contado  │       │
│  │ cierre   │ │          │ │  $/m²    │ │ vs fin.  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐                                  │
│  │ Enganche │ │ Mensual. │                                  │
│  │ promedio │ │ promedio │                                  │
│  └──────────┘ └──────────┘                                  │
├─────────────────────────────────────────────────────────────┤
│  (solo All time) TENDENCIA POR AÑO — líneas/barras por año  │
│  total vendido, m², lotes, precio lista/cierre, $/m², etc.  │
│  Fuente: summary.yearly_breakdown[]                         │
├─────────────────────────────────────────────────────────────┤
│  [Chart] Revenue (periodo: M|Q|S|A · All time: por año)     │
│  [Chart] Origen de leads (donut)                            │
├─────────────────────────────────────────────────────────────┤
│  VENTAS POR VENDEDOR (tabla full width)                     │
│  Vendedor | Lotes | Revenue | m² | Tours                    │
└─────────────────────────────────────────────────────────────┘
```

## Filtro periodo

- **Segmented control:** **All time** | **Mes** | **Año**.
- **All time:** `?scope=all_time` (sin año). KPI cards = histórico. Mostrar sección **“Tendencia por año”** con gráficas desde `summary.yearly_breakdown` y `revenue-series` (una barra por año).
- **Mes:** `?scope=period&year=&month=`
- **Año:** `?scope=period&year=`
- Al cambiar → refetch los 4 endpoints con el mismo `scope` (+ `year`/`month` si aplica).
- En **All time**, ocultar toggles M/Q/S del gráfico Revenue (el API ya agrupa por año).

## KPI cards

- Fondo blanco, sombra suave, número grande, label pequeño.
- Colores semánticos: verde positivo en diff % si cierre > lista (o rojo si descuento).
- Formato moneda MXN, m² con 2 decimales.

## Tabla vendedores

- Sticky header, zebra rows.
- Orden default: `revenue` DESC.
- Columna Tours = actividades tipo reunión del periodo.

## Contrato (formulario editar)

- **Origen:** combobox `lead_groups` del tenant.
- **Lead vinculado:** autocomplete leads (opcional); si elige lead, puede auto-set `lead_group_id`.
- **Precio lista:** readonly desde lote; editable override en contrato como `list_price`.

## Permisos

Mostrar menú solo si tenant = `54481b63-...` y `divino_dashboard:ViewMenu`.
