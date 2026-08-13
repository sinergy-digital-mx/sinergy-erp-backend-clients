# UI — Exportar órdenes de venta a Excel

Guía para Pollux: botón **Descargar Excel** en la vista listado de órdenes de venta, con selector **Cabecera** / **Detalle**.

---

## Endpoints

| Tipo | Método | Ruta |
|------|--------|------|
| Cabeceras | `GET` | `/api/tenant/sales-orders/export/excel/headers` |
| Detalle (líneas) | `GET` | `/api/tenant/sales-orders/export/excel/details` |

Ambos devuelven un archivo `.xlsx` (`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

### Cabeceras — filtros opcionales

Mismos query params que el listado (sin paginación):

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `search` | string | Folio, cliente, SKU (en detalle) |
| `general_status` | enum | `Creada`, `Surtida`, `Cancelada`, `En cola` |
| `payment_status` | enum | `Pendiente`, `Pagado` |
| `sales_order_type` | enum | `POS`, `MANUAL` |
| `fiscal_configuration_id` | uuid | Razón social. Omitir o null = todas |
| `billing_branch_id` | uuid | Sucursal. Omitir o null = todas |
| `customer_id` | number | Cliente |
| `created_from` | date (ISO) | Opcional |
| `created_to` | date (ISO) | Opcional |

**No requiere rango de fechas.** Si no se envían filtros, exporta todas las órdenes del cliente.

### Detalle — rango de fechas obligatorio

Además de los filtros anteriores, **obligatorio**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `created_from` | date (ISO) | Inicio del rango (fecha de creación de la orden) |
| `created_to` | date (ISO) | Fin del rango (inclusive, hasta 23:59:59) |

Si faltan fechas o `created_from > created_to` → **400** con mensaje del backend.

Ejemplo:

```
GET /api/tenant/sales-orders/export/excel/details?created_from=2026-06-01&created_to=2026-06-30&general_status=Surtida
```

---

## Contenido del Excel

### Cabeceras (`ventas-cabeceras-YYYY-MM-DD.xlsx`)

Columnas: Folio, Fecha creación, Tipo, Estado, Pago, Cliente, Razón social, Sucursal, Entrega esperada, Subtotal, Descuento, IVA, IEPS, Total, Vendedor, Notas.

Estilo: título verde oscuro, encabezados verde (`#1B7F5E`), filas alternadas.

### Detalle (`ventas-detalle-YYYY-MM-DD_YYYY-MM-DD.xlsx`)

Una fila por línea de producto. Columnas: Folio orden, Fecha orden, Estado orden, Cliente, Razón social, Sucursal, SKU, Producto, UOM, Cantidad, Precio unit., Desc. %, Desc. unit., Descuento, IVA %, Subtotal línea, Total línea.

Estilo: verde más claro en encabezados (`#2E8B57`).

---

## Dónde poner el botón

Vista **listado de órdenes de venta** (junto a filtros existentes o en la barra de acciones):

```
┌──────────────────────────────────────────────────────────────┐
│ Órdenes de venta                    [ Descargar Excel ▼ ]   │
├──────────────────────────────────────────────────────────────┤
│ [Búsqueda] [Estado ▼] [Pago ▼] [Razón social ▼] [Sucursal ▼] │
│ ...tabla...                                                  │
└──────────────────────────────────────────────────────────────┘
```

Al pulsar **Descargar Excel** → abrir modal (no descargar directo).

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
│  (estado, pago, razón social, sucursal, etc.)    │
│                                         │
│              [ Cancelar ] [ Descargar ] │
└─────────────────────────────────────────┘
```

### Reglas UX

| Regla | Comportamiento |
|-------|----------------|
| Tipo **Cabecera** | Ocultar o deshabilitar fechas obligatorias; opcionalmente pre-rellenar con filtros del listado |
| Tipo **Detalle** | Mostrar fechas **obligatorias**; botón Descargar deshabilitado hasta que ambas tengan valor |
| Filtros del listado | Reutilizar `search`, `general_status`, `payment_status`, `sales_order_type`, `fiscal_configuration_id`, `billing_branch_id`, `customer_id` y fechas si ya están en pantalla |
| Cabecera sin fechas | Permitido — exporta todo lo que coincida con los demás filtros |
| Loading | Deshabilitar botón y mostrar spinner mientras descarga |
| Éxito | Cerrar modal y guardar archivo con nombre del header `Content-Disposition` o fallback local |

---

## Función Pollux — descarga con blob

```typescript
type SalesOrderExportType = 'headers' | 'details';

interface SalesOrderExportFilters {
  search?: string;
  general_status?: string;
  payment_status?: string;
  sales_order_type?: 'POS' | 'MANUAL';
  fiscal_configuration_id?: string | null;
  billing_branch_id?: string | null;
  customer_id?: number;
  created_from?: string;
  created_to?: string;
}

function buildSalesOrderExportQuery(
  type: SalesOrderExportType,
  filters: SalesOrderExportFilters,
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

async function downloadSalesOrdersExcel(
  type: SalesOrderExportType,
  filters: SalesOrderExportFilters,
): Promise<void> {
  const params = buildSalesOrderExportQuery(type, filters);
  const path =
    type === 'headers'
      ? '/tenant/sales-orders/export/excel/headers'
      : '/tenant/sales-orders/export/excel/details';

  const response = await api.get(`${path}?${params.toString()}`, {
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  const filename =
    parseFilenameFromDisposition(disposition) ??
    (type === 'headers'
      ? `ventas-cabeceras-${new Date().toISOString().slice(0, 10)}.xlsx`
      : `ventas-detalle-${filters.created_from}_${filters.created_to}.xlsx`);

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

// Al abrir modal desde listado
openExportModal() {
  this.exportType = 'headers';
  // Pre-cargar fechas del filtro del listado si existen
  this.exportFrom = this.listFilters.created_from ?? '';
  this.exportTo = this.listFilters.created_to ?? '';
}

get canDownloadDetail(): boolean {
  return Boolean(this.exportFrom && this.exportTo);
}

get canDownload(): boolean {
  return this.exportType === 'headers' || this.canDownloadDetail;
}

async confirmExport() {
  if (!this.canDownload) return;

  this.exporting = true;
  try {
    const filters: SalesOrderExportFilters = {
      search: this.listFilters.search,
      general_status: this.listFilters.general_status,
      payment_status: this.listFilters.payment_status,
      sales_order_type: this.listFilters.sales_order_type,
      fiscal_configuration_id: this.listFilters.fiscal_configuration_id,
      billing_branch_id: this.listFilters.billing_branch_id,
      customer_id: this.listFilters.customer_id,
    };

    if (this.exportType === 'details') {
      filters.created_from = this.exportFrom;
      filters.created_to = this.exportTo;
    } else {
      // Cabecera: fechas opcionales desde filtros del listado
      if (this.listFilters.created_from) filters.created_from = this.listFilters.created_from;
      if (this.listFilters.created_to) filters.created_to = this.listFilters.created_to;
    }

    await downloadSalesOrdersExcel(this.exportType, filters);
    toast.success('Reporte descargado');
    this.closeExportModal();
  } catch (err) {
    const msg =
      err?.response?.data?.message ??
      err?.message ??
      'No se pudo generar el reporte';
    toast.error(msg);
  } finally {
    this.exporting = false;
  }
}
```

---

## Errores

| HTTP | Cuándo | Mensaje UI sugerido |
|------|--------|---------------------|
| 400 | Detalle sin fechas (validación Nest) | "Indica fecha desde y hasta" |
| 400 | `created_from > created_to` | "La fecha inicial debe ser anterior o igual a la final" |
| 401 | Token inválido | Redirigir a login |
| 403 | Sin permiso al módulo ventas | "No tienes permiso para exportar" |

---

## Checklist Pollux

- [ ] Botón **Descargar Excel** en listado de órdenes de venta
- [ ] Modal con radio **Cabecera** / **Detalle**
- [ ] Fechas obligatorias solo en modo **Detalle**
- [ ] Reutilizar filtros activos del listado en la query
- [ ] Descarga vía `responseType: 'blob'`
- [ ] Nombre de archivo desde `Content-Disposition` o fallback
- [ ] Estados loading / error / éxito
