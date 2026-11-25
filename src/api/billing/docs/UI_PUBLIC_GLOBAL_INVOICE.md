# UI — Facturas a público en general

Configuración en la razón social, pestaña **Público en general**.

## Historial

### 2026-11-25
Cancelar y volver a generar la factura a público en general se hace en **Caja y cuentas**.

### 2026-11-08
Primera versión. Zona horaria, hora de cierre, timbrado automático el último día del mes y bloqueo para no facturar la orden por separado después de esa hora.

El detalle de la pestaña de Caja y cuentas y del proceso está en `src/api/accounting/docs/UI_GLOBAL_INVOICES.md`.

## Pantalla

Razón social → **Público en general** → **Facturas a público en general**.

- **Zona horaria.** El mes de la orden y la hora de cierre se cuentan en esa zona. Lista de zonas de México. Si no se elige, Tijuana.
- **Hora de cierre.** Hora en punto del último día del mes. Al activar el automático o el bloqueo sin hora, quedan las 9:00.
- **Timbrar automáticamente el último día del mes.** Apagado de inicio. Desde esa hora toma, por sucursal, las órdenes del mes sin factura y timbra una factura a público en general. No repite si ya hay una vigente. En las notas de las órdenes queda el folio del proceso (`FAPG-AAAAMMDD-NN`).
- **No permitir facturar órdenes después del mes de la orden.** Apagado de inicio. Después de la hora de cierre de ese mes, la orden no se factura por separado ni en el portal. La factura a público en general se sigue pudiendo generar, cancelar y volver a generar en Caja y cuentas.

## API

Los cuatro campos van en el alta y en la edición de la razón social:

- `global_invoice_auto_enabled`
- `global_invoice_block_after_month`
- `global_invoice_hour` (0–23, o null)
- `global_invoice_timezone` (zona IANA de la lista, o null)
