# Divino Dashboard

Reporte analítico de ventas de lotes para **Campestre Divino** (solo lectura). Agrega contratos, lotes, leads y usuarios; no tiene tabla propia.

## Qué responde

- Ventas por periodo o histórico (all time)
- Precio/m², lista vs cierre, contado vs financiado
- Vendedores, orígenes de lead, serie de revenue
- Tendencia por año (modo all time)

No es el módulo Contratos: no usa saldos, cobros ni vencidos.

## Alcance

| | |
|--|--|
| Tenant | `54481b63-5516-458d-9bb3-d4e5cb028864` |
| Módulo menú | `divino_dashboard` |
| RBAC | `DivinoDashboard:Read`, `divino_dashboard:ViewMenu` |
| API | `/api/tenant/divino-dashboard` |

## Fuente de datos

**Venta** = contrato `activo` o `completado`, filtrado por `contract_date`.

| Dato | Origen |
|------|--------|
| Cierre, enganche, vendedor, origen | `contracts` |
| m², lista fallback | `properties` |
| Tours | `lead_activities` (meeting, completed) |
| Origen | `lead_groups` / lead del contrato |

Precio lista: `COALESCE(contract.list_price, property.list_price, property.total_price)`.

## Docs en este módulo

- [API.md](./API.md) — endpoints y query params
- [UI_DESIGN.md](./UI_DESIGN.md) — guía para frontend

## Setup

```bash
npm run migration:run
npm run seed:divino-dashboard
```
