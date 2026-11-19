# UI — Tipo de cambio diario

Cambio 2026-10-14: cada día del historial tiene un registro. Si no capturan uno nuevo, se copia la tasa del día anterior. Si capturan, se sobrescribe el de esa fecha. El POS de cobranza lo toma de `GET /pos/daily-shift/current` (`usd_exchange_rate`) sin permiso de este módulo.

Cambio 2026-10-13: si no hay captura del día, el API usa el último tipo de cambio anterior.

## Lectura

```
GET /api/tenant/exchange-rates/daily
GET /api/tenant/exchange-rates/daily?date=YYYY-MM-DD
```

Devuelve el registro de esa fecha (calendario de Tijuana). Si ese día no se capturó y existe uno anterior, el API inserta el día faltante con la misma tasa y lo devuelve. `PUT /daily` con la misma `rate_date` actualiza ese registro; no agrega otro.

## POS

Caja aplica `usd_exchange_rate` al cobrar dólares. Si el body no trae TC, el cobro usa el del módulo. Si no hay ninguno: 400.

El campo TC en cobranza queda bloqueado cuando ya hay tasa (`TC $16.80`).
