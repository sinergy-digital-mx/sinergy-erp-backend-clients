# UI — Importación masiva de costos y precios por proveedor

Contrato para Pollux. Catálogo de productos.

Un botón **Importar** junto a **Descargar catálogo** / **Nuevo producto**. Solo con `Product:Update` (o admin).

Actualiza el catálogo **actual**. **No** modifica OC ni OV ya creadas. Las nuevas OC toman el costo del proveedor; las nuevas OV toman el precio de la lista.

---

## Dónde

Toolbar del listado de Productos:

```
[Categorías] [Unidades] [Listas de precios]
[Descargar catálogo] [Importar]
[Nuevo producto]
```

Sin `Product:Update`: no muestres el botón.

---

## Modal

1. Combo **Proveedor** (búsqueda). Fuente: `GET /api/tenant/vendors?status=active&limit=100&search=`.
   Label: `name`. Valor: `id`.
2. Combo **Lista de precios**. Fuente: `GET /api/tenant/price-lists`. Label: `name`. Valor: `id`.
   Si hay lista default, selecciónala al abrir.
3. Al elegir proveedor y lista, llama preview y pinta: `Se actualizarán {product_count} productos ({row_count} renglones por UOM).`
4. Botón **Descargar productos de este proveedor**.
5. Zona de drop / file `.xlsx` + botón **Importar**.
6. Texto fijo: *Llena Nuevo costo y/o Nuevo precio en el mismo Excel. Vacío = no cambia esa columna. No afecta órdenes de compra ni de venta pasadas.*

```
GET /api/tenant/products/import/vendor-catalog/preview?vendor_id={uuid}&price_list_id={uuid}
GET /api/tenant/products/import/vendor-catalog/template?vendor_id={uuid}&price_list_id={uuid}
POST /api/tenant/products/import/vendor-catalog
Content-Type: multipart/form-data
  file: <xlsx>
  vendor_id: <uuid>
  price_list_id: <uuid>
```

Template (hoja **Catálogo**): SKU, Nombre, UOM, Moneda, Lista de precios, Activo, **Costo actual**, **Nuevo costo**, **Precio actual**, **Nuevo precio**. Amarillas y editables: Nuevo costo y Nuevo precio.

Si un producto del proveedor no tenía precio en esa lista, **Precio actual** va vacío. Llenar **Nuevo precio** lo crea (IVA/IEPS del costo de ese proveedor).

Los endpoints `vendor-costs` y `vendor-prices` siguen existiendo, pero la UI usa solo `vendor-catalog`.

---

## Pollux — copy-paste

```ts
async function previewVendorCatalog(vendorId: string, priceListId: string) {
  const { data } = await api.get('/tenant/products/import/vendor-catalog/preview', {
    params: { vendor_id: vendorId, price_list_id: priceListId },
  });
  return data as {
    vendor_id: string;
    vendor_name: string;
    price_list_id?: string;
    price_list_name?: string;
    product_count: number;
    row_count: number;
  };
}

async function downloadVendorCatalogTemplate(
  vendorId: string,
  priceListId: string,
): Promise<void> {
  const res = await api.get('/tenant/products/import/vendor-catalog/template', {
    params: { vendor_id: vendorId, price_list_id: priceListId },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `costos-precios-proveedor.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importVendorCatalog(vendorId: string, priceListId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  form.append('vendor_id', vendorId);
  form.append('price_list_id', priceListId);
  const { data } = await api.post('/tenant/products/import/vendor-catalog', form);
  return data as {
    updated: number;
    created: number;
    skipped: number;
    costs_updated: number;
    prices_updated: number;
    prices_created: number;
    errors: { row: number; sku: string; message: string }[];
  };
}
```

Descarga: `responseType: 'blob'`. Si el backend manda `Content-Disposition`, úsalo para el filename.

---

## Resultado del POST

```json
{
  "updated": 8,
  "created": 2,
  "skipped": 40,
  "costs_updated": 3,
  "prices_updated": 5,
  "prices_created": 2,
  "errors": [
    { "row": 8, "sku": "AJENO", "message": "El SKU no pertenece a este proveedor o la UOM no coincide." }
  ]
}
```

| Campo | Significado |
|-------|-------------|
| `costs_updated` | Costos cambiados |
| `prices_updated` | Precios existentes cambiados |
| `prices_created` | Precios nuevos en esa lista |
| `updated` | `costs_updated + prices_updated` |
| `created` | Igual a `prices_created` |
| `skipped` | Ambas columnas vacías o iguales al actual, sin error |
| `errors` | SKU ajeno, número inválido, archivo malo |

Toast: `{costs_updated} costos actualizados, {prices_updated} precios actualizados` (y `{prices_created} precios creados` si aplica), `{skipped} sin cambios`. Si hay `errors`, tabla fila / SKU / mensaje. No cierres el modal si hay errores.

---

## Excel (no lo armes en Pollux)

El backend ya lo genera. No reordenes columnas. La hoja **Instrucciones** se ignora al importar.

- **Nuevo costo** y **Nuevo precio** vacíos = no tocar esa columna.
- Puedes llenar una, la otra, o ambas en el mismo renglón.
- No cambies SKU ni UOM. Hay columnas ocultas `_cost_id` / `_price_id` para empatar.
- Costo: hasta 4 decimales. Precio: 2.
- Solo productos que **ya tienen costo** de ese proveedor. No crea productos ni asocia proveedores nuevos.

---

## Errores

| HTTP | Cuándo | UI |
|------|--------|-----|
| 400 | Sin productos de ese proveedor | “Este proveedor no tiene productos con costo…” |
| 400 | Archivo no `.xlsx` / sin encabezados | Mensaje del body |
| 404 | Proveedor o lista inexistente | “No encontrado” |
| 403 | Sin `Product:Update` | No muestres el botón |

---

## Checklist

- [ ] Un botón **Importar** en el listado, solo con `Product:Update`
- [ ] Modal: proveedor + lista → preview → descargar → subir un Excel
- [ ] Download con `blob`
- [ ] Import `FormData` (`file` + `vendor_id` + `price_list_id`)
- [ ] Resumen costos / precios / skipped / errors
- [ ] Copy: no afecta OC / OV pasadas
