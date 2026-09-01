# UI — Editar TAG y MEDIDA (detalle de lote)

Contrato para Pollux. Tab **General**.

**ALMACÉN ya tiene lápiz.** TAG y MEDIDA **no**. Hay que poner el **mismo lápiz morado** en esas dos cards y llamar al PATCH. El backend ya existe.

El lote de la captura (`MZN-CTR-BDG-00001`, tag `IMPORTACION`, medida `—`) **debe** mostrar lápiz en TAG y en MEDIDA.

---

## Qué falta en Pollux (hoy)

| Card | Hoy | Debe |
|------|-----|------|
| ALMACÉN | Lápiz → transferencia | Ya está. No toques. |
| TAG | Solo texto (`IMPORTACION`) | **Lápiz** → input → `PATCH` |
| MEDIDA | Solo `—` | **Lápiz** → tamaño + unidad → `PATCH` |

No hay otro endpoint. No edites `warehouse_id`. No abras el modal de transferencia para tag/medida.

---

## Fuente de verdad

El detalle **ya trae** los flags. Recarga el lote (`GET /api/tenant/inventory/batches/:id`) y úsalos. No inventes reglas.

```ts
const lote = await api.get(`/tenant/inventory/batches/${id}`);

// Cards
lote.source_tag_identifier; // "IMPORTACION" | null  → pintar o "—"
lote.measure_label;         // "8 Foot" | null       → pintar o "—"

// Lápices (AND con permiso Inventory:Write)
lote.can_edit_tag;      // siempre true
lote.can_edit_measure;  // true solo si measure === null (este lote: true)
```

En el lote de la captura: `can_edit_tag === true` y `can_edit_measure === true`. Si no ves lápiz, Pollux no está leyendo estos flags.

---

## Lápiz (igual que ALMACÉN)

Mismo icono, misma esquina superior derecha de la card.

```
┌─ TAG ────────────── [✎] ─┐     ┌─ MEDIDA ────────── [✎] ─┐
│ IMPORTACION              │     │ —                       │
└──────────────────────────┘     └─────────────────────────┘
```

| Card | Mostrar lápiz si |
|------|------------------|
| TAG | `can_edit_tag && hasPermission('Inventory', 'Write')` |
| MEDIDA | `can_edit_measure && hasPermission('Inventory', 'Write')` |

Sin `Write`: card de solo lectura (como PRODUCTO).  
`can_edit_measure === false` (ya hay `8 Foot`): **sin** lápiz. No se cambia ni se borra.

Click del lápiz: popover / mini-modal **en esa card**. No navegues.

---

## TAG — flujo

1. Click lápiz.
2. Input texto, valor inicial = `source_tag_identifier ?? ''`.
3. Guardar → PATCH. Cancelar cierra.

```http
PATCH /api/tenant/inventory/batches/{id}
Content-Type: application/json
Authorization: Bearer {token}

{ "source_tag_identifier": "648664" }
```

Borrar el tag (queda `—`):

```json
{ "source_tag_identifier": "" }
```

o `"source_tag_identifier": null`.

4. Respuesta = mismo JSON que el GET. Sustituye el lote en estado.
5. Pintar `data.source_tag_identifier ?? '—'`.

Max 100 caracteres. Solo manda `source_tag_identifier` (no mezcles medida si no la editaste).

---

## MEDIDA — flujo

Solo si `can_edit_measure === true` (en la captura: sí, porque es `—`).

1. Click lápiz.
2. Formulario **vacío** (nunca `0`, nunca prellenar PT/Pieza del lote):

```
Tamaño   [        ]     Unidad   [ Elegir unidad ▼ ]
                         Foot
                         PIES
                         Pie
```

Unidades: `GET /api/uom-catalog?limit=200` → `data[].id` + `data[].name`.

**Prohibido** usar `lote.uom_id` / `lote.uom_name` (eso es Pieza / PT de inventario, no el tamaño).

3. Guardar disabled hasta tener número > 0 **y** unidad.
4. PATCH:

```http
PATCH /api/tenant/inventory/batches/{id}
Content-Type: application/json

{
  "measure": 8,
  "measure_uom_id": "uuid-del-catalogo-foot"
}
```

`measure` es número (8, 12, 8.5). `measure_uom_id` es UUID del catálogo.

5. Pintar **`data.measure_label`** (`8 Foot`). Nunca `8` + `uom_name`.
6. `data.can_edit_measure` pasa a `false` → **quita el lápiz**.

`400` si ya tenía medida: *La medida de este lote ya está definida y no se puede cambiar*.  
`400` sin unidad: *Indica la unidad del tamaño (Foot, PIES, …). No uses la unidad de la orden de compra*.

---

## Copy-paste Pollux

```ts
async saveTag(batchId: string, tag: string | null) {
  const { data } = await api.patch(`/tenant/inventory/batches/${batchId}`, {
    source_tag_identifier: tag?.trim() ? tag.trim() : '',
  });
  this.batch = data; // recargar cards
}

async saveMeasure(batchId: string, measure: number, measureUomId: string) {
  const { data } = await api.patch(`/tenant/inventory/batches/${batchId}`, {
    measure,
    measure_uom_id: measureUomId,
  });
  this.batch = data;
}
```

No hace falta un GET extra después del PATCH.

---

## ALMACÉN (no cambiar)

Sigue con transferencia. Ver `UI_INVENTORY_TRANSFERS.md`.  
`PATCH` **no** acepta `warehouse_id`.

---

## Checklist

- [ ] Card TAG: lápiz morado (mismo que ALMACÉN) si `Write`
- [ ] Card MEDIDA: lápiz morado si `can_edit_measure && Write`
- [ ] TAG → `PATCH` `{ source_tag_identifier }`
- [ ] MEDIDA → `PATCH` `{ measure, measure_uom_id }` + catálogo UoM
- [ ] Pintar `measure_label`, no tamaño + Pieza/PT
- [ ] Tras guardar medida, desaparece el lápiz
- [ ] Lote `IMPORTACION` / medida `—`: **los dos lápices visibles**
