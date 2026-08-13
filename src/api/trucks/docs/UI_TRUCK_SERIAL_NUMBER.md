# UI — Número de serie del camión

Guía para Pollux: pintar `serial_number` en listado, detalle y modal. Ya está en API; no hay endpoint nuevo.

El PUT sí lo guarda. Si el input queda vacío al reabrir, el front no está leyendo `serial_number` del GET.

---

## Campo

| UI | API | Tipo | Requerido | Máx. |
|----|-----|------|-----------|------|
| Número de serie | `serial_number` | `string \| null` | No | 50 |

Key exacta: **`serial_number`**. No usar `numero_serie`, `serialNumber` ni `niv`.

Placeholder: `NIV / número de serie`.

Tab **General**, junto a Placa y Año. No va en el acordeón SCT / seguro.

---

## GET — el camión ya trae el campo

```http
GET /api/tenant/trucks/:id
GET /api/tenant/trucks
```

Detalle (`GET /:id`):

```json
{
  "id": "uuid",
  "name": "Camion ABCD-123-YZ",
  "placa": "ABC-123-4355",
  "serial_number": "3N6CD25T9HK123456",
  "anio": "2022",
  "photo": null,
  "status": "active"
}
```

Lista: cada fila en `data[]` trae el mismo `serial_number`.

Si no hay valor: `serial_number` es `null` → mostrar `—`.

---

## Modal editar — cómo pintar

No rellenar el input desde un objeto local recortado. Abrir modal → `GET /tenant/trucks/:id` → asignar **todos** los campos del form, incluido `serial_number`.

```ts
const truck = await api.get(`/tenant/trucks/${id}`);

form.patchValue({
  name: truck.name,
  placa: truck.placa,
  serial_number: truck.serial_number ?? '',
  anio: truck.anio,
  // ...resto SCT / seguro
});
```

Tras **Guardar**, el `PUT` responde el camión completo. Usar `response.serial_number` para el form y para refrescar la fila. No dejar el valor solo en el input.

```ts
const saved = await api.put(`/tenant/trucks/${id}`, payload);
form.patchValue({ serial_number: saved.serial_number ?? '' });
row.serial_number = saved.serial_number; // la tabla lee esta key
```

---

## Create / Update

```http
POST /api/tenant/trucks
PUT  /api/tenant/trucks/:id
```

```json
{
  "name": "Rabón 01",
  "placa": "ABC-123-XY",
  "serial_number": "3N6CD25T9HK123456",
  "anio": "2022"
}
```

- No enviar `photo` en este JSON.
- No es único.
- Trim. Vacío → `null` o omitir la key.

---

## Listado

| Pantalla | Qué hacer |
|----------|-----------|
| Tabla | Columna **Núm. serie** = `row.serial_number`. Si `null` / `''` → `—` |
| Búsqueda | `search` ya cubre `serial_number`. Sin query param extra |
| Modal | Precargar con `truck.serial_number` del GET `/:id` |

---

## Permisos

Sin cambio: `Truck` + `Create` / `Update` / `Read`.
