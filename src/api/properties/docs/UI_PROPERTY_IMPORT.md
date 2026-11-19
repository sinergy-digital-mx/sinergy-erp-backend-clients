# UI — Importar lotes desde Excel

Alta masiva de lotes. Un botón en el listado abre un modal: descargar plantilla, llenarla y subirla. Si una fila no se puede importar, se omite y el resto sí se crea.

Permiso: `Property` / `Create` (el mismo de Crear Lote).

## Historial

- 2026-10-28: Se quita `ubicacion` de la plantilla. El grupo de la fila es la ubicación. Un Excel viejo con esa columna sigue pasando; se ignora.
- 2026-10-28: Las filas inválidas o ya existentes se **omiten**. El resto se importa. El job termina con `result.skipped[]` (fila, código, motivo) para copiar. El 400 queda solo si el archivo está vacío o no es la plantilla.
- 2026-10-27: Cada fila trae su **grupo**. La plantilla agrega la hoja **Grupos** (nombres actuales). Se copia el nombre a la columna `grupo` de Lotes. El modal ya no pide un grupo único.
- 2026-10-27: El POST ya no espera el alta. Devuelve un job y la UI consulta `GET …/import/jobs/:jobId` (~1 s) para mostrar `Importando X de Y` y la barra. Si el Excel está mal, el POST sigue en 400 con `errors[]`.

---

## Endpoints

```http
GET /api/tenant/properties/import/template
POST /api/tenant/properties/import
GET /api/tenant/properties/import/jobs/:jobId
```

`POST` es `multipart/form-data` con `file` (`.xlsx`, máx. 5 MB). El grupo va en cada fila del Excel.

Si el archivo está vacío o no es la plantilla, **400** inmediato. Las filas malas o duplicadas no detienen el job: van a `result.skipped` al terminar.

```json
{
  "id": "uuid-job",
  "status": "queued",
  "total": 80,
  "processed": 0,
  "percent": 0,
  "current_code": null,
  "message": "En cola…",
  "result": null,
  "error": null
}
```

Poll cada 800 ms–1 s mientras `status` sea `queued` o `processing`:

```http
GET /api/tenant/properties/import/jobs/:jobId
```

| `status` | UI |
|----------|-----|
| `queued` / `processing` | Barra + `message` (o `Importando {processed} de {total}`) |
| `completed` | Parar poll; toast con `result.created`. Si `result.skipped` tiene filas, dejar el modal abierto con texto para copiar. Recargar al cerrar. |
| `failed` | Parar poll; mostrar `error` y no cerrar |

`result` al completar:

```json
{
  "created": 90,
  "skipped": [
    { "row": 2, "code": "LOT-4-01", "message": "Ya existe un lote con el código \"LOT-4-01\"." },
    { "row": 33, "code": "LOT-9-05", "message": "El código \"LOT-9-05\" está repetido en el archivo." }
  ]
}
```

`row` es el número de fila en Excel (la 1 es el encabezado). El 400 queda solo si no hay plantilla o el archivo no trae lotes.

---

## Plantilla

Hoja **Lotes**. La primera fila es el encabezado. La segunda es un ejemplo con nombre `Lote ejemplo`: el import la ignora. Hay que borrarla o dejarla; no crea un lote.

El código no va en el archivo. Se crea al importar como `LOT-{manzana}-{número}` (el número se rellena a 2 dígitos: manzana `1` y lote `1` → `LOT-1-01`).

Hoja **Grupos**: lista los grupos de cliente de la organización (`nombre`). Copia ese texto a la columna `grupo` de cada lote. La celda trae lista desplegable.

| Columna | Obligatorio | Notas |
|---------|-------------|--------|
| nombre | Sí | Máx. 150. |
| grupo | Sí | Nombre exacto de la hoja **Grupos**. Cada fila puede ser de otro grupo. |
| area | Sí | Mayor a 0. |
| unidad | Sí | Símbolo, código o nombre. Hoja **Unidades** (`m²`, `m2`). |
| manzana | Sí | Máx. 50. Entra al código. |
| numero_lote | Sí | Máx. 50. Entra al código. |
| clave_catastral | No | Máx. 100. |
| descripcion | No | |
| precio_m2 | Uno de los dos | Si viene, el total es área × precio/m². |
| precio_total | Uno de los dos | Si también viene `precio_m2`, gana el precio por m². |
| moneda | No | `USD` o `MXN`. Vacío = USD. |
| estado | No | `disponible`, `vendido`, `reservado`, `cancelado`. Vacío = disponible. |

Máximo 500 lotes por archivo. Al descargar, las hojas **Grupos** y **Unidades** se llenan solas.

---

## Modal

En el encabezado de **Lotes**, junto a Crear Lote:

1. Botón **Importar lotes**.
2. **Descargar plantilla** llama al GET y guarda `plantilla-lotes.xlsx` (hojas Lotes, Grupos y Unidades).
3. En Lotes, columna `grupo`: copia el nombre de la hoja Grupos (o elige de la lista).
4. Input de archivo `.xlsx`.
5. **Importar** envía el POST con `file`. Deshabilita el form y muestra loading de inmediato.
6. Si el POST es 400 (archivo vacío o no es plantilla), mostrar el mensaje y no cerrar.
7. Si trae `id` + `status`, poll `GET …/import/jobs/:id` y mostrar barra + `Importando X de Y`.
8. `completed` sin omitidos: toast con `result.created`, cerrar y recargar.
9. `completed` con omitidos: toast, dejar el modal abierto, caja de texto `Fila N: CÓDIGO — motivo` y botón **Copiar**. Al cerrar, recargar si se creó alguno.
10. `failed`: mostrar `error` y dejar el modal abierto.
