# UI — Número de serie del camión

Guía para Pollux: agregar el campo **Número de serie** al catálogo de camiones. Ya está en API; no hay endpoint nuevo.

---

## Campo

| UI | API | Tipo | Requerido | Máx. |
|----|-----|------|-----------|------|
| Número de serie | `serial_number` | `string` | No | 50 |

Placeholder sugerido: `NIV / número de serie`.

Va en el tab **General**, junto a Placa y Año. No va en el acordeón SCT / seguro.

---

## Create / Update

Mismo body que hoy. Incluir `serial_number` (o `null` / omitir si está vacío).

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
- No es único. No validar unicidad en front.
- Trim al guardar. Si el input queda vacío, enviar `null` o no mandar la key.

---

## Listado

`GET /api/tenant/trucks` y `GET /api/tenant/trucks/:id` ya regresan `serial_number`.

| Pantalla | Qué hacer |
|----------|-----------|
| Tabla de camiones | Columna **Núm. serie** (después de Placa). Si `null`, `—` |
| Búsqueda | El `search` actual ya busca en `name`, `placa`, `code` y `serial_number`. No agregar query param |
| Detalle / modal | Precargar el input con `truck.serial_number` |

---

## Permisos

Sin cambio: `Truck` + `Create` / `Update` / `Read`.
