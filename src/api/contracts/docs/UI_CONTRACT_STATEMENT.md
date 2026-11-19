# UI — Estado de cuenta

## Historial

- 2026-11-04: En **Pagos del contrato**, cada mensualidad tiene columna **Interés**. Si no aplica, sale `—`. El total de esa columna es el de la cabecera.
- 2026-11-03: El PDF muestra **Total vencido** (enganche + mensualidades, solo lo pendiente) e **Intereses moratorios** de las mensualidades. El interés no se suma al saldo pendiente.

El estado de cuenta se genera al descargar. No queda guardado.

```http
GET /api/tenant/contracts/:id/pdf
```

Debajo de precio, enganche y saldo:

| Dato | Qué suma |
|------|----------|
| Total vencido | `amount_pending` de pagos con `is_overdue` en pendiente o parcial. Incluye enganche y mensualidades. El número entre paréntesis es la cantidad de cuotas. |
| Intereses moratorios | La misma regla de Pagos: porcentaje del contrato sobre la cuota, a partir de los días configurados. Si en Pagos se cambió o se quitó, el PDF usa ese monto. |

En la tabla de mensualidades, la columna **Interés** es por cuota. Enganche no lleva esa columna. El interés no se mezcla con el saldo pendiente ni con la columna Pendiente.
