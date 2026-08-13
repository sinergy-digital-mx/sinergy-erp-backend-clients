# UI — Madereria Importacion Inventario

Módulo **solo para Madereria Zona Norte**. Vive en **Ajustes / Configuración** (`category: settings`).

Permiso menú: `madereria_inventory_import:ViewMenu`  
Permiso importar: `madereria_inventory_import:Create`

---

## Dónde va

Sidebar **SISTEMA → Configuración** (junto a Configuración Fiscal), ítem:

**Importación de inventario**

No mostrarlo si el módulo no viene en `GET` de módulos habilitados o no hay `ViewMenu`.

---

## Pantalla

Formulario simple (sin CRUD):

| Campo UI | Origen | Obligatorio |
|----------|--------|-------------|
| Razón social | `GET /api/tenant/fiscal-configurations?status=active&limit=100` | Sí |
| Sucursal | `GET /api/tenant/fiscal-configurations/:id/branches` | Sí |
| Almacén | `GET /api/tenant/warehouses?billing_branch_id=:branchId&status=active&limit=100` | Sí |
| Archivo | input file `.xls` / `.xlsx` | Sí |

Cascada: cambia razón → reset sucursal y almacén. Cambia sucursal → reset almacén.

Labels:
- Razón social: `razon_social` (`RFC` a la derecha)
- Sucursal: `name ?? code`
- Almacén: `name`

Botón **Importar**.

---

## Flujo con progreso (obligatorio)

La importación es **asíncrona**. No esperes el resumen en el POST.

### 1) Iniciar

```http
POST /api/tenant/madereria-inventory-import
Content-Type: multipart/form-data
```

| Parte | Valor |
|-------|--------|
| `file` | Excel |
| `fiscal_configuration_id` | uuid |
| `billing_branch_id` | uuid |
| `warehouse_id` | uuid |

Respuesta inmediata (~200):

```json
{
  "id": "uuid-job",
  "status": "queued",
  "total": 120,
  "processed": 0,
  "percent": 0,
  "current_sku": null,
  "message": "En cola…",
  "result": null,
  "error": null
}
```

Errores de validación (archivo, almacén, org) siguen siendo **400/403** en este POST.

### 2) Poll progreso

Cada **800 ms – 1 s** (mientras `status` sea `queued` o `processing`):

```http
GET /api/tenant/madereria-inventory-import/jobs/:jobId
```

```json
{
  "id": "uuid-job",
  "status": "processing",
  "total": 120,
  "processed": 37,
  "percent": 31,
  "current_sku": "BBOC",
  "message": "Importando 37 de 120",
  "result": null,
  "error": null
}
```

| `status` | UI |
|----------|-----|
| `queued` / `processing` | Barra + texto `message` (o `Importando {processed} de {total}`) |
| `completed` | Parar poll; mostrar resumen con `result` |
| `failed` | Parar poll; toast/error con `error` |

### UI durante import

- Deshabilitar botón **Importar** y el form.
- Mostrar bloque de progreso bajo el botón:
  - Progress bar con `percent`
  - Texto: **`Importando 37 de 120`** (`message` o armarlo con `processed`/`total`)
  - Opcional: SKU actual `current_sku`
- Al `completed`: habilitar de nuevo y mostrar resumen.

---

## Qué hace el backend

1. Busca producto por `CODIGO` (sku o sku externo, sin importar mayúsculas / espacios).
2. Si **no existe**, lo crea (`sku` = CODIGO, `name` = DESCRIPCION, UoM base Pieza).
3. Precio (`PRECIO1`): solo si el producto **no tiene** precio en la lista activa. IVA 16%.
4. Costo (`COSTO PROM`): proveedor **PROVEEDOR IMPORTACION** (se reutiliza; no duplica el proveedor). Si ya hay costo con ese proveedor, lo actualiza; si no, crea el registro. No toca costos de otros proveedores.
5. Cantidad > 0: crea lote en el almacén elegido (`batch_number` del generador de lotes).

Fila de encabezados Excel: `CODIGO`, `DESCRIPCION`, `ALTERNO`, `PRECIO1`, `COSTO PROM`, `CANTIDAD`.

---

## Respuesta final (`result` cuando `status === completed`)

```json
{
  "warehouse_id": "uuid",
  "warehouse_name": "Cortes y enchapado",
  "file_rows": 120,
  "products_created": [{ "sku": "BBOC", "name": "BASE BIS…", "row_number": 9 }],
  "prices_created": 3,
  "costs_created": 10,
  "costs_updated": 5,
  "batches_created": 118,
  "skipped": [{ "sku": "X", "row_number": 30, "reason": "Cantidad 0 o vacía, sin lote" }],
  "errors": []
}
```

Mostrar:
- Productos que **no estaban** en catálogo: lista `products_created` (SKU + nombre).
- Totales: lotes, precios nuevos, costos nuevos/actualizados.
- `errors` en rojo si hay.

Si falta prefijo de razón/sucursal/almacén, el API responde **400** con el mensaje de lotes (mismo que recepción OC).

403 si otra organización intenta usar el módulo: `Este módulo solo está disponible para Madereria Zona Norte`.

---

## Checklist Pollux

- [ ] Menú Ajustes: **Importación de inventario** (`madereria_inventory_import`)
- [ ] Selects: razón → sucursal → almacén
- [ ] File input `.xls,.xlsx`
- [ ] POST multipart → guardar `id` del job
- [ ] Poll `GET .../jobs/:jobId` hasta `completed` / `failed`
- [ ] Progress: “Importando X de Y” + barra `%`
- [ ] Resumen final desde `result`
