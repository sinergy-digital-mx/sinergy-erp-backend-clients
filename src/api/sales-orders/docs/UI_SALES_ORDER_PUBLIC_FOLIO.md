# UI — Folio público en detalle de orden de venta

Guía para Pollux. El folio del ticket de autofactura (`MZN-CTR-INV-000033`) debe verse en el **detalle de la OV**, junto al `#OSV-000033`.

Fuente: `GET /api/tenant/sales-orders/:id` → `data.header`.

Portal del cliente: `src/api/self-invoice/docs/UI_SELF_INVOICE_PORTAL.md`.

---

## Campos

| UI | API | Ejemplo |
|----|-----|---------|
| Folio interno (ya está) | `header.folio` | `OSV-000033` |
| **Folio público** | `header.public_invoice_code` | `MZN-CTR-INV-000033` |
| Link portal | `header.self_invoice_url` | `https://facturacion.sinergydigital.mx/facturar/MZN-CTR-INV-000033?email=...` |

`public_invoice_code` es `null` si aún no se cobró / no se regeneró el ticket. En ese caso **no** pintar el renglón.

---

## Dónde va

### 1. Header (obligatorio)

Debajo de `#OSV-000033`, texto secundario (mono / copy):

```
#OSV-000033
Folio público  MZN-CTR-INV-000033   [copiar]
```

Click en copiar → `public_invoice_code`.  
Si hay `self_invoice_url`, icono de enlace que abre esa URL en pestaña nueva (útil para probar el portal).

No reemplazar `#OSV-000033`. El interno se queda; el público es extra.

### 2. Sidebar INFORMACIÓN POS (si la OV es POS)

Nueva fila:

| Label | Valor |
|-------|--------|
| Folio público | `header.public_invoice_code` |

Solo si `header.sales_order_type === 'POS'` **y** `public_invoice_code` no es null.

---

## Binding

```ts
const code = header.public_invoice_code as string | null;
const url = header.self_invoice_url as string | null;

if (code) {
  // mostrar bajo #OSV-…
  // copiar code
  // si url → <a href={url} target="_blank">Facturar en línea</a>
}
```

No concatenar a mano. No usar `header.folio` como folio público.

---

## Checklist

- [ ] Bajo `#OSV-000033` mostrar `public_invoice_code` cuando no es null
- [ ] Botón copiar
- [ ] Link `self_invoice_url` si existe
- [ ] Fila en INFORMACIÓN POS (solo POS)
- [ ] Si es `null`, no mostrar placeholder ni "N/A"
