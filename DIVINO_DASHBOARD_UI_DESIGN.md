# Divino Dashboard – UI Design

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Divino Dashboard                       [Mes|Año] [▼ Mes ▼ Año]│
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
│  [Chart] Revenue mensual/trimestral (tabs: M | Q | S | A)   │
│  [Chart] Origen de leads (donut)                            │
├─────────────────────────────────────────────────────────────┤
│  VENTAS POR VENDEDOR (tabla full width)                     │
│  Vendedor | Lotes | Revenue | m² | Tours                    │
└─────────────────────────────────────────────────────────────┘
```

## Filtro periodo

- **Segmented control** (como referencia Hoy/Semana/Mes/Año): solo **Mes** | **Año**.
- Modo **Mes:** dropdown mes (1-12) + dropdown año.
- Modo **Año:** solo dropdown año.
- Al cambiar → refetch: `summary`, `sellers`, `lead-origins`, `revenue-series`.

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
