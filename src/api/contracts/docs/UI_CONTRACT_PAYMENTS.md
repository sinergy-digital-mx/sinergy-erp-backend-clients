# UI — Calendario de pagos del contrato

Tab **Pagos** del detalle de contrato. El usuario indica **inicio** (día, mes, año); el **fin** se calcula solo con `payment_months` del contrato (ej. 96).

Base: `/api/tenant/contracts/:contractId/payments`  
Permisos: `Contract` + `Create` (generar/regenerar), `Read` (lista/stats/preview), `Update` (revertir).

---

## Dónde va en la pantalla

En el tab **Pagos**, **arriba de las cards** (Total / Pagados / Parciales / Pendientes / Vencidos):

1. Texto de rango: **Inicio** — **Fin** (si ya hay calendario).
2. Formulario compacto de generación / regeneración (ver estados abajo).

No va en el tab Editar. El calendario se arma aquí.

---

## Datos del contrato (ya los tienes)

| Campo | Uso en UI |
|--------|-----------|
| `payment_months` | Cantidad de cuotas. Read-only. Ej. `96`. |
| `monthly_payment` | Monto de cada cuota. |
| `currency` | `USD` o `MXN`. Badge junto a montos. Ver `UI_CONTRACT_CURRENCY.md`. |
| `first_payment_date` | Default del día/mes/año si el usuario no ha tocado nada. |

---

## Stats (fuente de verdad del UI)

```http
GET /api/tenant/contracts/:contractId/payments/stats
```

Campos nuevos:

| Campo | Uso |
|--------|-----|
| `can_generate` | `true` si no hay cuotas → mostrar **Generar pagos**. |
| `can_regenerate` | `true` si hay cuotas y **ninguna** está `pagado` ni `parcial`. |
| `paid_or_partial_count` | Cuántas hay que revertir antes de regenerar. |
| `cannot_regenerate_reason` | Mensaje para el banner. Mostrarlo tal cual. |
| `schedule.start_date` | Primer vencimiento `YYYY-MM-DD`. |
| `schedule.end_date` | Último vencimiento (auto). |
| `schedule.payment_months` | Igual que el contrato. |
| `schedule.payment_day` | Día del mes (el que eligió el usuario). |

---

## Formulario: inicio editable, fin automático

Controles:

- **Día** (1–31)
- **Mes** (1–12)
- **Año**
- **Fin** (solo lectura)
- **Meses** (solo lectura, `payment_months`)

Al cambiar día/mes/año, armar `start_date = YYYY-MM-DD` (cero-padded) y pedir preview:

```http
GET /api/tenant/contracts/:contractId/payments/schedule-preview?start_date=2026-08-05
```

```json
{
  "start_date": "2026-08-05",
  "end_date": "2034-07-05",
  "payment_months": 96,
  "payment_day": 5,
  "payments_count": 96,
  "monthly_payment": 286.46,
  "currency": "USD"
}
```

Pinta `end_date` en el campo Fin. No dejes que el usuario lo edite.

Fórmula (si calculas en cliente, mismo resultado):

```
fin = addMonths(inicio, payment_months - 1)
```

Si el día no existe en ese mes (31 en febrero), se usa el último día del mes.

Ejemplo: inicio `5 ago 2026`, 96 meses → fin `5 jul 2034`. Cuota 1 = ago 2026, cuota 96 = jul 2034.

---

## Tres estados del tab

### 1. Sin cuotas (`can_generate === true`)

Panel **Generar pagos**:

- Día / mes / año (default: `first_payment_date` o preview sin query).
- Fin auto.
- Botón **Generar pagos**.

```http
POST /api/tenant/contracts/:contractId/payments/generate
Content-Type: application/json
```

```json
{ "start_date": "2026-08-05" }
```

**Breaking change:** la respuesta ya no es un array. Usa `payments`:

```json
{
  "start_date": "2026-08-05",
  "end_date": "2034-07-05",
  "payment_months": 96,
  "payment_day": 5,
  "payments_count": 96,
  "monthly_payment": 286.46,
  "currency": "USD",
  "payments": [ ]
}
```

Después: refrescar lista + stats.

### 2. Cuotas sin nada pagado (`can_regenerate === true`)

Mismo formulario + botón **Regenerar desde 0**.

Confirmación: *Se borrarán las N cuotas pendientes y se crearán de nuevo con la fecha de inicio indicada.*

```http
POST /api/tenant/contracts/:contractId/payments/regenerate
Content-Type: application/json
```

```json
{ "start_date": "2026-09-01" }
```

Misma forma de respuesta que generate.

### 3. Hay pagos pagados o parciales (`can_regenerate === false` y `paid_or_partial_count > 0`)

- **No** mostrar el botón Regenerar (o deshabilitado).
- Banner con `cannot_regenerate_reason`.
- Texto fijo: *Debes revertir los pagos pagados o parciales antes de regenerar el calendario.*
- En cada fila `pagado` / `parcial`, acción **Revertir** →

```http
POST /api/tenant/contracts/:contractId/payments/:paymentId/reset
```

Cuando `paid_or_partial_count` vuelva a 0, aparece Regenerar.

---

## Errores (400) — mostrar `message`

| Situación | Mensaje |
|-----------|---------|
| Ya hay cuotas y llamaron generate | *Los pagos de este contrato ya fueron generados...* |
| Regenerar con pagos cobrados | *No se pueden regenerar los pagos porque hay N pago(s) pagado(s) o parcial(es). Debes revertir esos pagos antes de regenerar.* |
| Enganche financiado sin liquidar | *No se pueden generar/regenerar pagos normales hasta liquidar completamente el enganche financiado* |
| Fecha inválida | *Fecha de inicio inválida. Usa formato YYYY-MM-DD* |

---

## Checklist UI

- [ ] Tab Pagos muestra **Inicio** y **Fin** del calendario.
- [ ] El usuario solo captura día / mes / año de inicio.
- [ ] Fin se actualiza al cambiar el inicio (preview o fórmula).
- [ ] Generar si no hay cuotas.
- [ ] Regenerar solo si `can_regenerate`.
- [ ] Si hay pagados/parciales: banner + revertir (`reset`), sin regenerar.
- [ ] `POST generate` / `regenerate` leen `response.payments`, no el root como array.
- [ ] Montos con badge `currency` (USD), no MXN.
