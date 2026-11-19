# UI — Constancia SAT en proveedor

Contrato para el modal **Nuevo / Editar proveedor**. Misma lectura de PDF que el cliente (`src/api/customers/docs/UI_CUSTOMER_FISCAL.md`).

## 2026-11-04

En proveedor **nacional**, tab **Información Fiscal**, botón **Cargar constancia SAT**.

Sirve al **crear** (el proveedor todavía no existe) y al **editar**. El PDF no se guarda: el API devuelve los datos y el formulario se llena. Quien captura puede corregir cualquier campo y después pulsa **Crear proveedor** o **Guardar cambios**.

```
POST /api/tenant/vendors/fiscal-constancia
```

`multipart/form-data`, campo `file` (PDF del SAT, máx. 10 MB).

Permiso: `vendors:Create` o `vendors:Update`.

`400` si no es PDF, no tiene texto (foto o escaneo) o no se leen RFC, nombre y código postal.

### Respuesta

No persiste. El cliente arma el `POST /api/tenant/vendors` o el `PUT /api/tenant/vendors/:id`.

| Dato CSF | Campo del proveedor |
| --- | --- |
| RFC | `rfc` |
| 12 / 13 caracteres | `persona_type` `Persona Moral` / `Persona Física` |
| Denominación o nombre | `razon_social` |
| Nombre de vialidad | `street` |
| Número exterior | `exterior_number` |
| Número interior (`SIN NUMERO` → vacío) | `interior_number` |
| Colonia | `colonia` |
| Localidad | `localidad` |
| Municipio | `city` |
| Entidad federativa | `state` |
| Código postal | `zip_code` |
| País | `country` = `México` |

Si **Nombre de empresa** está vacío, la pantalla lo llena con la razón social. Si ya tenía nombre comercial, no lo pisa.

Ejemplo:

```json
{
  "rfc": "SSS2410213X9",
  "persona_type": "Persona Moral",
  "razon_social": "SINERGY SW SOLUTIONS",
  "street": "CALLE ESPANA",
  "exterior_number": "736",
  "interior_number": null,
  "colonia": "JUAREZ",
  "localidad": null,
  "city": "Tijuana",
  "state": "Baja California",
  "zip_code": "22040",
  "country": "México"
}
```

Volver a cargar otra constancia reemplaza esos campos en el formulario. Banco, crédito y estatus no cambian.

Migración: `1795600000000-add-vendor-fiscal-address-parts` (`exterior_number`, `interior_number`, `colonia`, `localidad`). `street`, `city`, `state` y `zip_code` ya existían.

Proveedor internacional no muestra el botón: la constancia es del SAT de México.
