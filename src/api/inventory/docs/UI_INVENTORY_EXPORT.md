# UI — Exportar inventario a Excel

Guía para Pollux: botón **Descargar Excel** en las vistas de inventario (**Lotes** y **Totalizado**), con selector de tipo de reporte.

---

## Endpoints

| Tipo | Método | Ruta |
|------|--------|------|
| Por lote | `GET` | `/api/tenant/inventory/export/excel/batches` |
| Totalizado | `GET` | `/api/tenant/inventory/export/excel/summary` |

Ambos devuelven un archivo `.xlsx` (`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

### Por lote — mismos filtros que `GET /tenant/inventory/batches`

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `search` | string | No. lote, nombre o SKU de producto |
| `batch_number` | string | No. lote (parcial) |
| `product_id` | uuid | Producto |
| `fiscal_configuration_id` | uuid | Razón social. Requerido si se envía sucursal |
| `billing_branch_id` | uuid | Sucursal. Requiere razón social |
| `warehouse_id` | uuid | Almacén. Requiere razón social y sucursal |
| `purchase_order_batch_id` | uuid | Lote de orden de compra |
| `purchase_order_id` | uuid | Orden de compra |
| `created_from` | date (ISO) | Opcional |
| `created_to` | date (ISO) | Opcional |

Cascada igual que el listado: ver `UI_INVENTORY_LOCATION_FILTERS.md`. **No enviar** `warehouse_id` solo.

**No requiere rango de fechas.** Si no se envían filtros, exporta todos los lotes.

### Totalizado — mismos filtros que `GET /tenant/inventory/summary`

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `search` | string | Nombre o SKU de producto |
| `fiscal_configuration_id` | uuid | Razón social. Requerido si se envía sucursal |
| `billing_branch_id` | uuid | Sucursal. Requiere razón social |
| `warehouse_id` | uuid | Almacén. Requiere razón social y sucursal |
| `product_id` | uuid | Producto |
| `only_available` | boolean | Solo productos con existencia > 0 |

Ejemplo:

```
GET /api/tenant/inventory/export/excel/batches?fiscal_configuration_id=uuid&billing_branch_id=uuid
GET /api/tenant/inventory/export/excel/summary?fiscal_configuration_id=uuid&only_available=true
```

---

## Contenido del Excel

### Por lote (`inventario-lotes-YYYY-MM-DD.xlsx`)

Una fila por lote. Columnas: No. lote, Fecha creación, SKU, Producto, Razón social, Sucursal, Almacén, UOM, Cant. inicial, Cant. disponible, Folio OC, Etiqueta origen.

Estilo: título azul oscuro, encabezados azul (`#2E6B9E`), filas alternadas.

### Totalizado (`inventario-totalizado-YYYY-MM-DD.xlsx`)

Una fila por producto + almacén. Columnas: SKU, Producto, Razón social, Sucursal, Almacén, UOM, Cant. disponible, Cant. inicial, No. lotes, Precio sugerido.

Estilo: azul claro en encabezados (`#3A7CA5`).

---

## Dónde poner el botón

### Vista Lotes (`/inventory/batches` o pestaña Lotes)

```
┌──────────────────────────────────────────────────────────────┐
│ Inventario — Lotes                  [ Descargar Excel ▼ ]   │
├──────────────────────────────────────────────────────────────┤
│ [Búsqueda] [Razón social ▼] [Sucursal ▼] [Almacén ▼] [Desde] [Hasta] │
│ ...tabla de lotes...                                         │
└──────────────────────────────────────────────────────────────┘
```

### Vista Totalizado (`/inventory/summary` o pestaña Totalizado)

```
┌──────────────────────────────────────────────────────────────┐
│ Inventario — Totalizado             [ Descargar Excel ▼ ]   │
├──────────────────────────────────────────────────────────────┤
│ [Búsqueda] [Razón social ▼] [Sucursal ▼] [Almacén ▼] [☑ Solo con existencia] │
│ ...tabla totalizada...                                       │
└──────────────────────────────────────────────────────────────┘
```

Al pulsar **Descargar Excel** → abrir modal (no descargar directo).

**Recomendación:** en cada vista, pre-seleccionar el tipo de reporte que corresponde (Lotes → Por lote, Totalizado → Totalizado), pero permitir cambiar en el modal.

---

## Modal de exportación

Mismo diseño que órdenes de venta (ver `UI_SALES_ORDER_EXPORT.md`):

```
┌─────────────────────────────────────────┐
│  Descargar reporte Excel           ✕   │
├─────────────────────────────────────────┤
│  Tipo de reporte                      │
│  (•) Por lote — una fila por lote       │
│  ( ) Totalizado — por producto/almacén  │
│                                         │
│  Usará los filtros actuales del listado │
│  (búsqueda, razón social, sucursal, almacén, producto, fechas)  │
│                                         │
│              [ Cancelar ] [ Descargar ] │
└─────────────────────────────────────────┘
```

### Reglas UX

| Regla | Comportamiento |
|-------|----------------|
| Vista **Lotes** | Abrir modal con tipo **Por lote** pre-seleccionado |
| Vista **Totalizado** | Abrir modal con tipo **Totalizado** pre-seleccionado |
| Filtros del listado | Reutilizar los filtros activos de la vista actual |
| Sin fechas obligatorias | Ningún tipo requiere rango de fechas |
| Loading | Deshabilitar botón y mostrar spinner mientras descarga |
| Éxito | Cerrar modal y guardar archivo con nombre del header `Content-Disposition` o fallback local |

---

## Función Pollux — descarga con blob

```typescript
type InventoryExportType = 'batches' | 'summary';

interface InventoryBatchExportFilters {
  search?: string;
  batch_number?: string;
  product_id?: string;
  fiscal_configuration_id?: string;
  billing_branch_id?: string;
  warehouse_id?: string;
  purchase_order_batch_id?: string;
  purchase_order_id?: string;
  created_from?: string;
  created_to?: string;
}

interface InventorySummaryExportFilters {
  search?: string;
  fiscal_configuration_id?: string;
  billing_branch_id?: string;
  warehouse_id?: string;
  product_id?: string;
  only_available?: boolean;
}

function buildInventoryExportQuery(
  type: InventoryExportType,
  filters: InventoryBatchExportFilters | InventorySummaryExportFilters,
): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  return params;
}

async function downloadInventoryExcel(
  type: InventoryExportType,
  filters: InventoryBatchExportFilters | InventorySummaryExportFilters,
): Promise<void> {
  const params = buildInventoryExportQuery(type, filters);
  const path =
    type === 'batches'
      ? '/tenant/inventory/export/excel/batches'
      : '/tenant/inventory/export/excel/summary';

  const response = await api.get(`${path}?${params.toString()}`, {
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  const filename =
    parseFilenameFromDisposition(disposition) ??
    (type === 'batches'
      ? `inventario-lotes-${new Date().toISOString().slice(0, 10)}.xlsx`
      : `inventario-totalizado-${new Date().toISOString().slice(0, 10)}.xlsx`);

  triggerBrowserDownload(response.data, filename);
}
```

### Flujo en componente del listado de Lotes

```typescript
exportType: 'batches' | 'summary' = 'batches';
exporting = false;

openExportModal() {
  this.exportType = 'batches'; // o 'summary' si viene de vista Totalizado
}

async confirmExport() {
  this.exporting = true;
  try {
    if (this.exportType === 'batches') {
      const filters: InventoryBatchExportFilters = {
        search: this.listFilters.search,
        batch_number: this.listFilters.batch_number,
        product_id: this.listFilters.product_id,
        fiscal_configuration_id: this.listFilters.fiscal_configuration_id,
        billing_branch_id: this.listFilters.billing_branch_id,
        warehouse_id: this.listFilters.warehouse_id,
        purchase_order_batch_id: this.listFilters.purchase_order_batch_id,
        purchase_order_id: this.listFilters.purchase_order_id,
        created_from: this.listFilters.created_from,
        created_to: this.listFilters.created_to,
      };
      await downloadInventoryExcel('batches', filters);
    } else {
      const filters: InventorySummaryExportFilters = {
        search: this.listFilters.search,
        fiscal_configuration_id: this.listFilters.fiscal_configuration_id,
        billing_branch_id: this.listFilters.billing_branch_id,
        warehouse_id: this.listFilters.warehouse_id,
        product_id: this.listFilters.product_id,
        only_available: this.listFilters.only_available,
      };
      await downloadInventoryExcel('summary', filters);
    }
    toast.success('Reporte descargado');
    this.closeExportModal();
  } catch (err) {
    toast.error(err?.response?.data?.message ?? 'No se pudo generar el reporte');
  } finally {
    this.exporting = false;
  }
}
```

---

## Errores

| HTTP | Cuándo | Mensaje UI sugerido |
|------|--------|---------------------|
| 401 | Token inválido | Redirigir a login |
| 403 | Sin permiso `inventory:read` | "No tienes permiso para exportar" |

---

## Checklist Pollux

- [ ] Botón **Descargar Excel** en vista Lotes
- [ ] Botón **Descargar Excel** en vista Totalizado
- [ ] Modal con radio **Por lote** / **Totalizado** (mismo estilo que ventas)
- [ ] Pre-seleccionar tipo según la vista activa
- [ ] Reutilizar filtros activos del listado en la query
- [ ] Descarga vía `responseType: 'blob'`
- [ ] Nombre de archivo desde `Content-Disposition` o fallback
- [ ] Estados loading / error / éxito
