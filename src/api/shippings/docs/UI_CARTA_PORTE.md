# UI — Carta porte

## 2026-10-28 — Chofer y camión en el viaje

En Nuevo viaje, en el envío de una transferencia y en un viaje ya creado, junto a **Editar** hay una palomita si el chofer o el camión ya pueden carta porte, o un aviso si falta algo. El detalle sale al pasar el cursor. **Editar** abre su ficha. En un viaje creado o en ruta se puede cambiar el chofer y el camión, salvo que la carta porte ya esté timbrada en producción. Si solo había una de demo, al cambiarlos se quita para volver a generarla.

`PATCH /api/tenant/shippings/:id/crew` con `{ "driver_id", "truck_id" }`.

## 2026-10-28 — Timbrar en demo

En la pestaña Carta porte del envío se elige **Demo** o **Producción** antes de generar. Demo usa las credenciales Finkok de demo y el PDF dice que no tiene validez fiscal. Esa timbrada se puede repetir o reemplazar con producción. Una de producción no se vuelve a timbrar.

`POST /api/tenant/shippings/:id/carta-porte` acepta `environment`: `demo` | `production`. Si no viene, usa el ambiente activo de Finkok. La respuesta incluye `carta_porte_environment`.

## 2026-10-16 — Catálogos de la unidad

En el camión, **Carta porte** es un tab. Permiso SCT, configuración vehicular y subtipo de remolque son claves SAT (`c_TipoPermiso`, `c_ConfigAutotransporte`, `c_SubTipoRem`). Finkok timbra la clave. Número de permiso, aseguradora, póliza, peso en toneladas y placa del remolque van en texto. El botón **Cómo llenarlo** explica cada campo.

## 2026-10-16

En Flota y Choferes la columna Carta porte solo muestra **Completo** o **No completo**. Lo que falta se ve al abrir la unidad, en el tab Carta porte. Un viaje de transferencia, o mixto con órdenes, timbra la carta porte en el envío: las mercancías salen de las órdenes y de las líneas de la transferencia, y el destino usa la dirección del almacén o de la sucursal que recibe.

## 2026-10-09

CFDI de traslado (`TipoDeComprobante` T) con complemento Carta Porte 3.1. Finkok lo sella y timbra con `sign_stamp` (el mismo servicio de facturación). No hay un endpoint distinto de carta porte en Finkok.

### Chofer

En la ficha de usuario, **Es chofer**.

| Campo | Obligatorio si es chofer | Uso |
|-------|--------------------------|-----|
| Nombre y apellido | Sí | `NombreFigura` |
| `driver_license_number` | Sí | `NumLicencia` |
| `driver_rfc` | Sí, 12 o 13 | `RFCFigura` |

`carta_porte_ready` es true solo si esos datos están completos.

### Unidad

En el camión, tab **Carta porte**.

| Campo | Obligatorio para timbrar |
|-------|--------------------------|
| Placa | Sí |
| Año (4 dígitos) | Sí |
| Permiso SCT y número | Sí |
| Configuración vehicular (`tipo_auto_transporte`) | Sí |
| Peso bruto vehicular, en toneladas | Sí |
| Aseguradora y póliza RC | Sí |
| Remolque | Solo si se captura subtipo o placa |

### Viaje

Dentro del envío:

1. Si faltan datos de chofer, unidad, sucursal, dirección, RFC del cliente, clave SAT del producto o kilómetros, el timbrado no se envía y la respuesta lista lo que falta.
2. **Generar carta porte** pide el peso bruto de la carga en kg y lo reparte entre los productos.
3. Si Finkok acepta, se guardan UUID, IdCCP y XML. **Descargar PDF** arma el comprobante de ese timbre.

`POST /api/tenant/shippings/:id/carta-porte` con `{ "peso_bruto_kg": number, "environment": "demo" | "production" }`  
`GET /api/tenant/shippings/:id/carta-porte/pdf`
