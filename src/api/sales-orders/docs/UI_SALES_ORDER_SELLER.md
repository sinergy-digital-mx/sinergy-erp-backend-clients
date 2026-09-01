# UI — Vendedor vs Comisionado en la orden de venta

En el detalle hay **dos personas distintas**. No uses “Vendedor asignado” en la OV: se confunde con Vendedor.

| UI | Campo API | Qué es |
|----|-----------|--------|
| **Vendedor** | `seller_user` | Quien vendió (código POS / quien creó la OV) |
| **Comisionado** | `assigned_seller_user` | Quien **cobra la comisión** de esta orden |

Pueden ser la misma persona o no. El body/API no cambia: sigue `assigned_seller_user`.

Helper bajo Comisionado: `Quien comisiona esta venta`.

**No hay historial en la orden.** El log de quién cambió al vendedor asignado del cliente está en el tab Registro del cliente: `src/api/customers/docs/UI_CUSTOMER_REGISTRATION.md`.

---

## Cómo se llena al crear

```
POST /api/tenant/sales-orders
```

| Campo | POS | MANUAL |
|-------|-----|--------|
| `seller_user_id` | Obligatorio | Opcional: si se omite, el que crea la orden |
| `assigned_seller_user_id` | Opcional | Opcional |

Si **no** mandas `assigned_seller_user_id`:

1. Si el cliente tiene vendedor asignado → ese es el **Comisionado**.
2. Si el cliente no tiene → Comisionado = Vendedor.

Snapshot. Cambiar el vendedor del cliente después **no** mueve órdenes ya hechas. En la orden se edita **Comisionado** aparte.

---

## Lectura (detalle)

```
GET /api/tenant/sales-orders/:id
```

Cards de arriba: **Razón social → Sucursal → Cliente**. Ver `UI_SALES_ORDER_LIST.md`.

En `data.header`: `seller_user`, `assigned_seller_user`.

Forma de pago (efectivo / tarjeta / mixto / etc.): `header.payment_method_label` y `header.payment_breakdown_label`. Ver `UI_SALES_ORDER_PAYMENTS.md`.

```
FECHAS
  Fecha orden / Entrega / Estado de pago
  Forma de pago: Mixto (Efectivo + Tarjeta)
  Vendedor:      Jose Rivera (1974)     [Cambiar]
  Comisionado:   Maria Lopez (140696)   [Cambiar]
                 Quien comisiona esta venta
```

Label persona: `{first_name} {last_name} ({pos_user_code})`.

| Campo | Vacío |
|-------|--------|
| `seller_user` | `Sin vendedor` |
| `assigned_seller_user` | `Sin comisionado` |

El reporte de comisiones (`view=commissions`) agrupa por **Comisionado**. El de ventas (`view=sales`) agrupa por **Vendedor**. Ver `src/api/sales-reports/docs/UI_SALES_REPORT_ZONA_NORTE.md`.

---

## Editar Vendedor (quien vendió)

```http
PATCH /api/tenant/sales-orders/:id/seller
{ "seller_user_id": "uuid" }
```

No cambia el Comisionado.

---

## Editar Comisionado

```http
PATCH /api/tenant/sales-orders/:id/assigned-seller
{ "assigned_seller_user_id": "uuid" }
```

No cambia el Vendedor.

Respuesta: mismo shape que el detalle (`header.assigned_seller_user`).

### Reglas (los dos)

| Regla | Detalle |
|-------|---------|
| Quién puede ser | Usuario de la organización con `pos_user_code` |
| Bloqueado | Orden `Cancelada` |
| Lista para select | `sellers` de `GET /api/tenant/customers/registration-options` |

---

## Checklist Pollux

- [ ] Label **Comisionado** (nunca “Vendedor asignado” en esta pantalla)
- [ ] Helper: `Quien comisiona esta venta`
- [ ] `seller_user` = Vendedor · `assigned_seller_user` = Comisionado
- [ ] `[Cambiar]` en cada uno (endpoints distintos)
- [ ] `PATCH /tenant/sales-orders/:id/seller`
- [ ] `PATCH /tenant/sales-orders/:id/assigned-seller`
- [ ] **Sin historial** en esta pantalla
- [ ] Forma de pago en FECHAS: `payment_method_label` — `UI_SALES_ORDER_PAYMENTS.md`
- [ ] Origen cobro en FECHAS: `collection_channel_label` — `UI_SALES_ORDER_LIST.md` § 2.1
- [ ] Deshabilitar si orden cancelada
- [ ] Al crear no hace falta mandar `assigned_seller_user_id`: sale del cliente
