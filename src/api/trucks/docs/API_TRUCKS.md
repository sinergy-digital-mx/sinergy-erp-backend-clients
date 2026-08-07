# API — Camiones (`/api/tenant/trucks`)

CRUD de flota por organización (`tenant_id` del JWT). Mensajes al cliente hablan de **organización**, nunca de tenant.

## Permisos

| Acción | Permiso |
|--------|---------|
| Listar / detalle | `Truck` + `Read` |
| Crear | `Truck` + `Create` |
| Actualizar | `Truck` + `Update` |
| Desactivar | `Truck` + `Delete` |

## Endpoints

| Método | Path | Notas |
|--------|------|-------|
| `GET` | `/` | `page`, `limit`, `search`, `status` (`active`\|`inactive`) |
| `GET` | `/:id` | 404 genérico si no es de la organización |
| `POST` | `/` | `name` requerido; `placa` única por organización |
| `PUT` | `/:id` | Patch parcial |
| `DELETE` | `/:id` | Soft delete → `status=inactive` |

## Body create (mínimo)

```json
{
  "name": "Rabón 01",
  "placa": "ABC-123-XY",
  "anio": "2022"
}
```

Campos opcionales SCT / seguro: `permiso_sct`, `numero_permiso_sct`, `tipo_auto_transporte`, `aseguradora_rc`, `poliza_rc`, `subtipo_remolque1`, `placa_remolque1`.
