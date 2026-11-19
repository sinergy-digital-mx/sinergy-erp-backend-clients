# UI — Completitud, parecidos y baja de proveedores

Contrato para Pollux. Listado y ficha de proveedores: **% de ficha completa**, **bandera si parece otro**, y **eliminar en cualquier momento**.

No usar la palabra "tenant" en copy.

## 2026-11-04 — Constancia SAT al crear

En proveedor nacional, tab **Información Fiscal**, se puede subir el PDF de la constancia desde el alta. El detalle del contrato está en `src/api/vendor/docs/UI_VENDOR_FISCAL_CONSTANCIA.md`.

## 2026-11-12 — Ver proveedores abre el menú

«Ver proveedores» se guarda en la entidad `Vendor` y el token lo manda como `vendor:Read`. El menú pedía `vendors:ViewMenu`. Con la sesión vieja el catálogo no aparecía aunque el permiso estuviera marcado.

El menú y `/vendors` aceptan también `vendors:Read` y `Vendor:Read`. En pantalla, `vendor` y `vendors` son la misma entidad. El token incluye el código de la entidad y el del módulo (`vendor:Read` y `vendors:Read`).

## 2026-11-02 — Menú principal

Proveedores ya no está en Configuración. Vive en el menú principal, sección Operación, ruta `/vendors`. El acceso al menú es `vendors:ViewMenu`, `Vendor:ViewMenu`, `vendors:Read` o `Vendor:Read`.

## 2026-11-02 — Sin campo Nombre

La ficha ya no pide **Nombre**. Quedan **Nombre de empresa** (`company_name`, obligatorio) y **Razón social** (`razon_social`). En internacional, el equivalente legal sigue siendo **Nombre legal** (`legal_name`).

El API copia `company_name` en `name` para no romper consultas viejas. Listados, compras, PDF, CxP, importación y Excel muestran la empresa. Si `company_name` viene vacío, se usa `name`.

La completitud cuenta la empresa una sola vez. El parecido ya no marca el motivo `name` por separado: coincide por empresa (incluye el nombre viejo si la empresa está vacía).

Migración: `1794700000000-sync-vendor-name-with-company`.

## 2026-10-26 — Tab Cuentas

Solo al editar. Junto a General / Dirección / Bancaria.

```
GET /api/tenant/vendors/:id/accounts
```

Permiso `vendors:Read`.

Cards por moneda (MXN y USD):

- OC pendientes (clic abre el modal de CxP con esas órdenes)
- Adeudado
- A favor
- Diferencia (`adeudado − a favor`; si el a favor es mayor: `A favor $X`)

Abajo, kardex (fecha, tipo, folio OC, monto, saldo). Tipos: `credit`, `debit`, `void`.

Migración: `1793700000000-create-vendor-credit-ledger`.

---

## Completitud

Cada proveedor trae `profile_completeness` (entero 0–100). Se calcula en el API; no persistir.

Cuenta datos útiles: empresa, RFC o ID fiscal, razón social / nombre legal, dirección, banco y crédito. Strings vacíos no cuentan. País por default en nacional no infla el %. El nombre suelto no suma aparte.

### Listado

Columna **Ficha** (o Completitud): barra + `75%`.

| Rango | Color |
|-------|--------|
| ≥ 80 | verde |
| 50–79 | ámbar |
| < 50 | rojo |

### Ficha / modal

Misma barra bajo el título. No bloquea Guardar.

---

## Parecido a otro

`looks_similar: boolean` y `similar_vendors[]` (máx. 3).

Match si coincide RFC / ID fiscal (exacto o casi), nombre o empresa (sin “SA de CV”, etc.) o CLABE / IBAN / cuenta.

```json
{
  "id": "uuid",
  "name": "ACME",
  "company_name": "Acme SA",
  "rfc": "ACM010101AAA",
  "tax_id": null,
  "match_reasons": ["name", "rfc"],
  "score": 100
}
```

| reason | Label |
|--------|--------|
| `rfc` | RFC |
| `tax_id` | ID fiscal |
| `name` | Empresa |
| `company` | Empresa |
| `bank` | Cuenta / CLABE |

### Listado

- Badge **Parecido** si `looks_similar`. Tooltip / texto: nombres de `similar_vendors`.
- Filtro **Solo parecidos** → `similar_only=true`.
- Botón **Eliminar** en cada fila (permiso `vendors:Delete`), no solo al crear.

### Crear

Antes de `POST /vendors`, `POST /tenant/vendors/duplicates`. Si `found`, aviso (no bloquea). **Continuar de todos modos** crea. **Ver** abre el existente.

No consultar en editar.

---

## Endpoints

| Método | Ruta | Permiso |
|--------|------|---------|
| `GET` | `/api/tenant/vendors` | `vendors:Read` |
| `GET` | `/api/tenant/vendors/:id` | `vendors:Read` |
| `POST` | `/api/tenant/vendors/duplicates` | `vendors:Create` |
| `DELETE` | `/api/tenant/vendors/:id` | `vendors:Delete` |

Listado / detalle agregan:

```json
{
  "profile_completeness": 67,
  "looks_similar": true,
  "similar_vendors": []
}
```

Filtro extra del listado: `similar_only=true`.

### Duplicados al crear

```
POST /api/tenant/vendors/duplicates
```

Body (solo lo lleno): `name`, `company_name`, `razon_social`, `legal_name`, `rfc`, `tax_id`, `bank_clabe`, `bank_iban`, `bank_account_number`.

```json
{ "found": true, "matches": [ { "id": "…", "name": "ACME", "match_reasons": ["name"] } ] }
```

---

## Eliminar

Permitido en listado y en el modal, con o sin compras.

| Situación | `action` | Qué hace el API |
|-----------|----------|-----------------|
| Sin compras ni parecido | `deleted` | Borra el registro |
| Hay un parecido (con o sin compras) | `merged` | Pasa OC, costos y precios al parecido con más compras / ficha más completa; copia campos vacíos; borra el duplicado |
| Hay compras y **no** hay parecido | `deactivated` | No borra. Pasa a `inactive` para no perder historial |

Nunca se borran órdenes de compra. El historial queda en el proveedor que se conserva.

```json
{
  "action": "merged",
  "vendor_id": "uuid-eliminado",
  "merged_into": { "id": "uuid-conservado", "name": "ACME" },
  "purchase_orders_reassigned": 4,
  "message": "Proveedor eliminado. Las compras se conservaron en ACME."
}
```

Toast: usar `message`. Si `deactivated`, tipo aviso (no error). Recargar listado.

Confirmar con:

> Si tiene compras, se mueven al proveedor parecido. Si no hay otro parecido, se desactiva para conservar el historial.

---

## Checklist Pollux

- [ ] Columna % de ficha en el listado
- [ ] Badge **Parecido** + filtro **Solo parecidos**
- [ ] Eliminar en la fila y en el modal
- [ ] Aviso al crear si `POST /duplicates` trae `found`
- [ ] Toast con `message` del DELETE
- [ ] No borrar OC en UI; el API reasigna o desactiva
