# UI — Clave catastral del lote

Contrato para Pollux: pintar y editar `cadastral_key` en el sistema de lotes (propiedades). Ya está en API; no hay endpoint nuevo.

El PUT sí lo guarda. Si el input queda vacío al reabrir, el front no está leyendo `cadastral_key` del GET.

---

## Campo

| UI | API | Tipo | Requerido | Máx. |
|----|-----|------|-----------|------|
| Clave catastral | `cadastral_key` | `string \| null` | No | 100 |

Key exacta: **`cadastral_key`**. No usar `clave_catastral`, `claveCatastral` ni `catastro`.

Placeholder: `Clave catastral`.

En **Crear / Editar lote**, junto a Manzana (`block`) y Número de lote (`lot_number`). También en detalle y, si cabe, una columna en el listado.

---

## GET — el lote ya trae el campo

```http
GET /api/tenant/properties/:id
GET /api/tenant/properties
GET /api/tenant/properties/by-code/:code
```

Detalle (`GET /:id`):

```json
{
  "id": "uuid",
  "code": "A-12",
  "block": "A",
  "lot_number": "12",
  "cadastral_key": "15-039-001-000-012",
  "name": "Lote A-12",
  "status": "disponible"
}
```

Lista: cada fila en `data[]` trae el mismo `cadastral_key`.

Contratos y formatos de reservación que anidan `property` también lo traen en `property.cadastral_key` (solo lectura ahí).

Si no hay valor: `cadastral_key` es `null` → mostrar `—`.

---

## Modal crear / editar — cómo pintar

No rellenar el input desde un objeto local recortado. Abrir modal → `GET /tenant/properties/:id` → asignar **todos** los campos del form, incluido `cadastral_key`.

```ts
const property = await api.get(`/tenant/properties/${id}`);

form.patchValue({
  code: property.code,
  block: property.block ?? '',
  lot_number: property.lot_number ?? '',
  cadastral_key: property.cadastral_key ?? '',
  name: property.name,
  // ...resto
});
```

Tras **Guardar**, el `PUT` responde el lote completo. Usar `response.cadastral_key` para el form y para refrescar la fila.

```ts
const saved = await api.put(`/tenant/properties/${id}`, payload);
form.patchValue({ cadastral_key: saved.cadastral_key ?? '' });
row.cadastral_key = saved.cadastral_key;
```

---

## Create / Update

```http
POST /api/tenant/properties
PUT  /api/tenant/properties/:id
```

```json
{
  "code": "A-12",
  "block": "A",
  "lot_number": "12",
  "cadastral_key": "15-039-001-000-012",
  "name": "Lote A-12",
  "group_id": "uuid",
  "total_area": 200,
  "measurement_unit_id": "uuid",
  "total_price": 850000
}
```

- No es único.
- Trim en backend. Vacío → `null` (o omitir la key al crear).
- Texto libre (guiones, números, letras). No validar formato municipal.

---

## Listado

| Pantalla | Qué hacer |
|----------|-----------|
| Tabla | Columna **Clave catastral** = `row.cadastral_key`. Si `null` / `''` → `—` |
| Búsqueda | `search` ya cubre `cadastral_key` (también código, manzana, número de lote). Sin query param extra |
| Contratos | `GET /api/tenant/contracts?search=` también busca por `property.cadastral_key` |
| Modal | Precargar con `property.cadastral_key` del GET `/:id` |
| Detalle | Campo de solo lectura o editable según permiso Update |

---

## Permisos

Sin cambio: `Property` + `Create` / `Update` / `Read`.

---

## Checklist Pollux

- [ ] Input **Clave catastral** en crear y editar lote (`cadastral_key`)
- [ ] Columna o dato visible en listado y detalle
- [ ] Abrir editar recarga el GET y pinta `cadastral_key`
- [ ] Guardar vacío limpia el valor (`null`)
- [ ] Búsqueda del listado de lotes encuentra por clave catastral (`search`)
- [ ] Búsqueda de contratos encuentra por clave catastral del lote (`search`, mismo param)
- [ ] No usar camelCase ni `clave_catastral` en el payload
