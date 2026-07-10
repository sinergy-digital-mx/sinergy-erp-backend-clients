# UI — Exportar clientes a Excel

Guía para Pollux: botón **Descargar Excel** en la vista listado de clientes, con modal de confirmación (mismo patrón que órdenes de venta).

---

## Endpoint

| Método | Ruta |
|--------|------|
| `GET` | `/api/tenant/customers/export/excel` |

Devuelve un archivo `.xlsx` (`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

### Filtros — mismos que `GET /tenant/customers`

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `search` | string | Nombre, email, teléfono, empresa, RFC, razón social, contratos, etc. |
| `status_id` | number | Estatus del cliente |
| `group_id` | string (uuid) | Grupo de clientes |

**No requiere rango de fechas.** Si no se envían filtros, exporta todos los clientes.

Ejemplo:

```
GET /api/tenant/customers/export/excel?search=acme&status_id=1&group_id=uuid-grupo
```

---

## Contenido del Excel

### Clientes (`clientes-YYYY-MM-DD.xlsx`)

Una fila por cliente. Columnas: ID, Nombre, Apellido, Empresa, Email, Teléfono, Estatus, Grupo, RFC, Razón social, Almacén, Días crédito, Monto crédito, Fecha creación.

Estilo: título ámbar oscuro, encabezados ámbar (`#C47B2B`), filas alternadas.

---

## Dónde poner el botón

Vista **listado de clientes** (junto a filtros existentes o en la barra de acciones):

```
┌──────────────────────────────────────────────────────────────┐
│ Clientes                            [ Descargar Excel ▼ ]   │
├──────────────────────────────────────────────────────────────┤
│ [Búsqueda] [Estatus ▼] [Grupo ▼]                            │
│ ...tabla...                                                  │
└──────────────────────────────────────────────────────────────┘
```

Al pulsar **Descargar Excel** → abrir modal (no descargar directo).

---

## Modal de exportación

Mismo diseño que órdenes de venta, sin selector de tipo (solo hay un reporte):

```
┌─────────────────────────────────────────┐
│  Descargar reporte Excel           ✕   │
├─────────────────────────────────────────┤
│  Se exportarán los clientes que         │
│  coincidan con los filtros actuales:    │
│                                         │
│  • Búsqueda: "acme"                     │
│  • Estatus: Activo                      │
│  • Grupo: Mayoristas                    │
│                                         │
│  (Si no hay filtros, se exportan todos) │
│                                         │
│              [ Cancelar ] [ Descargar ] │
└─────────────────────────────────────────┘
```

### Reglas UX

| Regla | Comportamiento |
|-------|----------------|
| Filtros del listado | Reutilizar `search`, `status_id`, `group_id` activos en pantalla |
| Resumen en modal | Mostrar filtros activos para que el usuario confirme qué se exportará |
| Loading | Deshabilitar botón y mostrar spinner mientras descarga |
| Éxito | Cerrar modal y guardar archivo con nombre del header `Content-Disposition` o fallback local |

---

## Función Pollux — descarga con blob

```typescript
interface CustomersExportFilters {
  search?: string;
  status_id?: number;
  group_id?: string;
}

function buildCustomersExportQuery(filters: CustomersExportFilters): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  return params;
}

async function downloadCustomersExcel(filters: CustomersExportFilters): Promise<void> {
  const params = buildCustomersExportQuery(filters);
  const response = await api.get(`/tenant/customers/export/excel?${params.toString()}`, {
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  const filename =
    parseFilenameFromDisposition(disposition) ??
    `clientes-${new Date().toISOString().slice(0, 10)}.xlsx`;

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
    const filters: CustomersExportFilters = {
      search: this.listFilters.search,
      status_id: this.listFilters.status_id,
      group_id: this.listFilters.group_id,
    };

    await downloadCustomersExcel(filters);
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
| 403 | Sin permiso `customers:Read` | "No tienes permiso para exportar" |

---

## Checklist Pollux

- [ ] Botón **Descargar Excel** en listado de clientes (mismo estilo que ventas)
- [ ] Modal de confirmación con resumen de filtros activos
- [ ] Reutilizar filtros del listado en la query
- [ ] Descarga vía `responseType: 'blob'`
- [ ] Nombre de archivo desde `Content-Disposition` o fallback
- [ ] Estados loading / error / éxito
