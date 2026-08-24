# UI — Exportar proveedores a Excel

Guía para Pollux: botón **Descargar Excel** en la vista listado de proveedores, con modal de confirmación (mismo patrón que clientes).

---

## Endpoint

| Método | Ruta | Permiso |
|--------|------|---------|
| `GET` | `/api/tenant/vendors/export/excel` | `vendors:Read` |

Devuelve un archivo `.xlsx` (`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

### Filtros — mismos que `GET /tenant/vendors`

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `search` | string | Nombre, empresa, RFC, ID fiscal, nombre legal |
| `status` | enum | `active` / `inactive` |
| `vendor_type` | enum | `NATIONAL` / `INTERNATIONAL` |
| `state` | string | Estado (ubicación) |
| `country` | string | País |

**No requiere rango de fechas.** Si no se envían filtros, exporta todos los proveedores.

```
GET /api/tenant/vendors/export/excel?search=acme&status=active&vendor_type=NATIONAL
```

---

## Contenido del Excel

### Proveedores (`proveedores-YYYY-MM-DD.xlsx`)

Una fila por proveedor. Columnas: Código, Nombre, Empresa, Tipo, Estatus, RFC, Razón social, Tipo persona, ID fiscal, Nombre legal, Calle, Ciudad, Estado, CP, País, Banco, Titular, Cuenta, CLABE, SWIFT, IBAN, Moneda banco, Días crédito, Límite crédito, Fecha creación.

Estilo: título teal oscuro, encabezados teal (`#0D7377`), filas alternadas.

---

## Dónde poner el botón

Vista **listado de proveedores** (junto a filtros existentes o en la barra de acciones):

```
┌──────────────────────────────────────────────────────────────┐
│ Proveedores                         [ Descargar Excel ]     │
├──────────────────────────────────────────────────────────────┤
│ [Búsqueda] [Estatus ▼] [Tipo ▼]                             │
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
│  Se exportarán los proveedores que      │
│  coincidan con los filtros actuales:    │
│                                         │
│  • Búsqueda: "acme"                     │
│  • Estatus: Activo                      │
│  • Tipo: Nacional                       │
│                                         │
│  (Si no hay filtros, se exportan todos) │
│                                         │
│              [ Cancelar ] [ Descargar ] │
└─────────────────────────────────────────┘
```

### Reglas UX

| Regla | Comportamiento |
|-------|----------------|
| Filtros del listado | Reutilizar `search`, `status`, `vendor_type`, `state`, `country` activos en pantalla |
| Resumen en modal | Mostrar filtros activos para que el usuario confirme qué se exportará |
| Loading | Deshabilitar botón y mostrar spinner mientras descarga |
| Éxito | Cerrar modal y guardar archivo con nombre del header `Content-Disposition` o fallback local |

---

## Función Pollux — descarga con blob

```typescript
interface VendorsExportFilters {
  search?: string;
  status?: 'active' | 'inactive';
  vendor_type?: 'NATIONAL' | 'INTERNATIONAL';
  state?: string;
  country?: string;
}

function buildVendorsExportQuery(filters: VendorsExportFilters): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  return params;
}

async function downloadVendorsExcel(filters: VendorsExportFilters): Promise<void> {
  const params = buildVendorsExportQuery(filters);
  const response = await api.get(`/tenant/vendors/export/excel?${params.toString()}`, {
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  const filename =
    parseFilenameFromDisposition(disposition) ??
    `proveedores-${new Date().toISOString().slice(0, 10)}.xlsx`;

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
exporting = false;

openExportModal() {
  // Mostrar resumen de filtros activos
}

async confirmExport() {
  this.exporting = true;
  try {
    const filters: VendorsExportFilters = {
      search: this.listFilters.search,
      status: this.listFilters.status,
      vendor_type: this.listFilters.vendor_type,
      state: this.listFilters.state,
      country: this.listFilters.country,
    };

    await downloadVendorsExcel(filters);
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
| 401 | Token inválido | Redirigir a login |
| 403 | Sin permiso `vendors:Read` | "No tienes permiso para exportar" |

---

## Checklist Pollux

- [ ] Botón **Descargar Excel** en listado de proveedores (mismo estilo que clientes / compras)
- [ ] Modal de confirmación con resumen de filtros activos
- [ ] Reutilizar filtros del listado en la query
- [ ] Descarga vía `responseType: 'blob'`
- [ ] Nombre de archivo desde `Content-Disposition` o fallback
- [ ] Estados loading / error / éxito
