# UI — Interés de morosos

## Historial

- 2026-11-04: En el estado de cuenta, el interés moratorio va en cada mensualidad, además del total de la cabecera.
- 2026-11-03: El estado de cuenta PDF muestra el total vencido y los intereses moratorios. Ver `UI_CONTRACT_STATEMENT.md`.
- 2026-10-23: En el header, Saldo pendiente muestra `+ $X de intereses` más chico. No se suma al saldo.
- 2026-10-23: Default 10% y 6 días en crear, editar y contratos existentes. Configurable al crear.
- 2026-10-23: El contrato define porcentaje y días. Pagos muestra el interés por cuota, editable y no mezclado con los totales.

## Alta y edición

En **Crear contrato** y **Editar**, bloque **Intereses de morosos**. Default: `interest_rate = 10`, `payment_due_day = 6`. Se puede cambiar.

## Editar contrato

Debajo de meses / primer pago, bloque **Intereses de morosos**:

| Campo | API | Ejemplo |
|--------|-----|---------|
| Porcentaje (%) | `interest_rate` | `10` = 10% |
| A partir de (días) | `payment_due_day` | `6` días después del vencimiento |

```http
PUT /api/tenant/contracts/:id
```

```json
{ "interest_rate": 10, "payment_due_day": 6 }
```

Si no mandan los campos al crear, el API pone 10 y 6. El API acepta `10` o el dato viejo `0.10` (ambos son 10%).

## Cómo se calcula

Sobre el **monto de la cuota**, no se suma al pendiente ni al total pagado.

Si hoy es 23 oct y la cuota venció el 17 oct, van 6 días. Con 6 días y 10%, cuota `$271.47` → `$27.15`.

Solo cuotas `pendiente` o `parcial`. Si la omiten, queda en 0.

## Tab Pagos

### Cards

Las de siempre no cambian. Si hay porcentaje configurado, dos cards extra:

- **Intereses**: suma pendiente + `#` de las cuotas.
- **Total con intereses**: pendiente + intereses. Solo informativo.

### Columna Interés

Monto si aplica, `—` si no. La **i** indica días, %, y cuánto se cobra.

Editar y quitar van **en esa columna**, no en Acciones.

```http
PATCH /api/tenant/contracts/:contractId/payments/:paymentId/late-interest
```

| Acción | Body |
|--------|------|
| Cambiar monto | `{ "amount": 15 }` |
| Quitar | `{ "waived": true, "amount": 0 }` |
| Volver al cálculo | `{ "waived": false, "amount": null }` |

### Stats

```http
GET /api/tenant/contracts/:contractId/payments/stats
```

Usa `late_interest_pending_amount`, `late_interest_payments`, `total_pending_with_interest`. No uses esos campos para recargar `total_pending` ni `total_paid`.
