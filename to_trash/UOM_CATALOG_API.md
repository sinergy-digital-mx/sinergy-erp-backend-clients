# UoM Catalog API - Guía para UI

## Endpoints

### 1. Listar todas las UoMs del catálogo
```
GET /uom-catalog
```
Respuesta:
```json
[
  {
    "id": "uuid",
    "name": "Pieza",
    "description": "Unidad individual",
    "created_at": "2026-03-07T...",
    "updated_at": "2026-03-07T..."
  },
  {
    "id": "uuid",
    "name": "Caja",
    "description": "Caja completa",
    "created_at": "2026-03-07T...",
    "updated_at": "2026-03-07T..."
  }
]
```

### 2. Crear nueva UoM en catálogo
```
POST /uom-catalog
Content-Type: application/json

{
  "name": "Pieza",
  "description": "Unidad individual"
}
```

### 3. Obtener UoM específica
```
GET /uom-catalog/{id}
```

### 4. Actualizar UoM
```
PATCH /uom-catalog/{id}
Content-Type: application/json

{
  "name": "Pieza (actualizado)",
  "description": "Nueva descripción"
}
```

### 5. Eliminar UoM
```
DELETE /uom-catalog/{id}
```

---

## Flujo en UI

### Paso 1: Cargar catálogo de UoMs
```javascript
// Al abrir el formulario de producto
const uoms = await fetch('/uom-catalog').then(r => r.json());
// Mostrar en dropdown/select
```

### Paso 2: Asignar UoMs a producto
```javascript
// Cuando el usuario selecciona UoMs para un producto
POST /api/tenant/products/{productId}/uoms
{
  "uom_catalog_id": "uuid-del-catalogo",
  "name": "Pieza"  // Opcional, se puede dejar vacío
}
```

### Paso 3: Crear relaciones de conversión
```javascript
// Después de asignar UoMs
POST /api/tenant/products/{productId}/uom-relationships
{
  "source_uom_id": "uuid-caja",
  "target_uom_id": "uuid-pieza",
  "conversion_factor": 10  // 1 caja = 10 piezas
}
```

---

## Ejemplo completo

```javascript
// 1. Obtener catálogo
const catalog = await fetch('/uom-catalog').then(r => r.json());

// 2. Mostrar en UI (dropdown)
// <select>
//   <option value="uuid1">Pieza</option>
//   <option value="uuid2">Caja</option>
//   <option value="uuid3">Pallet</option>
// </select>

// 3. Usuario selecciona "Pieza" y "Caja"
// Asignar al producto
await fetch(`/api/tenant/products/${productId}/uoms`, {
  method: 'POST',
  body: JSON.stringify({
    uom_catalog_id: 'uuid-pieza'
  })
});

await fetch(`/api/tenant/products/${productId}/uoms`, {
  method: 'POST',
  body: JSON.stringify({
    uom_catalog_id: 'uuid-caja'
  })
});

// 4. Crear relación: 1 Caja = 10 Piezas
await fetch(`/api/tenant/products/${productId}/uom-relationships`, {
  method: 'POST',
  body: JSON.stringify({
    source_uom_id: 'uuid-caja',
    target_uom_id: 'uuid-pieza',
    conversion_factor: 10
  })
});
```

---

## Notas

- El catálogo es **global** (no tenant-based)
- Cada producto puede usar múltiples UoMs del catálogo
- Las relaciones de conversión varían por producto
- El `name` es el único campo requerido en el catálogo
