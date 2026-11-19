# UI — Vigencia de cotizaciones por razón social

Campo en cada razón social. Un proceso diario cancela las cotizaciones `Creada` cuando cumplen esos días.

## Dónde

Configuración Fiscal → Razones Sociales → modal Crear / Editar.

Label: **Días de vigencia de cotizaciones**. Vacío = no se cancelan solas.

Hint: *Las cotizaciones en estado Creada se cancelan solas al cumplir estos días. Vacío = no vencen.*

Listado: columna **Vigencia cotiz.** (`15 d` o `—`).

## API

Mismo create/update de razón social:

```
POST /api/tenant/fiscal-configurations
PATCH /api/tenant/fiscal-configurations/:id
```

Campo: `quotation_expiration_days` (`number | null`). Entero 1–3650. `null` o vacío = sin vigencia automática.

```ts
{
  razon_social: '...',
  rfc: '...',
  persona_type: 'Persona Moral',
  quotation_expiration_days: 15
}
```

Para quitar la vigencia: manda `quotation_expiration_days: null`.

El GET de razón social ya lo incluye.

## Efecto

- Aplica a **todas** las cotizaciones `Creada` de esa razón (también las ya existentes).
- El cron corre cada día a la 1:00. El día `created_at + N días` (inclusive) las cancela.
- Ejemplo: creada el 1 de septiembre, 15 días → se cancela el 16.
- `Convertida` y `Cancelada` no se tocan.

En cotizaciones el listado/detalle trae `expires_at` (YYYY-MM-DD) calculado con esos días. Ver `src/api/quotations/docs/UI_QUOTATIONS.md`.
