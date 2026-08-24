# UI — Descargar catálogo de productos

Botón **Descargar catálogo** en el listado de Productos (junto a Categorías / Unidades / Listas de precios / Nuevo producto). Solo si el usuario tiene `Product:Export` (o es admin).

---

## Endpoint

| Método | Ruta | Permiso |
|--------|------|---------|
| `GET` | `/api/tenant/products/export/excel` | `Product:Export` |

Archivo `.xlsx`. Filtros iguales al listado (`search`, `sku`, `category_id`, `subcategory_id`, `is_active`). Sin paginación: exporta todo lo filtrado.

```
GET /api/tenant/products/export/excel?search=titebond&is_active=true
```

---

## Excel

Una fila por producto + UOM.

| Columna | Origen |
|---------|--------|
| Nombre, SKU, SKU externo, Categoría, Subcategoría, UOM, UOM base, Activo | Producto |
| **Costo promedio** | Promedio de `cost` de todos los proveedores de esa UOM |
| **Precio promedio** | Promedio de precios de esa UOM en todas las listas |
| **Precio: {lista}** | Una columna por lista de precios (vacío si no hay precio) |

Sin costo o sin precio → celda vacía. Archivo: `catalogo-productos-YYYY-MM-DD.xlsx`.

---

## Pollux

1. Mostrar botón solo con `hasPermission(perms, 'Product', 'Export', { isAdmin: user.hasAdminRole })`.
2. Al clic → modal: “Se exportarán los productos de los filtros actuales”.
3. Descargar con `responseType: 'blob'`.
4. En **Roles**, el permiso aparece como **Descargar catálogo de productos**. Tras asignarlo, `POST /api/auth/refresh`.

```ts
async function downloadProductCatalog(filters: {
  search?: string;
  category_id?: string;
  subcategory_id?: string;
  is_active?: boolean;
}): Promise<void> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const res = await api.get(`/tenant/products/export/excel?${params}`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `catalogo-productos-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
```

| HTTP | UI |
|------|-----|
| 403 | “No tienes permiso para descargar el catálogo” |
| 401 | Login |
