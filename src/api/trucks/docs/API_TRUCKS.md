# API — Camiones (`/api/tenant/trucks`)

CRUD de flota por organización (`tenant_id` del JWT). Mensajes al cliente hablan de **organización**, nunca de tenant.

## Permisos

| Acción | Permiso |
|--------|---------|
| Listar / detalle | `Truck` + `Read` |
| Crear | `Truck` + `Create` |
| Actualizar / subir foto | `Truck` + `Update` |
| Desactivar | `Truck` + `Delete` |

## Endpoints

| Método | Path | Notas |
|--------|------|-------|
| `GET` | `/` | `page`, `limit`, `search` (name, placa, code, serial_number), `status` (`active`\|`inactive`), `billing_branch_ids` (ids separados por coma; incluye camiones sin sucursal) |
| `GET` | `/:id` | 404 genérico si no es de la organización |
| `POST` | `/` | `name` requerido; `placa` única por organización |
| `PUT` | `/:id` | Patch parcial (no incluye foto) |
| `POST` | `/:id/photo` | Multipart `file` → S3; respuesta con `photo` firmada |
| `DELETE` | `/:id` | Soft delete → `status=inactive` |

## Body create (mínimo)

```json
{
  "name": "Rabón 01",
  "placa": "ABC-123-XY",
  "serial_number": "3N6CD25T9HK123456",
  "anio": "2022"
}
```

Campos opcionales: `code`, `serial_number` (número de serie / NIV, máx. 50), `anio`, `default_billing_branch_id` (sucursal por defecto; no impide usarlo en otra).

## 2026-11-27 — Sucursal en el listado

La respuesta de listado y detalle agrega `default_billing_branch_prefix` (prefijo de la sucursal), `default_billing_fiscal_prefix` (prefijo de la razón social) y `default_billing_razon_social`. El listado de flota muestra el nombre de la sucursal y, debajo, el prefijo `RAZÓN-SUCURSAL`. No se envían sellos ni llaves de la razón social.

## 2026-11-25 — Sucursal por defecto

Cada camión puede guardar `default_billing_branch_id`. La respuesta incluye `default_billing_branch_name` (código de la sucursal). El listado acepta `billing_branch_ids` para prefiltrar la flota del usuario y sigue devolviendo unidades sin sucursal asignada.

Campos opcionales SCT / seguro: `permiso_sct`, `numero_permiso_sct`, `tipo_auto_transporte`, `aseguradora_rc`, `poliza_rc`, `subtipo_remolque1`, `placa_remolque1`.

## 2026-10-16 — Unidad ocupada

Listado y detalle incluyen `active_shipping_id`, `active_shipping_status`, `active_shipping_date` y `active_shipping_driver_name` cuando la unidad está en un envío Creado o En Ruta. Si hay varios, se devuelve el de fecha más reciente.

## Foto

Misma mecánica que productos (`POST /tenant/products/:id/photo`).

```http
POST /api/tenant/trucks/:id/photo
Authorization: Bearer <jwt>
Content-Type: multipart/form-data

file: <imagen>
```

- Campo del archivo: **`file`** (único).
- En BD se guarda la clave S3; en list/detail/upload `photo` viene como **URL firmada** (~15 min).
- Reemplazar foto: volver a llamar el mismo endpoint (borra la anterior en S3).
- Crear primero el camión (`POST /`), luego subir foto con el `id` (en create/edit el tab Fotos solo tiene sentido con `id` existente).
