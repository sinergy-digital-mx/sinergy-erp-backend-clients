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
| `GET` | `/` | `page`, `limit`, `search` (name, placa, code, serial_number), `status` (`active`\|`inactive`) |
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

Campos opcionales: `code`, `serial_number` (número de serie / NIV, máx. 50), `anio`.

Campos opcionales SCT / seguro: `permiso_sct`, `numero_permiso_sct`, `tipo_auto_transporte`, `aseguradora_rc`, `poliza_rc`, `subtipo_remolque1`, `placa_remolque1`.

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
