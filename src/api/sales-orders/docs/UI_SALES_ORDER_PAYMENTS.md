# UI — Pagos en órdenes de venta

Registro de pagos (parciales o totales) desde el **detalle de la orden** o desde **POS Cobranza**. Misma idea que pagos en órdenes de compra.

---

## Flujo de negocio

1. En POS Ventas se crea la orden. Si el cliente es autorizado, puede quedar `payment_status = Pendiente`.
2. La orden aparece en **POS Cobranza** (pendientes de cobro).
3. Se puede pagar:
   - En **Cobranza POS** (`POST /pos/sales/:id/collect`), o
   - En el **detalle de la orden de venta** (sección Pagos).
4. Cada pago registra: monto, método (`cash` | `card` | `transfer` | `mixed`), referencia, notas. El crédito POS **no** crea un pago: deja `is_credit: true` y `payment_status: Pendiente`.
5. Opcional: subir comprobante (PDF/imagen) al pago.
6. Cuando la suma de pagos ≥ total de la orden → `payment_status = Pagado` y sale de pendientes de cobranza.

---

## Endpoints

Base: `/api/tenant/sales-orders/:id`

| Acción | Método | Ruta |
|--------|--------|------|
| Listar pagos + resumen | `GET` | `/:id/payments` |
| Registrar pago | `POST` | `/:id/payments` |
| Eliminar pago manual | `DELETE` | `/:id/payments/:paymentId` |
| Listar comprobantes | `GET` | `/:id/payments/:paymentId/documents` |
| Subir comprobante | `POST` | `/:id/payments/:paymentId/documents` (multipart) |
| Eliminar comprobante | `DELETE` | `/:id/payments/:paymentId/documents/:documentId` |

También vienen en el detalle:

```
GET /api/tenant/sales-orders/:id
→ data.header.payment_method
→ data.header.payment_method_label
→ data.header.payment_breakdown_label
→ data.header.payment_display
→ data.header.collection_channel
→ data.header.collection_channel_label
→ data.header.payments
→ data.header.payments_summary
→ data.payments
→ data.payments_summary
→ data.payment_display
→ data.pos_collection
```

`payment_status` es **Pagado / Pendiente**. No es cómo se pagó ni **dónde** se cobró.

`collection_channel` es **dónde** se cobró: POS Cobranza vs detalle de la OV.

---

## Cómo se pagó (detalle y listado)

En **FECHAS** del detalle, debajo de Estado de pago, pintar la forma de pago. No basta con `Pagado`.

```
Estado de pago:  Pagado
Origen cobro:    POS cobranza
Forma de pago:   Mixto
                 Efectivo + Tarjeta
  · Efectivo     $500.00
  · Tarjeta      $300.50
```

| UI | Campo | Ejemplo |
|----|--------|---------|
| Origen cobro | `header.collection_channel_label` | `POS cobranza`, `Cobrada manual`, `POS cobranza + Manual` |
| Código origen | `header.collection_channel` | `pos_cobranza` \| `manual` \| `mixed` \| `null` |
| Forma de pago | `header.payment_method_label` | `Efectivo`, `Tarjeta`, `Transferencia`, `Mixto`, `Crédito` |
| Código | `header.payment_method` | `cash` \| `card` \| `transfer` \| `mixed` \| `credit` \| `null` |
| Detalle mixto | `header.payment_breakdown_label` | `Efectivo + Tarjeta` |
| Líneas con montos | `header.payment_display.lines[]` | `{ method, label, amount_mxn, amount_usd }` |

Si `payment_method_label` es `null` → `Sin cobro`.
Si `collection_channel` es `null` → no pintar chip de origen (aún no hay cobro).

Mismo binding en el listado: cada fila trae `payment_method`, `payment_method_label`, `payment_breakdown_label`, `collection_channel`, `collection_channel_label`.

No uses `sales_order_type` para este chip. Layout del listado: `UI_SALES_ORDER_LIST.md` § 2.1.

`pos_collection` sigue ahí para el desglose de recibido/cambio. Para el chip del header usa `payment_display`, no armes el label en Pollux.

---

## Registrar pago (detalle OV)

```http
POST /api/tenant/sales-orders/{id}/payments
Content-Type: application/json
```

```json
{
  "amount": 500.00,
  "payment_date": "2026-07-03",
  "payment_method": "transfer",
  "currency": "MXN",
  "reference_number": "SPEI-998877",
  "notes": "Anticipo cliente autorizado"
}
```

| Campo | Obligatorio | Notas |
|-------|-------------|-------|
| `amount` | Sí | > 0 y ≤ saldo pendiente |
| `payment_date` | Sí | ISO date |
| `payment_method` | Sí | `cash`, `card`, `transfer`, `mixed` |
| `currency` | No | Default `MXN` |
| `reference_number` | Si `transfer` | Referencia SPEI / folio |
| `notes` | No | Texto libre |

### Respuesta (201)

```json
{
  "payment": {
    "id": "uuid",
    "amount": 500,
    "payment_method": "transfer",
    "reference_number": "SPEI-998877",
    "source": "manual",
    "source_label": "Cobrada manual",
    "documents": [],
    "created_by_name": "Admin User"
  },
  "summary": {
    "order_total": 1500,
    "amount_paid": 500,
    "amount_pending": 1000,
    "payment_status": "Pendiente",
    "currency": "MXN"
  }
}
```

Cuando `amount_pending = 0` → `payment_status = "Pagado"`.

---

## Subir comprobante

```http
POST /api/tenant/sales-orders/{id}/payments/{paymentId}/documents
Content-Type: multipart/form-data
```

| Campo form | Tipo | Notas |
|------------|------|-------|
| `file` | File | PDF, JPEG, PNG, HEIC (máx 10MB) |
| `notes` | string | Opcional |

Respuesta incluye `url` firmada (15 min) para previsualizar/descargar.

---

## UI — Sección PAGOS en detalle de orden

```
┌─────────────────────────────────────────────────────────┐
│ PAGOS                              Total: $1,500.00     │
│ Pagado: $500.00   Pendiente: $1,000.00   [Pendiente]    │
├─────────────────────────────────────────────────────────┤
│ Fecha       Método        Monto     Origen           Ref        Acciones │
│ 03/07/2026  Transferencia $500.00   Cobrada manual   SPEI-99…  📎 🗑     │
│ 03/07/2026  Efectivo      $1,000.00 POS cobranza     —         📎        │
├─────────────────────────────────────────────────────────┤
│ [ + Registrar pago ]                                    │
└─────────────────────────────────────────────────────────┘
```

### Formulario “Registrar pago”

| Campo UI | Campo API |
|----------|-----------|
| Monto | `amount` |
| Fecha | `payment_date` |
| Método | select: Efectivo / Tarjeta / Transferencia / Mixto → `cash`/`card`/`transfer`/`mixed` |
| Referencia | `reference_number` (mostrar obligatorio si Transferencia) |
| Notas | `notes` |
| Comprobante | opcional: tras crear el pago, `POST .../documents` con el archivo |

### Reglas UX

| Regla | Comportamiento |
|-------|----------------|
| Orden `Cancelada` | Ocultar / deshabilitar registro de pagos |
| Orden `Pagado` | Solo lectura del historial |
| Pago `source = pos_cobranza` | No permitir eliminar (solo lectura) |
| Pago `source = manual` | Permitir eliminar y recalcular saldo |
| Chip estatus | `payments_summary.payment_status` |
| Origen por pago | `source_label` (`POS cobranza` / `Cobrada manual`) |

### Función Pollux

```typescript
async function registerSalesOrderPayment(
  salesOrderId: string,
  payload: {
    amount: number;
    payment_date: string;
    payment_method: 'cash' | 'card' | 'transfer' | 'mixed';
    reference_number?: string;
    notes?: string;
  },
  file?: File,
) {
  const { payment, summary } = await api.post(
    `/tenant/sales-orders/${salesOrderId}/payments`,
    payload,
  );

  if (file) {
    const form = new FormData();
    form.append('file', file);
    await api.post(
      `/tenant/sales-orders/${salesOrderId}/payments/${payment.id}/documents`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  }

  return { payment, summary };
}
```

Tras guardar: refrescar detalle (`GET /sales-orders/:id`) o actualizar `payments` / `payments_summary` / `header.payment_status` en estado local.

---

## POS Cobranza

Sin cambios de contrato mayores:

- Lista pendientes: `GET /api/tenant/pos/pending-sales`  
  Ahora cada fila incluye `amount_pending` (saldo real si hubo anticipos en el detalle OV).
- Cobrar: `POST /api/tenant/pos/sales/:salesOrderId/collect`  
  Debe cubrir **exactamente** `amount_pending` (no necesariamente el total original).  
  Internamente crea el pago con `source = pos_cobranza` y el registro de cobranza.

En el modal de cobro mostrar:

```
Total orden:     $1,500.00
Ya pagado:       $500.00
Por cobrar:      $1,000.00   ← amount_pending
```

---

## Métodos de pago (labels UI)

| Valor API | Label |
|-----------|-------|
| `cash` | Efectivo |
| `card` | Tarjeta |
| `transfer` | Transferencia |
| `mixed` | Mixto |
| `credit` | Crédito (solo POS collect; no usar en `POST .../payments`) |

---

## Errores

| HTTP | Cuándo | Mensaje UI |
|------|--------|------------|
| 400 | Monto > pendiente | "El monto excede el saldo pendiente" |
| 400 | Transferencia sin referencia | "Indica la referencia de transferencia" |
| 400 | Orden cancelada / ya pagada | Toast con mensaje del backend |
| 400 | Borrar pago de cobranza | "No se puede eliminar un pago de cobranza POS" |
| 404 | ID inválido | "Orden o pago no encontrado" |

---

## Checklist Pollux

- [ ] Sección **Pagos** en detalle de orden de venta
- [ ] En FECHAS: **Forma de pago** con `payment_method_label` (no solo Pagado/Pendiente)
- [ ] En FECHAS y listado: **Origen cobro** con `collection_channel_label` (`POS cobranza` / `Cobrada manual`)
- [ ] Mixto: mostrar `payment_breakdown_label` y `payment_display.lines`
- [ ] Listado: columna Pago con `payment_method_label` + chip de origen
- [ ] Tabla de pagos: columna Origen con `source_label`
- [ ] Mostrar `payments_summary` (pagado / pendiente / estatus)
- [ ] Formulario registrar pago (método + monto + referencia + notas)
- [ ] Subida opcional de comprobante tras crear pago
- [ ] Listar documentos con link `url`
- [ ] Eliminar solo pagos `source === 'manual'`
- [ ] En POS Cobranza usar `amount_pending` como monto a cobrar
- [ ] Refrescar estatus de pago en header tras registrar
