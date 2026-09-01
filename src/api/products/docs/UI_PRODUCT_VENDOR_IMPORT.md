# UI — Importación masiva de costos y precios por proveedor

Contrato para Pollux. Catálogo de productos.

Dos botones junto a **Descargar catálogo** / **Nuevo producto**. Solo con `Product:Update` (o admin).

| Botón | Modal |
|-------|--------|
| **Importación de costos por proveedor** | Elige proveedor → descarga template → sube el Excel |
| **Importación de precios por proveedor** | Elige proveedor **y** lista de precios → descarga → sube |

Actualiza el catálogo **actual**. **No** modifica OC ni OV ya creadas. Las nuevas OC toman el costo del proveedor; las nuevas OV toman el precio de la lista.

---

## Dónde

Toolbar del listado de Productos:

```
[Categorías] [Unidades] [Listas de precios]
[Descargar catálogo] [Importación de costos por proveedor] [Importación de precios por proveedor]
[Nuevo producto]
```

Sin `Product:Update`: no muestres estos dos botones.

---

## Modal — Costos

1. Combo **Proveedor** (búsqueda). Fuente: `GET /api/tenant/vendors?status=active&limit=100&search=`.
   Label: `name`. Valor: `id`.
2. Al elegir proveedor, llama preview y pinta: `Se actualizarán {product_count} productos ({row_count} renglones por UOM).`
3. Botón **Descargar productos de este proveedor**.
4. Zona de drop / file `.xlsx` + botón **Importar costos**.
5. Texto fijo: *Solo cambia el costo actual del producto. No afecta órdenes de compra ni de venta pasadas.*

```
GET /api/tenant/products/import/vendor-costs/preview?vendor_id={uuid}
GET /api/tenant/products/import/vendor-costs/template?vendor_id={uuid}
POST /api/tenant/products/import/vendor-costs
Content-Type: multipart/form-data
  file: <xlsx>
  vendor_id: <uuid>
```

Template: SKU, Nombre, UOM, Moneda, Activo, **Costo actual**, **Nuevo costo** (amarillo, única editable).

---

## Modal — Precios

Igual que costos, más combo **Lista de precios**.

Fuente: `GET /api/tenant/price-lists`. Label: `name`. Valor: `id`.

```
GET /api/tenant/products/import/vendor-prices/preview?vendor_id={uuid}&price_list_id={uuid}
GET /api/tenant/products/import/vendor-prices/template?vendor_id={uuid}&price_list_id={uuid}
POST /api/tenant/products/import/vendor-prices
Content-Type: multipart/form-data
  file: <xlsx>
  vendor_id: <uuid>
  price_list_id: <uuid>
```

Template: SKU, Nombre, UOM, Lista de precios, Activo, **Precio actual**, **Nuevo precio**.

Si un producto del proveedor no tenía precio en esa lista, **Precio actual** va vacío. Llenar **Nuevo precio** lo crea (IVA/IEPS del costo de ese proveedor).

---

## Pollux — copy-paste

```ts
async function previewVendorCosts(vendorId: string) {
  const { data } = await api.get('/tenant/products/import/vendor-costs/preview', {
    params: { vendor_id: vendorId },
  });
  return data as {
    vendor_id: string;
    vendor_name: string;
    product_count: number;
    row_count: number;
  };
}

async function downloadVendorCostTemplate(vendorId: string): Promise<void> {
  const res = await api.get('/tenant/products/import/vendor-costs/template', {
    params: { vendor_id: vendorId },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `costos-proveedor.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importVendorCosts(vendorId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  form.append('vendor_id', vendorId);
  const { data } = await api.post('/tenant/products/import/vendor-costs', form);
  return data as {
    updated: number;
    created: number;
    skipped: number;
    errors: { row: number; sku: string; message: string }[];
  };
}

async function previewVendorPrices(vendorId: string, priceListId: string) {
  const { data } = await api.get('/tenant/products/import/vendor-prices/preview', {
    params: { vendor_id: vendorId, price_list_id: priceListId },
  });
  return data;
}

async function downloadVendorPriceTemplate(vendorId: string, priceListId: string): Promise<void> {
  const res = await api.get('/tenant/products/import/vendor-prices/template', {
    params: { vendor_id: vendorId, price_list_id: priceListId },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `precios-proveedor.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importVendorPrices(vendorId: string, priceListId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  form.append('vendor_id', vendorId);
  form.append('price_list_id', priceListId);
  const { data } = await api.post('/tenant/products/import/vendor-prices', form);
  return data;
}
```

Descarga: `responseType: 'blob'`. Si el backend manda `Content-Disposition`, úsalo para el filename.

---

## Resultado del POST

```json
{
  "updated": 12,
  "created": 0,
  "skipped": 40,
  "errors": [
    { "row": 8, "sku": "AJENO", "message": "El SKU no pertenece a este proveedor o la UOM no coincide." }
  ]
}
```

| Campo | Costos | Precios |
|-------|--------|---------|
| `updated` | Costos cambiados | Precios existentes cambiados |
| `created` | Siempre `0` | Precios nuevos en esa lista |
| `skipped` | **Nuevo costo/precio** vacío o igual al actual | Igual |
| `errors` | SKU ajeno, número inválido, archivo malo | Igual |

Toast: `{updated} actualizados, {skipped} sin cambios`. Si hay `errors`, tabla fila / SKU / mensaje. No cierres el modal si hay errores.

---

## Excel (no lo armes en Pollux)

El backend ya lo genera. No reordenes columnas. La hoja **Instrucciones** se ignora al importar.

- **Nuevo costo / Nuevo precio** vacíos = no tocar esa fila.
- No cambies SKU ni UOM. Hay columnas ocultas `_id` para empatar.
- Costo: hasta 4 decimales. Precio: 2.
- Solo productos que **ya tienen costo** de ese proveedor. No crea productos ni asocia proveedores nuevos.

---

## Errores

| HTTP | Cuándo | UI |
|------|--------|-----|
| 400 | Sin productos de ese proveedor | “Este proveedor no tiene productos con costo…” |
| 400 | Archivo no `.xlsx` / sin encabezados | Mensaje del body |
| 404 | Proveedor o lista inexistente | “No encontrado” |
| 403 | Sin `Product:Update` | No muestres los botones |

---

## Checklist

- [ ] Dos botones en el listado, solo con `Product:Update`
- [ ] Modal costos: proveedor → preview → descargar → subir
- [ ] Modal precios: proveedor + lista → preview → descargar → subir
- [ ] Download con `blob`
- [ ] Import `FormData` (`file` + ids)
- [ ] Resumen updated / skipped / errors
- [ ] Copy: no afecta OC / OV pasadas
