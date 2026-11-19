# UI — Comprobante electrónico de pago (CEP)

2026-10-14. En Pagos, junto a **Generar CEP**, hay selector Demo / Producción. En localhost arranca en Demo, salvo que la factura ligada ya tenga ambiente: entonces se preselecciona ese. El POST manda `{ "environment": "demo" | "production" }`. Si se omite, el servidor usa el ambiente de la factura. El CEP tiene que ir en el mismo ambiente que esa factura.

2026-10-09. Tab **Pagos** del detalle de la orden de venta.

Cuando la orden está pagada al 100% y la factura de ingreso vigente es **PPD**, se puede timbrar el CEP con Finkok. Es un CFDI 4.0 tipo `P` con el complemento de recepción de pagos 2.0. El pago ya no va en la factura: el SAT lo pide en este comprobante.

Si la factura se timbró como **PUE**, el pago ya quedó ahí y no se genera CEP.

---

## Pantalla

En Pagos, debajo del resumen, cuando `payment_status` es Pagado y el total es mayor a cero:

- Si `can_generate` es true: selector Demo / Producción y botón **Generar CEP**. Permiso `electronic_invoices:Stamp`.
- Si `payment_complement` ya existe: UUID, PDF y XML. No se timbra otro.
- Si `reason` trae texto: mostrarlo. No hay botón.

No mostrarlo si la orden sigue con saldo.

---

## Endpoints

| Uso | Método | Ruta |
|-----|--------|------|
| Saber si se puede timbrar | `GET` | `/api/tenant/sales-orders/:id/invoices/payment-complement` |
| Timbrar | `POST` | `/api/tenant/sales-orders/:id/invoices/payment-complement` |

El POST acepta `{ "environment": "demo" }` o `{ "environment": "production" }`. Si no viene, usa el ambiente guardado en la factura. El servidor arma el XML con la factura PPD y los pagos de la orden (efectivo `01`, cheque `02`, transferencia `03`, tarjeta `04`), en hora `America/Tijuana`, y lo manda a Finkok `Sign_Stamp`.

`related_environment` en el GET dice en qué ambiente se timbró la factura (`demo`, `production` o null).

```json
{
  "paid": true,
  "can_generate": true,
  "reason": null,
  "payment_complement": null,
  "related_environment": "demo"
}
```

Cuando ya está timbrado, `can_generate` es false y `payment_complement` trae `id`, `uuid`, `stamp_status`, `sat_status`, `stamped_at` y `amount`.

PDF y XML del CEP: los mismos de cualquier factura, `GET /invoices/:invoiceId/pdf` y `/xml`.

Si Finkok rechaza, responde `400` y no guarda el comprobante. El `message` se muestra en el toast.
