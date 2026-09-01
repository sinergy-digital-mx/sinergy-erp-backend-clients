# UI — ID fiscal del proveedor (opcional)

Contrato para Pollux. **No quitar** el campo **ID fiscal**. Dejar de marcarlo como obligatorio.

El ID fiscal (`tax_id`) es el identificador tributario **extranjero** (VAT, EIN, NIF, etc.). Solo aplica cuando el proveedor es **internacional**. En nacional el equivalente es **RFC** (`rfc`).

---

## Dónde se ve

Formulario **Crear / Editar proveedor**, bloque de tipo internacional (`vendor_type === 'INTERNATIONAL'`).

```
Tipo de proveedor    [ Internacional ▼ ]

Nombre legal *       [ … ]
País *               [ … ]
ID fiscal            [ … ]     ← visible, sin asterisco, sin bloquear Guardar
```

| UI | Body | Cuándo se muestra | Obligatorio |
|----|------|-------------------|-------------|
| RFC | `rfc` | `NATIONAL` | No |
| ID fiscal | `tax_id` | `INTERNATIONAL` | **No** |
| Nombre legal | `legal_name` | `INTERNATIONAL` | Sí |
| País | `country` | `INTERNATIONAL` | Sí |

No mostrar ID fiscal en proveedor nacional. Al pasar a nacional el API pone `tax_id: null`.

---

## Guardar

```
POST /api/tenant/vendors
PUT  /api/tenant/vendors/:id
Permiso: vendors:Create / vendors:Update
```

Con o sin `tax_id`:

```json
{
  "vendor_type": "INTERNATIONAL",
  "name": "US Supplier",
  "legal_name": "US Supplier LLC",
  "country": "US"
}
```

Con ID fiscal:

```json
{
  "vendor_type": "INTERNATIONAL",
  "name": "US Supplier",
  "legal_name": "US Supplier LLC",
  "country": "US",
  "tax_id": "12-3456789"
}
```

Texto libre. Vacío u omitido = se guarda sin ID fiscal (`null`). En edición, `""` o `null` borra el valor.

Validación de formato: ninguna. No exigir RFC mexicano en este campo.

---

## Lectura

`GET /api/tenant/vendors/:id` trae `tax_id` (`string | null`). Prefill el input. Si es `null`, dejar vacío. No mostrar placeholder tipo “Requerido”.

Listado / detalle / Excel: si `tax_id` viene vacío, pintar `—`. No es error.

---

## Qué no hacer

- Quitar el input ID fiscal
- Asterisco, `required`, o deshabilitar **Guardar** / **Crear** por falta de `tax_id`
- Pedir ID fiscal al crear/editar nacional
- Usar `rfc` como ID fiscal (ni al revés)
- Mensajes tipo “ID fiscal es requerido”

Siguen requeridos en internacional: **nombre legal** y **país**.

---

## Checklist Pollux

- [ ] Campo **ID fiscal** visible solo si tipo = Internacional
- [ ] Sin `required` / asterisco / bloqueo de submit
- [ ] Body: `tax_id` opcional en `POST` / `PUT /tenant/vendors`
- [ ] Prefill desde GET; `null` = input vacío
- [ ] Nacional: no pintar ID fiscal; sí RFC (también opcional)
