# API — Rastreo GPS (`/api/tenant/gps-tracking`)

Integración con [3D Tracking](https://api.3dtracking.net/swagger/ui/index#) para leer la última posición de cada unidad. La contraseña se guarda cifrada. La respuesta nunca incluye la contraseña.

El módulo `gps_tracking` queda habilitado solo en Verdulería y Maderería. El enlace con el camión es la placa (o el UID guardado en el camión).

## Historial

- 2026-10-09: Configuración tipo correo, consulta de posiciones, enlace por placa y bloqueo de la unidad mientras el envío está en `Creado` o `En Ruta`.

## Permisos

| Acción | Permiso |
|--------|---------|
| Menú y mapa | `gps_tracking` + `ViewMenu` / `Read` |
| Crear configuración | `gps_tracking` + `Create` |
| Editar, activar y probar | `gps_tracking` + `Update` |
| Eliminar | `gps_tracking` + `Delete` |

## Configuración

| Método | Path | Acción |
|--------|------|--------|
| `GET` | `/configurations` | Lista |
| `POST` | `/configurations` | Crea. Body: `name`, `username`, `password` |
| `GET` | `/configurations/active` | Configuración activa |
| `POST` | `/configurations/test` | Prueba credenciales. Body opcional: `configuration_id`, `username`, `password` |
| `PATCH` | `/configurations/:id` | Actualiza. `password` solo si cambia |
| `POST` | `/configurations/:id/activate` | Deja una sola configuración activa |
| `DELETE` | `/configurations/:id` | Elimina |

Proveedor: `GET https://api.3dtracking.net/api/v1.0/Authentication/UserAuthenticate` y `GET /Units/LatestPositionsList`.

Si la cuenta responde `error.tandcnotaccepted`, hay que aceptar los términos en el portal de 3D Tracking y volver a probar.

## Posiciones

| Método | Path | Acción |
|--------|------|--------|
| `GET` | `/positions` | Últimas posiciones. Query opcional `truck_id` |
| `GET` | `/units` | Catálogo para enlazar un camión |

`positions` devuelve `ok`, `configured`, `message` y `units` con latitud, longitud, velocidad, rumbo, ignición, dirección, chofer y, si hay camión, `truck_id` y el envío activo.

## Camión

`gps_unit_uid` y `gps_unit_name` en `trucks`. Si no hay UID, se compara la placa normalizada con el nombre de la unidad.

## Envío

Al crear un envío, la unidad no puede estar ya en otro envío `Creado` o `En Ruta`. Se libera al completarlo o cancelarlo.
