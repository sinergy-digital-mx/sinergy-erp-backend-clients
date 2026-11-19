# UI — Deshabilitar producto

## 2026-11-12

Un producto repetido se deshabilita desde el final del tab **Detalles** del modal de producto. Si tiene existencia, hay que confirmar la baja: el inventario disponible pasa a cero y queda en el kardex como ajuste.

## Dónde

Modal **Editar producto**, tab **Detalles**, debajo de **Guardar cambios**.

| Estado | Botón |
|--------|--------|
| Activo | **Deshabilitar** |
| Deshabilitado | **Habilitar** |

Si hay transferencias abiertas (`pending` o `in_transit`), el botón queda deshabilitado. Primero hay que recibirlas o cancelarlas.

Habilitar no devuelve el inventario que ya se dio de baja.

## Aviso de inventario

`GET /api/tenant/products/:id/disable-impact`  
Permiso: `Product:Read`

```json
{
  "is_active": true,
  "has_inventory": true,
  "lot_count": 2,
  "open_transfer_count": 0,
  "by_uom": [
    { "uom_name": "Pie", "quantity": "2.5" },
    { "uom_name": "Pieza", "quantity": "10" }
  ]
}
```

Si `has_inventory` es true, el texto del tab y la confirmación dicen que ese inventario se dará de baja. Ejemplo: `Tiene inventario (2.5 Pie, 10 Pieza en 2 lotes). Si lo deshabilitas, ese inventario se dará de baja.`

## Cambio de estado

`PATCH /api/tenant/products/:id/status`  
Permiso: `Product:Update`

```json
{ "is_active": false, "write_off_inventory": true }
```

| Caso | Body | Resultado |
|------|------|-----------|
| Sin existencia | `{ "is_active": false }` | Queda deshabilitado |
| Con existencia y confirmación | `{ "is_active": false, "write_off_inventory": true }` | Lotes disponibles en 0 y producto deshabilitado |
| Con existencia sin confirmación | `{ "is_active": false }` | 400. No cambia nada |
| Transferencia abierta | cualquiera con `is_active: false` | 400. No cambia nada |
| Volver a activar | `{ "is_active": true }` | Queda activo. No repone existencia |

La baja usa el movimiento de kardex `audit_adjustment`, referencia `product`, nota `Baja de inventario al deshabilitar el producto`.

Un producto deshabilitado no sale en ventas, POS, compras ni en el resumen de inventario.

## Listado

Filtro **Estado** junto a **Tipo**:

| Opción | Query |
|--------|--------|
| Todos los estados | sin `is_active` |
| Activos | `is_active=true` |
| Deshabilitados | `is_active=false` |

La URL del catálogo guarda `status=active` o `status=inactive`. En la tabla, el nombre lleva la etiqueta **Deshabilitado**.

`GET /api/tenant/products/export/excel` recibe el mismo `is_active` cuando el filtro está puesto.
