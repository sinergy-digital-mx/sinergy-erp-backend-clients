# UI — Exportar órdenes de compra a Excel

Guía para Pollux: botón **Descargar Excel** en la vista listado de órdenes de compra, con selector **Cabecera** / **Detalle**.

---

## Endpoints

| Tipo | Método | Ruta |
|------|--------|------|
| Cabeceras | `GET` | `/api/tenant/purchase-orders/export/excel/headers` |
| Detalle (líneas) | `GET` | `/api/tenant/purchase-orders/export/excel/details` |

Ambos devuelven un archivo `.xlsx` (`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

### Cabeceras — filtros opcionales

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `search` | string | Folio o nombre de proveedor |
| `general_status` | enum | `Creada`, `Recibida`, `Cancelada` |
| `payment_status` | enum | `Pendiente`, `Pagado` |
| `vendor_id` | uuid | Proveedor |
| `fiscal_configuration_id` | uuid | Razón social |
| `billing_branch_id` | uuid | Sucursal |
| `warehouse_id` | uuid | Almacén |
| `created_from` | date (ISO) | Opcional |
| `created_to` | date (ISO) | Opcional |

**No requiere rango de fechas.**

### Detalle — rango de fechas obligatorio

Además de los filtros anteriores, **obligatorio**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `created_from` | date (ISO) | Inicio del rango (fecha de creación de la orden) |
| `created_to` | date (ISO) | Fin del rango (inclusive, hasta 23:59:59) |

Si faltan fechas o `created_from > created_to` → **400**.

Ejemplo:

```
GET /api/tenant/purchase-orders/export/excel/details?created_from=2026-06-01&created_to=2026-06-30&vendor_id=uuid-proveedor
```

---

## Contenido del Excel

### Cabeceras (`compras-cabeceras-YYYY-MM-DD.xlsx`)

Columnas: Folio, Fecha creación, Proveedor, Internacional, Pedimento, Razón social, Sucursal, Almacén, Estado, Pago, Moneda, Entrega esperada, Subtotal sol., IVA sol., IEPS sol., Total sol., Subtotal rec., Total rec., Notas.

Estilo: título morado oscuro, encabezados morado (`#5B4B8A`), filas alternadas.

### Detalle (`compras-detalle-YYYY-MM-DD_YYYY-MM-DD.xlsx`)

Una fila por línea de producto. Columnas: Folio orden, Fecha orden, Estado orden, Proveedor, Razón social, Sucursal, Almacén, SKU, Producto, UOM, Cantidad, Total unit., IVA %, IEPS %, Subtotal línea.

Estilo: morado claro en encabezados (`#6A5ACD`).

---

## Dónde poner el botón

Vista **listado de órdenes de compra**:

```
┌──────────────────────────────────────────────────────────────┐
│ Órdenes de compra                   [ Descargar Excel ▼ ]   │
├──────────────────────────────────────────────────────────────┤
│ [Búsqueda] [Estado ▼] [Pago ▼] [Proveedor ▼] [Desde][Hasta]│
│ ...tabla...                                                  │
└──────────────────────────────────────────────────────────────┘
```

Al pulsar **Descargar Excel** → abrir modal.

---

## Modal de exportación

```
┌─────────────────────────────────────────┐
│  Descargar reporte Excel           ✕   │
├─────────────────────────────────────────┤
│  Tipo de reporte                      │
│  ( ) Cabecera — una fila por orden      │
│  (•) Detalle — una fila por línea       │
│                                         │
│  ┌─ Solo visible si tipo = Detalle ─┐  │
│  │ Desde *        Hasta *            │  │
│  │ [2026-06-01]   [2026-06-30]       │  │
│  │ El detalle requiere rango de      │  │
│  │ fechas por volumen de registros.  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Usará los filtros actuales del listado │
│                                         │
│              [ Cancelar ] [ Descargar ] │
└─────────────────────────────────────────┘
```

### Reglas UX

| Regla | Comportamiento |
|-------|----------------|
| Tipo **Cabecera** | Fechas opcionales (heredar del listado si existen) |
| Tipo **Detalle** | Fechas **obligatorias**; botón Descargar deshabilitado sin ambas |
| Filtros del listado | `search`, `general_status`, `payment_status`, `vendor_id`, `fiscal_configuration_id`, `billing_branch_id`, `warehouse_id`, fechas |
| Loading | Spinner + botón deshabilitado durante la descarga |

---

## Función Pollux — descarga con blob

```typescript
type PurchaseOrderExportType = 'headers' | 'details';

interface PurchaseOrderExportFilters {
  search?: string;
  general_status?: string;
  payment_status?: string;
  vendor_id?: string;
  fiscal_configuration_id?: string;
  billing_branch_id?: string;
  warehouse_id?: string;
  created_from?: string;
  created_to?: string;
}

function buildPurchaseOrderExportQuery(
  type: PurchaseOrderExportType,
  filters: PurchaseOrderExportFilters,
): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  if (type === 'details') {
    if (!filters.created_from || !filters.created_to) {
      throw new Error('Selecciona fecha desde y hasta para exportar el detalle.');
    }
  }

  return params;
}

async function downloadPurchaseOrdersExcel(
  type: PurchaseOrderExportType,
  filters: PurchaseOrderExportFilters,
): Promise<void> {
  const params = buildPurchaseOrderExportQuery(type, filters);
  const path =
    type === 'headers'
      ? '/tenant/purchase-orders/export/excel/headers'
      : '/tenant/purchase-orders/export/excel/details';

  const response = await api.get(`${path}?${params.toString()}`, {
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  const filename =
    parseFilenameFromDisposition(disposition) ??
    (type === 'headers'
      ? `compras-cabeceras-${new Date().toISOString().slice(0, 10)}.xlsx`
      : `compras-detalle-${filters.created_from}_${filters.created_to}.xlsx`);

  triggerBrowserDownload(response.data, filename);
}

function parseFilenameFromDisposition(header?: string): string | null {
  if (!header) return null;
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1] ?? null;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
```

### Flujo en componente del listado

```typescript
exportType: 'headers' | 'details' = 'headers';
exportFrom = '';
exportTo = '';
exporting = false;

openExportModal() {
  this.exportType = 'headers';
  this.exportFrom = this.listFilters.created_from ?? '';
  this.exportTo = this.listFilters.created_to ?? '';
}

get canDownload(): boolean {
  return this.exportType === 'headers' || Boolean(this.exportFrom && this.exportTo);
}

async confirmExport() {
  if (!this.canDownload) return;

  this.exporting = true;
  try {
    const filters: PurchaseOrderExportFilters = {
      search: this.listFilters.search,
      general_status: this.listFilters.general_status,
      payment_status: this.listFilters.payment_status,
      vendor_id: this.listFilters.vendor_id,
      fiscal_configuration_id: this.listFilters.fiscal_configuration_id || undefined,
      billing_branch_id: this.listFilters.billing_branch_id || undefined,
      warehouse_id: this.listFilters.warehouse_id || undefined,
    };

    if (this.exportType === 'details') {
      filters.created_from = this.exportFrom;
      filters.created_to = this.exportTo;
    } else {
      if (this.listFilters.created_from) filters.created_from = this.listFilters.created_from;
      if (this.listFilters.created_to) filters.created_to = this.listFilters.created_to;
    }

    await downloadPurchaseOrdersExcel(this.exportType, filters);
    toast.success('Reporte descargado');
    this.closeExportModal();
  } catch (err) {
    toast.error(err?.response?.data?.message ?? err?.message ?? 'No se pudo generar el reporte');
  } finally {
    this.exporting = false;
  }
}
```

---

## Errores

| HTTP | Cuándo | Mensaje UI sugerido |
|------|--------|---------------------|
| 400 | Detalle sin fechas | "Indica fecha desde y hasta" |
| 400 | Rango inválido | "La fecha inicial debe ser anterior o igual a la final" |
| 401 | Token inválido | Redirigir a login |
| 403 | Sin permiso al módulo compras | "No tienes permiso para exportar" |

---

## Checklist Pollux

- [ ] Botón **Descargar Excel** en listado de órdenes de compra
- [ ] Modal con radio **Cabecera** / **Detalle**
- [ ] Fechas obligatorias solo en modo **Detalle**
- [ ] Reutilizar filtros activos del listado
- [ ] Descarga vía `responseType: 'blob'`
- [ ] Nombre de archivo desde `Content-Disposition` o fallback
- [ ] Estados loading / error / éxito
