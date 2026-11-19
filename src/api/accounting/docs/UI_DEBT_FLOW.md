# UI — Flujo de deuda (TRK-004)

Histórico descargable de lo que el cliente nos debe. Dos vistas, mismo corte de fechas que Existencia de inventarios.

**2026-11-09.** El reporte ya no filtra ni muestra sucursal. La razón social es obligatoria. Antigüedad, flujo y Excel muestran la razón social congelada al nacer el movimiento.

**2026-11-03.** En Cobranza los filtros van sueltos, como en las otras pestañas: razón social y búsqueda en fila, y Descargar Excel junto al periodo. Ya no van dentro de una tarjeta.

| Vista | Query `view` | Qué responde |
|-------|--------------|--------------|
| **Antigüedad** | `aging` | Saldos abiertos al **fin del periodo**, por cliente y cubeta |
| **Flujo** | `ledger` | Kardex del rango: cargo, abono, saldo de la OV y saldo del cliente |

## Qué queda congelado

Al nacer la deuda o al registrar el abono se guarda, y ya no se recalcula:

| Campo | Regla |
|-------|--------|
| Cargo | OV a crédito en POS, u OV manual que queda `Pendiente` (no mostrador, no `En cola`) |
| Abono | Pago aplicado a esa OV (`manual` o el que liquide un crédito). El de anticipo no entra |
| Vencimiento | Día del cargo + días de crédito de esa razón social en ese momento |
| Nombre, RFC, folio, razón social | Snapshot del movimiento |
| `balance_after` | Saldo corrido del cliente con esa razón social |
| `order_balance_after` | Saldo de esa OV después del movimiento |

Cobro de contado en POS no entra. Cancelar la OV reversa el saldo que aún debía. Borrar un abono manual lo reversa. Una nota de crédito baja solo la parte que la orden aún debía (`credit_note`). Si esa nota se cancela, el saldo regresa (`credit_note_reversal`). Lo ya cobrado no entra a este libro: queda como saldo a favor. Ver `src/api/sales-orders/docs/UI_SALES_ORDER_CREDIT_NOTE.md`.

**2026-11-03.** Antigüedad, flujo y Excel solo incluyen órdenes con `is_credit`. Una OV pendiente de contado no sale, aunque tenga movimientos viejos en el kardex. El saldo corrido se recalcula solo con esas órdenes. El anticipo no entra: no se lista el abono con origen `advance`, y el cargo queda en el total menos el anticipo pedido, cobrado o facturado. Los demás abonos sí bajan ese saldo.

**2026-10-27.** `movement_type` suma `credit_note` y `credit_note_reversal`.

El histórico anterior al deploy se carga en la migración de `acc_customer_debt_ledger`.

## Endpoints

```
GET /api/tenant/accounting/debt-flow
GET /api/tenant/accounting/debt-flow/export/excel
```

Permiso: `Accounting:Read`.

### Query

| Param | Notas |
|-------|--------|
| `fiscal_configuration_id` | **Obligatorio**. Razón social nuestra |
| `customer_id` | Opcional. Al abrir un cliente desde Antigüedad |
| `search` | Cliente, RFC o folio |
| `view` | `aging` \| `ledger` |
| `period` | `today` \| `week` \| `month` \| `year` \| `range` |
| `date_from` / `date_to` | Solo si `period=range` (`YYYY-MM-DD`) |
| `page` / `limit` | Default `1` / `50`, máx. `100` |

**Antigüedad** ignora el inicio del rango: el corte es `date_to`.
**Flujo** lista movimientos del rango y, antes, el saldo vigente de cada OV (`is_opening`).

**Excel** ignora `page`/`limit`.

### Antigüedad — fila

| UI | Campo |
|----|--------|
| Cliente | `customer_name` + `customer_rfc` |
| Razón social | `fiscal_razon_social`, congelada en el movimiento |
| Órdenes | `open_order_count` (MXN + USD) |
| Pesos | `mxn_order_count` y `total`. Antigüedad MXN: `current`, `d1_30`, `d31_60`, `d61_90`, `d91_plus` |
| Dólares | `usd_order_count` y `usd_total`. Antigüedad USD: `usd_current`, `usd_d1_30`, `usd_d31_60`, `usd_d61_90`, `usd_d91_plus` |
| Límite | `credit_limit`, `credit_days` (null si no tiene crédito activo) |
| Pie y tarjetas | `aging_totals` (universo filtrado, no solo la página) |

La moneda sale de la orden (`inv_s_sales_orders.currency`). Si no trae moneda, se toma MXN. Pesos y dólares no se suman.

Click en la fila → Flujo con `customer_id`.

### Flujo — fila

| UI | Campo |
|----|--------|
| Fecha | `occurred_at` en hora de Baja California (`America/Tijuana`). Si `is_opening`, solo el día |
| Cliente | `customer_name`, `customer_rfc` y `fiscal_razon_social` |
| Concepto | `title` + `description` |
| OV | `folio` abre la orden (`sales_order_id`) |
| Moneda | `currency` (`MXN` o `USD`), la de la orden |
| Cargo / Abono | `charge_amount` / `payment_amount`, en la moneda de la orden |
| Saldo OV | `order_balance_after`, en la moneda de la orden |
| Saldo cliente | `balance_mxn` y `balance_usd`. Corrido por cliente y moneda dentro del reporte. `balance_after` sigue siendo el saldo histórico mezclado y no se pinta |
| Vence | `due_date` |

`movement_type`: `opening` | `charge` | `payment` | `charge_reversal` | `payment_reversal` | `credit_note` | `credit_note_reversal`.

## UI

Ruta: `/accounting/flujo-deuda`.

Entrar desde la pestaña **Flujo de deuda** en Cobranza.

La razón social queda en `fiscal_configuration_id`. Sin elegirla, el reporte pide seleccionarla. Al recargar se vuelve a aplicar esa razón.

- Toggle Antigüedad / Flujo
- Razón social obligatoria
- Paginación servidor
- Folio abre el detalle de la OV
- Antigüedad: tarjetas de clientes, pesos y dólares. Cada columna muestra cuántas órdenes y cuánto deben, más por vencer y vencido
- Flujo: cada movimiento trae su moneda. El saldo del cliente va en dos columnas, MXN y USD

## Cambios — 2026-11-03

La sucursal del flujo es `billing_branch_id`, la misma URL del resto de Cobranza. Un enlace viejo con `debt_branch_id` se lee una vez y pasa a `billing_branch_id`.

Antigüedad y flujo muestran solo órdenes a crédito (`inv_s_sales_orders.is_credit`). El Excel usa el mismo corte.

El anticipo no cuenta como deuda. El abono de anticipo no aparece. El cargo de la orden a crédito es el total menos ese anticipo, y el saldo de la OV y del cliente se recalculan con eso.

## Cambios — 2026-11-02

La sucursal del flujo queda en la URL. Todas se guarda como `all` y la razón social como `fiscal_configuration_id`.

## Cambios — 2026-10-14

Las órdenes ya pueden ser MXN o USD. Antigüedad y flujo separan cuánto deben y cuántas órdenes hay en cada denominación. El Excel trae las mismas columnas.
