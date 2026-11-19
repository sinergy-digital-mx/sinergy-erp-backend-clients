# UI — Nota de crédito en la orden de venta

**2026-10-27.** CFDI de egreso ligado al UUID de una factura de ingreso de la OV. No cancela ni sustituye esa factura.

## Cuándo

- **Diferencia.** La factura sigue vigente. La orden no cambia de líneas ni de total. El importe es el que captura el usuario, con tope en lo que falta por acreditar de esa factura. Puede haber varias notas.
- **Orden pagada.** La nota por el total disponible deja el dinero cobrado como saldo a favor. Cuando la factura queda cubierta, se puede cancelar la orden aunque el CFDI de ingreso siga vigente. Los pagos se quedan. La factura no se cancela.
- **Orden ya cancelada** con factura de ingreso vigente: la nota sí se puede timbrar. Una factura de ingreso nueva sigue bloqueada.
- No aplica a complemento de pago, a otra nota, ni a un anticipo sin aplicar. La nota de aplicación de anticipo (relación 07) no genera saldo a favor.

Si la orden salió de una cotización y ya está cobrada, cancelarla sigue bloqueado: eso reabriría la cotización. La nota y el saldo a favor sí se emiten.

## Timbrado

```http
POST /api/tenant/sales-orders/{id}/invoices/{invoiceId}/credit-note
```

Mismo permiso que timbrar (`electronic_invoices` stamp).

```json
{
  "amount": 200.00,
  "reason": "Diferencia de precio",
  "uso_cfdi": "G02",
  "environment": "production"
}
```

| Campo | Regla |
|-------|--------|
| `amount` | Total con IVA. Mayor a 0 y no mayor al disponible de esa factura |
| `reason` | Descripción del concepto. 3 a 250 caracteres |
| `uso_cfdi` | Default `G02` |
| `environment` | Si se omite, usa el ambiente de la factura ligada |

El XML es egreso (`TipoDeComprobante = E`), método `PUE`, forma de pago la de la factura original, relación `01` y el UUID de esa factura. Folio `{folio de la orden}-NC`, y `-2`, `-3` si ya hay otra. Misma moneda que la factura. En dólares usa el tipo de cambio de la orden.

La respuesta es la factura electrónica creada: `invoice_role = credit_note`, `related_invoice_id`, `relation_type = 01`.

## Efecto en la orden

Sobre las notas vigentes con `invoice_role = credit_note`:

- `sin_cobrar = max(total de la orden - pagos, 0)`
- `aplica_a_pendiente = min(suma de notas, sin_cobrar)`
- `saldo_a_favor = suma de notas - aplica_a_pendiente`
- `pendiente = sin_cobrar - aplica_a_pendiente`

`payments_summary` trae `credit_notes_total`, `customer_credit` y `amount_pending` ya neto. `payment_status` no pasa a Pagado solo porque la nota dejó el pendiente en cero.

El libro de deuda recibe solo `aplica_a_pendiente`, y solo si la orden ya tenía cargo. El saldo a favor se guarda en `customer_credit_ledger` por cliente, razón social y moneda. En esta entrega no se usa para pagar otra orden ni para reembolsar.

Cuentas por cobrar resta `aplica_a_pendiente` del total de la orden pendiente. No resta los abonos parciales.

Si la nota deja de estar vigente (cancelada en SAT), se reversa el movimiento de deuda y el saldo a favor.

## Pantalla

Header de la orden, junto a `Facturas: N · Vigentes: M`:

- Badge **Nota de crédito** si hay un egreso vigente (incluye la del anticipo).
- Badge **Saldo a favor** con importe cuando `customer_credit` es mayor a cero.

En la tarjeta de la factura de ingreso:

- Acreditado y disponible.
- Notas ligadas: folio, UUID, importe, estatus.
- Botón **Nota de crédito** si sigue vigente y hay disponible.
- Si la orden está pagada, el texto indica que el camino es la nota y que Cancelar en SAT es para cuando la operación no existió.

La tarjeta de la nota dice **NOTA DE CRÉDITO** y a qué factura está ligada. PDF de un egreso: **NOTA DE CRÉDITO**.

En Pagos y en el bloque de estado de pago: cobrado, notas de crédito, saldo pendiente y saldo a favor.

El portal público `/facturar` no cambia.
