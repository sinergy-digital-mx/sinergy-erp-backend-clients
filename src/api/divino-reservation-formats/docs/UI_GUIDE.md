# Guía de UI — Divino Formatos de Reservación

## Historial

- 2026-10-26: El selector de lote (`GET /tenant/properties`) acepta `DivinoReservationFormat:Read`, `Create` o `Update`. Sin `Property:Read` la respuesta solo trae código, nombre, estatus y precio (sin clientes ni contratos). El rol vendedor ya no necesita el módulo de propiedades.
- 2026-10-26: El selector de razón social (`GET /tenant/fiscal-configurations`) acepta `DivinoReservationFormat:Read` o `Create`. El rol vendedor ya no necesita cotizaciones ni ventas para ver las razones.
- 2026-10-26: Eliminar abre un modal propio (folio, comprador, lote, estatus) con **Cancelar** y **Eliminar formato**. Si el formato ya está `sent`, avisa que el correo enviado no se retira.

Cómo consumir el módulo desde el frontend. Todos los endpoints requieren:

- Header `Authorization: Bearer <token>`
- Módulo habilitado y permisos `DivinoReservationFormat:*` (solo tenant Divino).

Base URL del módulo: `/{apiPrefix}/tenant/divino-reservation-formats`

---

## Flujo general

1. **Selección de LOTE** (obligatorio) → `GET /tenant/properties`.
2. **Selección de razón social** (logo del PDF, opcional) → `GET /tenant/fiscal-configurations`.
3. **Capturar campos manuales** del formato (comprador, plan de pagos, etc.).
4. **Guardar** → `POST /tenant/divino-reservation-formats`.
5. **Tabla** con búsqueda + paginación → `GET /tenant/divino-reservation-formats`.
6. **Ver / descargar PDF** → `GET /tenant/divino-reservation-formats/:id/pdf`.
7. **Enviar por correo** (PDF adjunto) → `POST /tenant/divino-reservation-formats/:id/send`.

---

## 1. Selector de LOTE

```http
GET /tenant/properties?status=disponible&search=A-12&page=1&limit=20
```

Permiso: cualquiera de `Property:Read`, `DivinoReservationFormat:Read`,
`DivinoReservationFormat:Create` o `DivinoReservationFormat:Update`. Sin
`Property:Read` cada lote trae solo `id`, `code`, `name`, `block`, `lot_number`,
`status`, `total_area`, `total_price`, `price_per_m2` y `currency`.

Usa el `id` de la propiedad como `property_id`. El backend copia automáticamente
`block` (Manzana), `lot_number` (Número de Lote) y `surface` (Superficie), y toma
`purchase_price`/`currency` del lote si no los envías (puedes sobreescribirlos).

## 2. Selector de razón social (encabezado / logo del PDF)

```http
GET /tenant/fiscal-configurations?status=active&page=1&limit=20
```

Permiso: cualquiera de `FiscalConfiguration:Read`, `Quotation:Read`, `sales_orders:Read`,
`DivinoReservationFormat:Read` o `DivinoReservationFormat:Create`. Sin `FiscalConfiguration:Read`
la lista no incluye sello ni secretos.

Muestra `razon_social` y el `logo` (viene como URL firmada) en el selector. Envía el
`id` como `fiscal_configuration_id`. Ese logo y razón social se renderizan en el PDF.
Si omites `fiscal_configuration_id`, el alta usa la razón social activa de la organización
(Valdetierra SA de CV) y copia su nombre a `payable_to` cuando ese campo viene vacío.

---

## 3. Crear formato

```http
POST /tenant/divino-reservation-formats
Content-Type: application/json
```

```json
{
  "property_id": "b1f2...-uuid-del-lote",
  "fiscal_configuration_id": "c3d4...-uuid-razon-social",

  "received_from": "Juan Pérez López",
  "amount_in_words": "Cincuenta mil pesos 00/100 M.N.",
  "evidenced_by": "Transferencia SPEI ref. 998877",

  "purchase_price": 850000,
  "currency": "USD",

  "reservation_deposit": 50000,
  "reservation_date": "2026-07-17",
  "down_payment": 170000,
  "down_payment_date": "2026-07-27",
  "financed_balance": 630000,
  "financing_years": 5,
  "monthly_payments_count": 60,
  "monthly_payment_amount": 10500,
  "maintenance_fee": 50,
  "maintenance_currency": "USD",
  "payment_day": "1",

  "buyer_name": "Juan Pérez López",
  "buyer_address": "Av. Reforma 123, Tijuana, B.C.",
  "buyer_phone": "+52 664 123 4567",
  "buyer_email": "juan.perez@example.com",

  "lead_source": "instagram",
  "lead_source_other": null,

  "format_date": "2026-07-17",
  "agent_name": "María Gómez",
  "notes": "Cliente pide firmar contrato la próxima semana."
}
```

Notas de campos:

- `property_id` es **obligatorio**; el resto son opcionales.
- `payment_day`: `"1"` (1ro del mes) o `"15"` (15 del mes).
- `lead_source`: `facebook` | `instagram` | `google` | `restaurante` | `walkin` | `referido` | `otro`. Usa `lead_source_other` solo con `otro`.
- Fechas en formato ISO `YYYY-MM-DD`.
- El backend genera `folio` (`DIV-RES-000001`), fija `status: "draft"` y guarda `created_by` / `created_by_name` (usuario autenticado).

Respuesta `201`: el formato creado (incluye `id`, `folio`, snapshots del lote).

---

## 4. Tabla con búsqueda y paginación

```http
GET /tenant/divino-reservation-formats?page=1&limit=20&search=juan&status=draft
```

Query params:

- `page` (default 1), `limit` (default 20, máx 100)
- `search`: busca en folio, nombre/correo del comprador, "recibido de", quién lo creó, código/nombre del lote y clave catastral.
- `status`: `draft` | `sent`
- `property_id`: filtra por lote

Respuesta:

```json
{
  "data": [
    {
      "id": "…",
      "folio": "DIV-RES-000001",
      "status": "draft",
      "buyer_name": "Juan Pérez López",
      "buyer_email": "juan.perez@example.com",
      "created_by_name": "María Gómez",
      "created_at": "2026-07-17T19:40:00.000Z",
      "property": { "code": "A-12", "name": "Lote A-12", "block": "A", "lot_number": "12" },
      "creator": { "first_name": "María", "last_name": "Gómez" }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "hasNext": false,
  "hasPrev": false
}
```

Columnas sugeridas para la tabla: **Folio**, **Comprador**, **Lote** (`property.code`),
**Estatus**, **Creado por** (`created_by_name`), **Fecha** (`created_at`), y acciones
(Ver PDF / Enviar / Editar / Eliminar).

---

## 5. Detalle

```http
GET /tenant/divino-reservation-formats/:id
```

Devuelve el formato con `property`, `fiscal_configuration` y `creator`.

## 6. Actualizar

```http
PUT /tenant/divino-reservation-formats/:id
```

Mismo body que crear (todos los campos opcionales). Si cambias `property_id`, se
recalculan los snapshots del lote.

## 7. Eliminar

```http
DELETE /tenant/divino-reservation-formats/:id
```

Respuesta: `{ "success": true }`.

El botón de la tabla abre un modal de confirmación, no un alert genérico. Muestra folio, comprador, lote, estatus y fecha. Acciones: **Cancelar** y **Eliminar formato**. Si `status` es `sent`, el modal avisa que el correo ya enviado no se puede retirar. El DELETE corre al confirmar; al terminar bien se recarga la tabla.

---

## 8. Descargar / previsualizar PDF

```http
GET /tenant/divino-reservation-formats/:id/pdf
```

Devuelve `application/pdf` (binario). En el frontend:

```ts
const res = await fetch(`/tenant/divino-reservation-formats/${id}/pdf`, {
  headers: { Authorization: `Bearer ${token}` },
});
const blob = await res.blob();
const url = URL.createObjectURL(blob);
window.open(url); // o <a download>
```

El PDF renderiza el logo de la razón social seleccionada en el encabezado.

---

## 9. Enviar por correo (con PDF adjunto)

```http
POST /tenant/divino-reservation-formats/:id/send
Content-Type: application/json
```

```json
{
  "to_email": "juan.perez@example.com",
  "cc": ["ventas@valledivino.mx"],
  "bcc": [],
  "subject": "Tu formato de reservación - Divino",
  "message": "Adjuntamos tu formato de reservación."
}
```

- Todos los campos son opcionales. Si omites `to_email`, se usa `buyer_email` del formato.
- Requiere una configuración de correo **activa** (Resend) en el tenant.
- Al enviarse, el formato cambia a `status: "sent"` y se registran `sent_at`, `sent_to`, `sent_by`.

Sugerencia UI: botón **"Enviar por correo"** que abra un modal con el correo del
comprador precargado (editable) y campos opcionales de asunto/mensaje.

---

## Errores comunes

| Código | Causa                                                                 |
| ------ | --------------------------------------------------------------------- |
| 400    | `property_id` inexistente, sin correo destino, o sin config de correo activa. |
| 401    | Token ausente o inválido.                                             |
| 403    | Usuario sin permiso `DivinoReservationFormat:*` (o módulo no habilitado). |
| 404    | Formato no encontrado.                                                |

---

## Permisos que controlan el UI

- `DivinoReservationFormat:ViewMenu` → mostrar el módulo en el menú lateral.
- `DivinoReservationFormat:Create` → botón "Nuevo formato".
- `DivinoReservationFormat:Read` → tabla, detalle y PDF.
- `DivinoReservationFormat:Update` → editar.
- `DivinoReservationFormat:Delete` → eliminar.
- `DivinoReservationFormat:Send` → botón "Enviar por correo".
