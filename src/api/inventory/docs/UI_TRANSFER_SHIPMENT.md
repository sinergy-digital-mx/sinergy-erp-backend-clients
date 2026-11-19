# UI — Transferencia con envío y recepción

## 2026-11-12 — Choferes al crear el envío

El combo de chofer del detalle de transferencia usa `GET /api/tenant/shippings/drivers` (`Shipping:Read`). No usa el listado de usuarios.

## 2026-11-10 — Movimiento de posición en la misma sucursal

Si origen y destino son la misma sucursal y cambia el almacén (Escaleras → Bodega, por ejemplo), es un movimiento de posición. El detalle lo dice en una línea corta: transferencia de posición dentro de la misma sucursal, sin envío. El estado va en una pastilla, como en el listado. La fecha se lee en palabras (10 de noviembre de 2026, 2:20 p.m.). Se recibe directo mientras está `pending`.

Si cambia de sucursal, aunque sea la misma razón social, sí necesita envío.

Al abrir la transferencia desde el lote, razón social y sucursal de destino quedan en las del lote. Solo se elige el almacén.

Al cerrar esa ventana, el lote de origen avisa si quedó algo abierto. Misma sucursal: «Este lote tiene un cambio de posición pendiente hacia …» y **Ver movimiento** abre el detalle para recibirlo. Otra sucursal: «Este lote tiene una transferencia pendiente» (o «en camino» si ya va en un envío) y **Ver transferencia**. El lote que ya se recibió dice «proviene del cambio de posición» o «proviene de la transferencia», según el caso. El historial trae `status` y las sucursales de origen y destino.

## 2026-11-03 — Varias transferencias en el mismo envío

Un envío puede llevar varias transferencias de la misma sucursal de origen. Desde el detalle de la transferencia se crea el envío o se agrega a uno que ya está en **Creado**. En el viaje, **Agregar transferencia** suma otras pendientes.

`POST /api/tenant/shippings/:id/transfers` con `inventory_transfer_ids`. Solo si el envío está `Creado`. Esas transferencias pasan a `in_transit`. Si la carta porte era de demo, hay que volver a timbrarla. Una carta porte de producción no deja agregar más.

El detalle muestra estado, fecha, unidad, chofer y cuántas transferencias lleva el envío. Ahí se crea el envío, se recibe, se cancela y se descarga el PDF. El listado solo abre el detalle.

Fecha: 2026-10-28. La carta porte del envío también se puede timbrar en Finkok Demo. Al crear el envío, chofer y camión dicen si la carta porte está completa y se pueden editar al elegirlos.

La transferencia ya no mueve el stock de un almacén al otro en el mismo paso. Sale del origen, viaja en un envío y entra al destino cuando alguien la recibe.

## Dónde se opera

Control logístico:

| Pantalla | Ruta | Para qué |
|----------|------|----------|
| Transferencias de inventario | `/logistics/transfers` | Crear, enviar, recibir y cancelar |
| Viajes | `/logistics/trips` | Armar un envío de órdenes, de transferencias o de ambas |
| Proceso de transferencia | `/logistics/transfer-process` | Los mismos pasos, debajo de Rastreo GPS |
| Flota y Choferes | `/logistics/trucks`, `/logistics/drivers` | Completo / No completo para carta porte |

La configuración de razón social está en Configuración fiscal → Razones sociales → **Impuestos y transferencias**.

## 1. Razón social

Campo `multi_fiscal_transfers_enabled`. En pantalla: **Permitir transferencias a otra razón social**.

- Apagado: origen y destino tienen que ser la misma razón social. El árbol de destinos ya no muestra las demás.
- Encendido: se puede enviar a un almacén de otra razón social.
- Si se fuerza el alta, el API responde: `Esta razón social solo puede transferir dentro de la misma razón social`.

## 2. Crear la transferencia

`POST /api/tenant/inventory/transfers`

El folio queda en `pending`. Por cada línea:

- baja `available_quantity` del lote origen
- escribe salida de transferencia en el kardex
- no crea lote destino

`destination_inventory_batch_id` y `quantity_received` van nulos hasta la recepción.

Cancelar una pendiente (`POST /api/tenant/inventory/transfers/:id/cancel`) devuelve esa cantidad al origen. Si ya tiene envío, primero hay que cancelar el envío.

## 3. Crear el envío

`POST /api/tenant/shippings`

| `cargo_kind` | Qué manda |
|--------------|-----------|
| `order_delivery` | `orders[]`, como hasta ahora |
| `inventory_transfer` | `inventory_transfer_ids[]` y `orders` vacío |
| `mixed` | órdenes y transferencias en el mismo viaje |

Las transferencias tienen que estar `pending` y salir de la sucursal del envío (`billing_branch_id`). Al guardar pasan a `in_transit`.

Desde el detalle de la transferencia se crea el envío con esa transferencia o se agrega a un envío **Creado** de la misma sucursal. Desde Viajes, y con **Agregar transferencia** dentro del viaje, se suman varias.

## 4. Carta porte

Se timbra en el envío: `POST /api/tenant/shippings/:id/carta-porte` con `peso_bruto_kg` y, si se quiere probar el PDF, `environment: "demo"`.

Chofer y unidad muestran **Completo** o **No completo**, con el detalle de lo que falta. Para una transferencia, el destino usa calle, estado y código postal del almacén; si ahí no están, los de la sucursal. También hace falta el RFC de la razón social que recibe y la clave SAT de cada producto. Sin kilómetros no se timbra.

## 5. Recepción

`POST /api/tenant/inventory/transfers/:id/receive`

```json
{
  "notes": "Conteo de andén",
  "lines": [{ "id": "uuid-linea", "quantity_received": 10 }]
}
```

Hay que contar todas las líneas. No se puede recibir más de lo enviado. Cero es válido.

- Si todas cuadran: `received`. Se crea el lote destino con la cantidad contada y entra al kardex.
- Si alguna difiere: `received_with_difference`. Solo entra lo contado. Lo que no llegó no regresa al origen.

**Recibir** está en el detalle: en `in_transit`, y en `pending` si es la misma sucursal.

## 6. Cierre del envío

`PATCH /api/tenant/shippings/:id/status` con `Completado`.

Si alguna transferencia del viaje no está recibida, el API no cierra el envío. Cancelar el envío, antes de la recepción, regresa esas transferencias a `pending` (el stock sigue apartado). Si ya se recibió, el envío no se cancela.

## Estados

| `status` | Significado |
|----------|-------------|
| `pending` | Creada. Stock apartado en origen. Sin envío activo. |
| `in_transit` | En un envío abierto. |
| `received` | Contada igual a lo enviado. |
| `received_with_difference` | Contada distinto. |
| `completed` | Transferencias directas anteriores a este flujo. |
| `cancelled` | Pendiente cancelada. El stock volvió al origen. |

El listado acepta `?status=pending`. La respuesta trae `shipping_id`, `shipping_status` y `shipping_date` cuando hay un envío que no está cancelado.
