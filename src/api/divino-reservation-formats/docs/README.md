# Divino Formatos de Reservación

Módulo exclusivo del cliente **Divino** (prefijo `divino_`). Genera **cotizaciones/apartados de un LOTE** (no ventas reales), replicando el formato de reservación en papel y permitiendo enviarlo por correo con el PDF adjunto.

- El **LOTE** se selecciona del sistema (`Property`).
- El resto de los campos del formato se capturan **manualmente**.
- El **encabezado (razón social + logo)** es dinámico: se selecciona una `FiscalConfiguration` y su logo se renderiza en el PDF.
- Se guarda quién creó cada formato (`created_by` / `created_by_name`) y quién/cuándo lo envió.

## Estructura

```
src/api/divino-reservation-formats/
├── dto/
│   ├── create-divino-reservation-format.dto.ts
│   ├── update-divino-reservation-format.dto.ts
│   ├── query-divino-reservation-format.dto.ts
│   └── send-divino-reservation-format.dto.ts
├── docs/
│   └── README.md
├── divino-reservation-formats.constants.ts
├── divino-reservation-format.controller.ts
├── divino-reservation-format.service.ts
├── divino-reservation-format-pdf.service.ts
└── divino-reservation-formats.module.ts

src/entities/divino-reservation-formats/divino-reservation-format.entity.ts
src/database/migrations/1784600000000-create-divino-reservation-formats-table.ts
src/database/seeds/seed-divino-reservation-formats-module.ts
```

## RBAC

- Módulo: `divino_reservation_formats`
- Entidad (entityType): `DivinoReservationFormat`
- Acciones: `ViewMenu`, `Create`, `Read`, `Update`, `Delete`, `Send`
- Habilitado solo para el tenant Divino (`54481b63-5516-458d-9bb3-d4e5cb028864`).

## Endpoints

Prefijo: `tenant/divino-reservation-formats`

| Método | Ruta            | Permiso                      | Descripción                                  |
| ------ | --------------- | ---------------------------- | -------------------------------------------- |
| POST   | `/`             | `DivinoReservationFormat:Create` | Crear formato (requiere `property_id`).  |
| GET    | `/`             | `DivinoReservationFormat:Read`   | Listado con `search`, `status`, paginación. |
| GET    | `/:id`          | `DivinoReservationFormat:Read`   | Detalle.                                  |
| GET    | `/:id/pdf`      | `DivinoReservationFormat:Read`   | Descarga el PDF del formato.              |
| POST   | `/:id/send`     | `DivinoReservationFormat:Send`   | Envía el PDF por correo (Resend).         |
| PUT    | `/:id`          | `DivinoReservationFormat:Update` | Actualizar.                               |
| DELETE | `/:id`          | `DivinoReservationFormat:Delete` | Eliminar.                                 |

### Selectores del UI

- **LOTE**: usar `GET tenant/properties` (filtrar por `status=disponible`).
- **Razón social (logo del PDF)**: usar `GET tenant/fiscal-configurations` y pasar el `id` como `fiscal_configuration_id`.

## Campos del formato

Basados en el formato de reservación Divino:

- Encabezado: `fiscal_configuration_id` (razón social + logo), `payable_to`.
- Recepción de fondos: `received_from`, `amount_in_words`, `evidenced_by`.
- LOTE: `property_id` (+ snapshots `block`, `lot_number`, `surface`), `purchase_price`, `currency`.
- Plan de pagos: `reservation_deposit`, `reservation_date`, `down_payment`, `down_payment_date`, `financed_balance`, `financing_years`, `monthly_payments_count`, `monthly_payment_amount`, `maintenance_fee` (default 50 USD), `payment_day` (`1` | `15`).
- Comprador: `buyer_name`, `buyer_address`, `buyer_phone`, `buyer_email`.
- Origen: `lead_source` (`facebook`/`instagram`/`google`/`restaurante`/`walkin`/`referido`/`otro`), `lead_source_other`.
- Pie: `format_date`, `agent_name`, `notes`.
- Sistema: `folio` (auto `DIV-RES-000001`), `status` (`draft`/`sent`), auditoría de creación y envío.

## Envío por correo

`POST /:id/send` genera el PDF y lo envía como adjunto usando la configuración de correo activa del tenant (Resend). El destino por defecto es `buyer_email`; se puede sobreescribir con `to_email`, y aceptar `cc`, `bcc`, `subject`, `message`. Al enviarse, el formato pasa a `status = sent` y registra `sent_at`, `sent_to`, `sent_by`.

## Migración y seed

```bash
npm run migration:run
npm run seed:divino-reservation-formats
```
