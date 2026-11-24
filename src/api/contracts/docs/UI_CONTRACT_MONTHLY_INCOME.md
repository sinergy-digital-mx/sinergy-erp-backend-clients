# UI — Métricas de contratos

## Historial

- 2026-11-19: Los filtros de la lista explican al pasar el cursor qué incluye cada uno. El texto de las cuotas de meses anteriores se lee completo, en varias líneas.
- 2026-11-19: Los conteos del mes son ligas a la lista (todos, al corriente, sin pago, parciales, atraso). La lista va numerada. «Cuota» se explica al pasar el cursor. Se quitó la cartera activa.
- 2026-11-19: El ingreso del mes ya no compara `tenant_id` entre tablas (collations distintas); eso devolvía 500.
- 2026-11-19: Pantalla propia bajo Contratos. El mes muestra lo que deberían entrar las mensualidades, lo ya cobrado y lo que falta. Los atrasos de meses anteriores van aparte y no se suman a ese mes.

Entrada: enlace **Métricas**, a la izquierda de la búsqueda en el listado. Ruta `/contracts/metrics`. La pantalla no repite las dos secciones.

## Qué responde

Solo cuotas de `contract_payments`. No incluye enganche ni mantenimiento. Un contrato de contado no tiene mensualidad, así que no entra.

El mes se elige con flechas. El grupo de cliente es el mismo filtro del listado (`group_id`).

| Número | Significado |
|--------|-------------|
| Deberías recibir | Suma de las cuotas cuyo vencimiento cae en el mes |
| Ya entró | Lo aplicado a esas cuotas |
| Falta de este mes | Lo que esas cuotas aún no cubren |
| Atrasos anteriores | Cuotas con vencimiento **antes** de ese mes que siguen abiertas. No se suman arriba |
| Sin cuota este mes | Financiados activos con saldo y mensualidad, pero sin cuota generada en el mes. Tampoco se suman |

Si hay USD y MXN, se cambia de moneda. No se mezclan.

Los filtros de la lista (Todos, Ya pagaron, Falta este mes, Con atraso) explican al pasar el cursor a quién incluyen.

## Endpoint

```
GET /api/tenant/contracts/monthly-income?year=2026&month=11
GET /api/tenant/contracts/monthly-income?year=2026&month=11&group_id={uuid}
```

Permiso: `Contract:Read`.

`currencies[]` trae el resumen por moneda. `contracts[]` es la lista: número, cliente, lo del mes, lo pagado, lo que falta y los atrasos (`prior_installments`, `prior_amount`, `prior_oldest`). `month_status` es `paid`, `partial`, `unpaid` o `none` (solo atraso, sin cuota en el mes).

El clic de una fila abre `/contracts/detail/:id`.
