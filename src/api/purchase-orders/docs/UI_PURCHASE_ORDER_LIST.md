# UI — Órdenes de compra (razón → sucursal → almacén)

Contrato para Pollux. A diferencia de OV, la OC **sí tiene almacén destino**. Crear, listar y detalle muestran el árbol **razón social → sucursal → almacén**.

---

## 1. Crear OC — modal árbol

Tab **Información**. Tres combos en cascada (obligatorios), en este orden:

| # | Campo UI | Body POST | Catálogo |
|---|----------|-----------|----------|
| 1 | **Razón social** * | `fiscal_configuration_id` | Fiscales activas |
| 2 | **Sucursal** * | `billing_branch_id` | Sucursales de esa razón |
| 3 | **Almacén** * | `warehouse_id` | Almacenes de esa sucursal |

El resto no cambia: proveedor, fecha esperada, notas, tab Productos.

### Combos

**Razón social**

```
GET /api/tenant/fiscal-configurations?status=active&limit=100
```

Label: `razon_social` · Value: `id`  
Placeholder: `Selecciona una razón social`  
Sucursal y almacén **deshabilitados** hasta elegir razón.

**Sucursal** (solo de la razón)

```
GET /api/tenant/fiscal-configurations/{fiscalConfigId}/branches
```

Label: `code` (ej. `SUCURSAL BUENOS AIRES`) · Value: `id`  
Placeholder: `Selecciona una sucursal`  
Almacén **deshabilitado** hasta elegir sucursal.

**Almacén** (solo de la sucursal)

```
GET /api/tenant/warehouses?billing_branch_id={branchId}&status=active&limit=100
```

Label: `name` · Value: `id`  
Placeholder: `Selecciona un almacén`

### Cascada

1. Cambia razón → resetear sucursal y almacén; recargar sucursales.
2. Cambia sucursal → resetear almacén; recargar almacenes.
3. No listar todos los almacenes del sistema en el combo.

### POST

```
POST /api/tenant/purchase-orders
```

```json
{
  "fiscal_configuration_id": "uuid-razon",
  "billing_branch_id": "uuid-sucursal",
  "warehouse_id": "uuid-almacen",
  "vendor_id": "uuid-proveedor",
  "expected_delivery_date": "2026-08-20",
  "notes": "opcional",
  "pedimento_number": "162430010001234",
  "line_items": []
}
```

`billing_branch_id` es opcional en API (si no va, se toma del almacén), **mándalo siempre** desde el modal. Si almacén ≠ sucursal o sucursal ≠ razón → **400**.

`pedimento_number` es opcional y **solo aplica si el proveedor es internacional** (`vendor.vendor_type === 'INTERNATIONAL'`). Si el proveedor es nacional y se envía pedimento → **400**. Ver `UI_PURCHASE_ORDER_PEDIMENTO.md`.

---

## 2. Listado

```
GET /api/tenant/purchase-orders
```

### Query params (ubicación)

| Parámetro | Default visual |
|-----------|----------------|
| `fiscal_configuration_id` | Todas las razones |
| `billing_branch_id` | Todas las sucursales |
| `warehouse_id` | Todos los almacenes |

**Todas = no enviar el param.** No mandar `"null"`.

Cascada de filtros igual que el modal: cambia razón → reset sucursal y almacén. Cambia sucursal → reset almacén. Catálogos: mismos GET de la sección 1. Filtro sucursal sin razón: `GET /api/tenant/billing/branches`. Filtro almacén sin sucursal: `GET /api/tenant/warehouses?status=active&limit=100`.

### Columnas

| Columna | Binding |
|---------|---------|
| Folio | `folio` |
| Proveedor | `vendor.name` / `vendor.company_name` |
| Razón social | `razon_social` |
| Sucursal | `sucursal` o `billing_branch.code` |
| Almacén | `warehouse.name` |
| Estado | `general_status` |
| Total | `requested_total` |
| Pago | `payment_status` |
| Fecha | `created_at` |

Si `sucursal` / `billing_branch` es `null`, mostrar `—`.

### Shape (campos de ubicación)

```json
{
  "id": "...",
  "folio": "ODC-000014",
  "razon_social": "Madereria Zona Norte",
  "sucursal": "SUCURSAL BUENOS AIRES",
  "fiscal_configuration_id": "...",
  "fiscal_configuration": {
    "id": "...",
    "razon_social": "Madereria Zona Norte",
    "rfc": "XXX010101XXX"
  },
  "billing_branch_id": "...",
  "billing_branch": {
    "id": "...",
    "code": "SUCURSAL BUENOS AIRES",
    "city": "Tijuana",
    "state": "Baja California"
  },
  "warehouse_id": "...",
  "warehouse": { "id": "...", "name": "Enrejado" }
}
```

---

## 3. Detalle OC

```
GET /api/tenant/purchase-orders/:id
```

Misma raíz del objeto (no hay `data.header` como en OV). Cards de ubicación:

| Card | Título UI | Texto | Id |
|------|-----------|-------|----|
| Razón social | Razón social | `razon_social` | `fiscal_configuration_id` |
| Sucursal | Sucursal | `sucursal` ?? `billing_branch.code` | `billing_branch_id` |
| Almacén | Almacén | `warehouse.name` | `warehouse_id` |

```ts
title: 'Razón social'
value: po.razon_social ?? po.fiscal_configuration?.razon_social ?? '—'
id: po.fiscal_configuration_id

title: 'Sucursal'
value: po.sucursal ?? po.billing_branch?.code ?? '—'
id: po.billing_branch_id
subtitle: [po.billing_branch?.city, po.billing_branch?.state].filter(Boolean).join(', ')

title: 'Almacén'
value: po.warehouse?.name ?? '—'
id: po.warehouse_id
```

No mostrar solo “Configuración fiscal” / “Almacén”. Las tres cards.

Proveedor internacional y pedimento: ver `UI_PURCHASE_ORDER_PEDIMENTO.md`. Badge en la card **Proveedor** si `is_international_vendor`. Campo **Pedimento** **arriba de FECHAS**.

---

## 4. Excel

Mismos filtros del listado (`fiscal_configuration_id`, `billing_branch_id`, `warehouse_id`). Columnas nuevas: **Razón social**, **Sucursal** (Almacén se queda). Ver `UI_PURCHASE_ORDER_EXPORT.md`.

---

## 5. Checklist Pollux

- [ ] Modal crear: Razón social → Sucursal → Almacén (cascada, no almacén suelto)
- [ ] POST manda `fiscal_configuration_id`, `billing_branch_id`, `warehouse_id`
- [ ] Listado: columnas Razón social + Sucursal + Almacén
- [ ] Filtros cascada razón / sucursal / almacén (vacío = no enviar param)
- [ ] Detalle: cards Razón social, Sucursal y Almacén
- [ ] Excel reutiliza esos filtros
