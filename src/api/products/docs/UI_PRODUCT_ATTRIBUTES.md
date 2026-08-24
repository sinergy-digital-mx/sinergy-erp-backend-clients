# UI — Atributos de producto (catálogo vs asignación)

Hay **dos capas**. Hoy el modal de Crear/Editar producto pinta el catálogo global; eso está mal. Cada producto debe guardar **sus** valores.

---

## Concepto

| Capa | Qué es | Dónde se edita |
|------|--------|----------------|
| **Catálogo** | Definiciones compartidas: “Calidad de madera”, valores posibles `CBC`, `FAS`… | Pantalla de catálogo / settings, **no** dentro de cada producto |
| **Asignación** | Qué valores tiene **este** producto | Modal Crear / Editar producto |

- Crear producto vacío → sección de atributos **vacía**.
- Quitar un chip en un producto **no** borra el valor del catálogo.
- Editar el nombre “Calidad de madera” en catálogo sí afecta a todos (es la definición).

---

## Catálogo (opciones para el selector)

| Método | Ruta | Permiso | Uso |
|--------|------|---------|-----|
| `GET` | `/api/tenant/products/attributes/options` | `Product:Read` | Dropdowns del modal. Solo activos, sin paginación |
| `GET` | `/api/tenant/products/attributes?include_values=true` | `Product:Read` | Admin del catálogo (paginado) |
| `POST` / `PATCH` / `DELETE` | `/api/tenant/products/attributes…` | Create/Update/Delete | CRUD del catálogo (pantalla aparte) |

```json
[
  {
    "id": "uuid-calidad",
    "name": "Calidad de madera",
    "values": [
      { "id": "uuid-cbc", "value": "CBC - Cabinet Color", "display_order": 0 }
    ]
  }
]
```

**No** uses `GET /products/attributes` para rellenar la sección del producto. Eso es el catálogo de la empresa.

---

## Asignación por producto

Base: `/api/tenant/products/:productId/attributes`

| Método | Ruta | Permiso | Uso |
|--------|------|---------|-----|
| `GET` | `.../attributes` | `Product:Read` | Chips de **este** producto. Crear nuevo → `[]` |
| `PUT` | `.../attributes` | `Product:Update` | Reemplaza el set (al guardar el modal) |
| `POST` | `.../attributes` | `Product:Update` | Agregar un valor |
| `DELETE` | `.../attributes/:assignmentId` | `Product:Update` | Quitar un valor de este producto |

### GET — respuesta

```json
[
  {
    "attribute_id": "uuid-calidad",
    "name": "Calidad de madera",
    "values": [
      {
        "assignment_id": "uuid-asig",
        "attribute_value_id": "uuid-cbc",
        "value": "CBC - Cabinet Color",
        "display_order": 0
      }
    ]
  }
]
```

Producto sin atributos → `[]`.

### PUT — body

```json
{ "attribute_value_ids": ["uuid-cbc", "uuid-8ft"] }
```

Vaciar: `{ "attribute_value_ids": [] }`. Respuesta: mismo shape que GET.

### POST — body

```json
{ "attribute_value_id": "uuid-cbc" }
```

409 si ya estaba asignado.

---

## Modal Crear / Editar producto

### Crear

1. `GET /tenant/products/attributes/options` → opciones del selector.
2. Sección **Atributos** inicia vacía. Sin lápiz/basura de catálogo.
3. Usuario elige atributo + valor → chip **local** (aún no hay `productId`).
4. `POST /tenant/products` → guardar producto.
5. `PUT /tenant/products/:id/attributes` con los `attribute_value_ids` elegidos.

### Editar

1. `GET .../attributes/options` (selector).
2. `GET /tenant/products/:id/attributes` (chips de este producto).
3. Agregar/quitar chips en UI.
4. Al guardar: `PUT .../attributes` con el set final. O `POST` / `DELETE` por chip.

### UI de la sección

```
Atributos personalizados              [ + Asignar ]
  Calidad de madera
    [ CBC - Cabinet Color  × ]
  Largo
    [ 8FT  × ]
```

| Control | Acción correcta |
|---------|-----------------|
| Chip × | `DELETE .../attributes/:assignmentId` (o quitar del PUT) |
| + Asignar | Selector de catálogo → `POST` o acumular para PUT |
| Lápiz / basura del **atributo** (Calidad de madera) | **Fuera del modal de producto.** Eso es CRUD de catálogo |

---

## Ejemplo Pollux

```ts
type CatalogAttribute = {
  id: string;
  name: string;
  values: { id: string; value: string; display_order: number }[];
};

type AssignedAttribute = {
  attribute_id: string;
  name: string;
  values: {
    assignment_id: string;
    attribute_value_id: string;
    value: string;
  }[];
};

async function loadProductAttributesForm(productId?: string) {
  const { data: catalog } = await api.get<CatalogAttribute[]>(
    '/tenant/products/attributes/options',
  );
  if (!productId) {
    return { catalog, assigned: [] as AssignedAttribute[] };
  }
  const { data: assigned } = await api.get<AssignedAttribute[]>(
    `/tenant/products/${productId}/attributes`,
  );
  return { catalog, assigned };
}

async function saveProductAttributes(productId: string, attributeValueIds: string[]) {
  await api.put(`/tenant/products/${productId}/attributes`, {
    attribute_value_ids: attributeValueIds,
  });
}
```

---

## Errores

| HTTP | Cuándo | Mensaje UI |
|------|--------|------------|
| 404 | Producto o valor inexistente | “Producto o valor no encontrado” |
| 409 | Valor ya asignado (POST) | “Este valor ya está en el producto” |
| 403 | Sin permiso | “No tienes permiso para editar atributos” |

---

## Checklist Pollux

- [ ] En **Crear producto**, atributos vacíos (no pintar el catálogo como chips)
- [ ] Opciones del selector = `GET .../attributes/options`
- [ ] Chips del producto = `GET .../:productId/attributes`
- [ ] Guardar = `PUT` con `attribute_value_ids`
- [ ] × del chip quita asignación, no borra el catálogo
- [ ] CRUD de “Calidad de madera” / valores (`PATCH`/`DELETE` de catálogo) en pantalla de catálogo, no en el modal de producto
