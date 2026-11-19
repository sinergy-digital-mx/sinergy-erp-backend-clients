# UI — Rutas de reparto

## 2026-11-13

Catálogo por organización: nombre, código, descripción y activo. Nace apagado. Se enciende en Configuración → Órdenes de venta.

```json
{ "name": "Ruta Otay", "code": "OTAY", "description": "Zona norte", "is_active": true }
```

`GET /tenant/logistics-routes` devuelve vacío si las rutas están apagadas. El alta de la orden no pide ruta en ese caso.
