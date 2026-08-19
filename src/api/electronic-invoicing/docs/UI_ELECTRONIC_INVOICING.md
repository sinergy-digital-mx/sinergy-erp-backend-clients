# UI — Módulo Facturación Electrónica (core)

Módulo **independiente** que encapsula integración Finkok y sync SAT. La lógica de negocio (armar XML desde una OV, reglas de facturación parcial, etc.) vive en cada módulo consumidor (ej. `sales-orders`).

---

## Responsabilidades del módulo

| Capa | Responsabilidad |
|------|-----------------|
| **electronic-invoicing** | Timbrado (`Sign_Stamp`), cancelación (`Sign_Cancel`), consulta SAT, almacenamiento CFDI, sync programado |
| **sales-orders** (u otros) | Construir XML CFDI, validar reglas de negocio, llamar al core |

---

## Modelo de datos — `electronic_invoices`

Una orden de venta puede tener **0..N** facturas:

```
sales_order (1) ──< electronic_invoices (N)
                      │
                      └── fiscal_configuration_id
                      └── uuid (SAT)
                      └── stamp_status
                      └── sat_status
```

### Estados de timbrado (`stamp_status`)

| Valor | Significado |
|-------|-------------|
| `pending_stamp` | Histórico; ya no se usa en timbrado nuevo |
| `stamped` | Timbrada OK (única fila que se crea al timbrar) |
| `stamp_error` | Histórico; el timbrado fallido ahora es `400` sin persistir |
| `cancel_pending` | Cancelación solicitada, pendiente confirmación SAT |
| `cancelled` | Cancelada |
| `cancel_error` | Error al cancelar (sí es CFDI; el sello existió) |

### Estados SAT (`sat_status`)

`Vigente` | `Cancelado` | `No Encontrado` | `Desconocido`

---

## Endpoints core

Base: `/api/tenant/electronic-invoices`

| Acción | Método | Ruta | Permiso |
|--------|--------|------|---------|
| Timbrar XML | `POST` | `/stamp` | `electronic_invoices:Stamp` |
| Listar | `GET` | `/` | `electronic_invoices:Read` |
| Detalle | `GET` | `/:id` | `electronic_invoices:Read` |
| PDF | `GET` | `/:id/pdf` | `electronic_invoices:Read` |
| XML | `GET` | `/:id/xml` | `electronic_invoices:Read` |
| Cancelar | `POST` | `/:id/cancel` | `electronic_invoices:Cancel` |
| Sync SAT (una) | `POST` | `/:id/sync-sat` | `electronic_invoices:SyncSat` |
| Estado sync cliente | `GET` | `/sync-status` | `electronic_invoices:SyncSat` |
| Lote sync manual | `POST` | `/sync-batch` | `electronic_invoices:SyncSat` |

Query listado: `?source_module=sales_orders&source_id={uuid}&stamp_status=stamped`

El PDF de representación impresa **siempre** pinta SubTotal, Descuento, IVA y Total, aunque sean `$0.00`. Columna Descuento en conceptos también. No ocultar ceros.

---

## POST `/stamp` — body (uso avanzado / otros módulos)

```json
{
  "fiscal_configuration_id": "uuid",
  "source_module": "sales_orders",
  "source_id": "uuid-orden",
  "xml": "<cfdi:Comprobante ...>",
  "rfc_receptor": "XAXX010101000",
  "receptor_nombre": "Cliente SA",
  "subtotal": 1000.00,
  "total": 1160.00,
  "series": "A",
  "folio": "123",
  "certificate_serial": "30001000000400002434",
  "environment": "demo"
}
```

Respuesta `201`: objeto `electronic_invoice` con `uuid`, `xml_stamped`, `stamp_status = stamped`.

`environment` (`demo` | `production`) es opcional: override de credenciales Finkok para ese timbrado. Si se omite, usa `stamping_environment`. Queda en `metadata.finkok_environment`.

Si Finkok rechaza: **`400`**, sin insertar fila ni PDF. `message` incluye código SAT (`CFDI40144: ...`). Pollux: toast, no card de factura. Ver `src/api/sales-orders/docs/UI_SALES_ORDER_INVOICING.md`.

---

## POST `/:id/cancel` — body

```json
{
  "motivo": "02",
  "folio_sustitucion": "uuid-opcional-solo-motivo-01"
}
```

Motivos SAT: `01`–`04`.

---

## Sync SAT en background

### Comportamiento automático

- Cron cada **30 minutos** (`ElectronicInvoiceSatSyncService`).
- Por cada cliente con facturas `stamped` o `cancel_pending`:
  - Consulta WebService SAT (`ConsultaCFDI`).
  - Actualiza `sat_status`, `sat_es_cancelable`, `sat_estatus_cancelacion`.
  - Registra log en `electronic_invoice_sync_logs`.
- Intervalo mínimo entre syncs de la misma factura: **6 horas** (salvo sync manual).

### Pantalla admin (opcional)

Ruta sugerida: **Facturación → Sincronización SAT**

```
GET /api/tenant/electronic-invoices/sync-status
```

```json
{
  "pending_count": 12,
  "last_batch_at": "2026-07-08T14:00:00.000Z",
  "recent_logs": [
    {
      "id": "uuid",
      "electronic_invoice_id": "uuid",
      "trigger_type": "scheduled",
      "previous_sat_status": "Vigente",
      "new_sat_status": "Cancelado",
      "success": 1,
      "created_at": "..."
    }
  ]
}
```

Botón **Sincronizar ahora** → `POST /sync-batch`

---

## Permisos del módulo

Habilitar módulo `electronic_invoicing` por cliente en admin de módulos.

| Permiso | Uso |
|---------|-----|
| `ViewMenu` | Menú |
| `Read` | Ver facturas |
| `Stamp` | Timbrar |
| `Cancel` | Cancelar |
| `SyncSat` | Sync manual y lote |

---

## Integración Finkok — métodos y URLs

### Timbrado (`Sign_Stamp`)

| Ambiente | WSDL | Endpoint SOAP |
|----------|------|---------------|
| Demo | `https://demo-facturacion.finkok.com/servicios/soap/stamp.wsdl` | `https://demo-facturacion.finkok.com/servicios/soap/stamp` |
| Producción | `https://facturacion.finkok.com/servicios/soap/stamp.wsdl` | `https://facturacion.finkok.com/servicios/soap/stamp` |

SOAPAction: `sign_stamp` · Namespace: `http://facturacion.finkok.com/stamp`

### Cancelación (`Sign_Cancel`)

| Ambiente | WSDL | Endpoint SOAP |
|----------|------|---------------|
| Demo | `https://demo-facturacion.finkok.com/servicios/soap/cancel.wsdl` | `https://demo-facturacion.finkok.com/servicios/soap/cancel` |
| Producción | `https://facturacion.finkok.com/servicios/soap/cancel.wsdl` | `https://facturacion.finkok.com/servicios/soap/cancel` |

SOAPAction: `sign_cancel` · Namespace: `http://facturacion.finkok.com/cancel`

### Sync estatus SAT

Dos vías (el backend intenta Finkok primero, luego SAT directo):

| Método | Origen | WSDL / Endpoint |
|--------|--------|-----------------|
| `get_sat_status` | Finkok (cancel WS) | Mismo endpoint cancel · SOAPAction: `get_sat_status` |
| `Consulta` | SAT directo | WSDL: `https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc?WSDL` · Endpoint: `.../ConsultaCFDIService.svc` · SOAPAction: `http://tempuri.org/IConsultaCFDIService/Consulta` |

Constantes en código: `src/api/electronic-invoicing/constants/finkok-endpoints.constants.ts`

Variables de entorno: `ENCRYPTION_KEY` (obligatoria para credenciales Finkok).
