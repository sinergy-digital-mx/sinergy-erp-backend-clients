# UI — Madereria Importacion Inventario

Módulo **solo para Madereria Zona Norte**. Vive en **Ajustes / Configuración** (`category: settings`).

## 2026-10-17 — Unidad de medida

El Excel agrega la columna `UM` (entre pedimento y `PRECIO1`). El resto del archivo no cambia.

El backend junta los valores distintos (`PIE TABLA`, `JUEGO`, `PIEZA`, …) y los crea en el catálogo global de unidades (`uom_catalog`) si no existen. Ahí se eligen después en la configuración del producto. `PIEZA`, `PZA` y `PZ` son la misma unidad: **Pieza**.

En el resumen, `result.uoms_created` trae los nombres nuevos. Si viene vacío, todas ya estaban en el catálogo.

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

1. Busca producto por `CODIGO` (sku o sku externo, sin importar mayúsculas / espacios). El código viene con espacios a la izquierda en el reporte; se recortan.
2. Si **no existe**, lo crea (`sku` = CODIGO, `name` = DESCRIPCION, `sat_clave` = CLAVE SAT). La UoM base es la columna `UM`. Si `UM` viene vacía, usa **Pieza**.
3. Si **ya existe** y el archivo trae `CLAVE SAT`, actualiza `products.sat_clave` cuando cambia. Clave de 7 dígitos (ej. `1010101`) se guarda en 8 (`01010101`).
4. Precio (`PRECIO1`): solo si el producto **no tiene** precio en la lista activa. IVA 16%.
5. Costo (`COSTO PROM`): proveedor **PROVEEDOR IMPORTACION** (se reutiliza; no duplica el proveedor). Si ya hay costo con ese proveedor, lo actualiza; si no, crea el registro. No toca costos de otros proveedores.
6. Cantidad > 0: crea lote en el almacén elegido (`batch_number` del generador de lotes). El lote queda en la UM del renglón.
7. `PEDIMENTO/FECHA/ADUANA/PROVEEDOR`: cada línea de la celda es un pedimento. Se guardan todas en el lote (`pedimento_entries`). `pedimento_number` es el de fecha más reciente. El número completo queda `YY  AA  PPPP  NNNNNNN`. Si el reporte trae solo patente-consecutivo (`3610-4006189`), se guarda así. La cantidad del renglón no se parte entre pedimentos.
8. `UM`: se normaliza (`PIE TABLA` → `Pie Tabla`) y se busca en el catálogo sin distinguir mayúsculas. Si no está, se crea una sola vez por nombre. Un producto que solo tenía **Pieza** de una importación anterior pasa a la UM del archivo. Si el producto ya tiene otra unidad configurada, no se pisa la base: se agrega la del archivo para precio, costo y lote.

Reporte esperado: `REPORTE DE ARTICULOS POR INV PRECIO1/COSTO PROMEDIO -CLAVE SAT/PEDIMENTOS` (`.xls`).

Fila de encabezados: `CODIGO`, `DESCRIPCION`, `CLAVE SAT`, `PEDIMENTO/FECHA/ADUANA/PROVEEDOR`, `UM`, `PRECIO1`, `COSTO PROM`, `CANTIDAD`, `TOT COSTO`.

`TOT COSTO` no se importa (es cantidad × costo). `ALTERNO` sigue aceptándose si viene en un archivo viejo. El pie (`Cant. Arts:`, `PRECIOS Y COSTOS POR UNIDAD`) corta la lectura. Un nombre de producto que contenga la palabra TOTAL no corta el archivo.

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
  "sat_claves_saved": 40,
  "uoms_created": ["Pie Tabla", "Juego"],
  "skipped": [{ "sku": "X", "row_number": 30, "reason": "Cantidad 0 o vacía, sin lote" }],
  "errors": []
}
```

Mostrar:
- Productos que **no estaban** en catálogo: lista `products_created` (SKU + nombre).
- Totales: lotes, claves SAT guardadas, unidades nuevas (`uoms_created`), precios nuevos, costos nuevos/actualizados.
- Si `uoms_created` tiene nombres, listarlos. Son unidades que no estaban en el catálogo global.
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

