# UI — Tab Información Fiscal (domicilio SAT)

Guía para Pollux: tab **Información Fiscal** en Crear / Editar cliente.

Copiar de la **Constancia de Situación Fiscal (CSF)**, no inventar el domicilio. El CFDI 4.0 del receptor usa el **CP** (`DomicilioFiscalReceptor`) y el **nombre legal** (`Nombre`). Si el nombre o el CP no coinciden con el SAT, Finkok rechaza el timbrado (p. ej. CFDI40144).

---

## Layout

Quitar el campo único **Dirección fiscal**. Partir como la CSF:

```
┌─────────────────────────────────────────────────────────────┐
│ Información Fiscal                                          │
├─────────────────────────────────────────────────────────────┤
│ RFC                    [ SSS2410213X9                     ] │
│ Tipo de persona        [ Persona moral                  ▼ ] │
│ Razón social / Nombre  [ SINERGY SW SOLUTIONS             ] │
│                        (exacto CSF, MAYÚSCULAS SAT)         │
│                                                             │
│ Código postal *        [ 22040 ]     País  [ México / MEX ] │
│ Calle / vialidad       [ CALLE ESPAÑA                     ] │
│ No. exterior  [ 736 ]  No. interior  [                    ] │
│ Colonia                [ JUAREZ                           ] │
│ Localidad              [                         ] opcional │
│ Municipio o alcaldía   [ Tijuana                          ] │
│ Entidad federativa     [ Baja California                  ] │
└─────────────────────────────────────────────────────────────┘
```

Ningún campo fiscal es obligatorio para **guardar** el cliente. Sí lo son para **timbrar**: RFC, razón social SAT y CP de 5 dígitos.

Al final del tab, switch largo y fino **Generar factura** → `auto_generate_invoice`. Detalle de crédito + POS: `src/api/customers/docs/UI_CUSTOMER_CREDIT.md`.

No mostrar `fiscal_city` ni un textarea de dirección concatenada.

---

## Campos API

`POST /api/tenant/customers` y `PUT /api/tenant/customers/:id`

| UI | Body | Notas |
|----|------|--------|
| RFC | `fiscal_rfc` | Ya existe |
| Tipo de persona | `fiscal_person_type` | `fisica` \| `moral` \| `otro` |
| Razón social | `fiscal_razon_social` | Texto legal CSF (CFDI `@Nombre`). Mismo campo que el tab Información del Cliente: `src/api/customers/docs/UI_CUSTOMER_RAZON_SOCIAL.md` |
| Código postal | `fiscal_postal_code` | 5 dígitos. CFDI `@DomicilioFiscalReceptor` |
| Calle / vialidad | `fiscal_street` | Nombre de vialidad CSF |
| No. exterior | `fiscal_exterior_number` | |
| No. interior | `fiscal_interior_number` | Vacío si no aplica |
| Colonia | `fiscal_colonia` | |
| Localidad | `fiscal_localidad` | Opcional |
| Municipio o alcaldía | `fiscal_municipio` | No usar “Ciudad” |
| Entidad federativa | `fiscal_state` | Ya existía |
| País | `fiscal_country` | Clave SAT `c_Pais`, default `MEX` si hay domicilio |

`fiscal_address` y `fiscal_city` siguen en GET (legado). **No enviarlos.** El API arma `fiscal_address` y copia municipio → `fiscal_city`.

Ejemplo PUT:

```json
{
  "fiscal_rfc": "SSS2410213X9",
  "fiscal_person_type": "moral",
  "fiscal_razon_social": "SINERGY SW SOLUTIONS",
  "fiscal_postal_code": "22040",
  "fiscal_street": "CALLE ESPANA",
  "fiscal_exterior_number": "736",
  "fiscal_interior_number": null,
  "fiscal_colonia": "JUAREZ",
  "fiscal_localidad": null,
  "fiscal_municipio": "Tijuana",
  "fiscal_state": "Baja California",
  "fiscal_country": "MEX"
}
```

`400` si el CP no son 5 dígitos o el país no es 3 letras.

---

## Lectura (editar)

`GET /api/tenant/customers/:id` incluye los campos nuevos. Prefill el form con ellos.

Si `fiscal_street` / `fiscal_colonia` / `fiscal_municipio` vienen vacíos y sí hay `fiscal_address` o `fiscal_city` (clientes viejos): mostrar esos legado en **Calle** y **Municipio** como valor inicial para que el usuario los parta y guarde. No dejar el textarea único.

---

## Timbrado (OV)

En el XML CFDI 4.0:

| Atributo | Origen |
|----------|--------|
| `Receptor/@Nombre` | `fiscal_razon_social` |
| `Receptor/@DomicilioFiscalReceptor` | `fiscal_postal_code` |

Calle, colonia y municipio **no** van en el XML del receptor 4.0; el PDF de la factura **sí** los muestra en Domicilio fiscal (junto con C.P.).

---

## Docs relacionados

- Quitar almacén / razón social en Crear Cliente: `src/api/customers/docs/UI_CUSTOMER_RAZON_SOCIAL.md`
- Tab Registro: `src/api/customers/docs/UI_CUSTOMER_REGISTRATION.md`
- Crédito y factura POS: `src/api/customers/docs/UI_CUSTOMER_CREDIT.md`
- Timbrado OV: `src/api/sales-orders/docs/UI_SALES_ORDER_INVOICING.md`
