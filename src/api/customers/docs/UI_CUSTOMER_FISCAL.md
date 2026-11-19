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

| UI                   | Body                     | Notas                                                                                                                                  |
| -------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| RFC                  | `fiscal_rfc`             | Ya existe                                                                                                                              |
| Tipo de persona      | `fiscal_person_type`     | `fisica` \| `moral` \| `otro`                                                                                                          |
| Razón social         | `fiscal_razon_social`    | Texto legal CSF (CFDI `@Nombre`). Mismo campo que el tab Información del Cliente: `src/api/customers/docs/UI_CUSTOMER_RAZON_SOCIAL.md` |
| Código postal        | `fiscal_postal_code`     | 5 dígitos. CFDI `@DomicilioFiscalReceptor`                                                                                             |
| Calle / vialidad     | `fiscal_street`          | Nombre de vialidad CSF                                                                                                                 |
| No. exterior         | `fiscal_exterior_number` |                                                                                                                                        |
| No. interior         | `fiscal_interior_number` | Vacío si no aplica                                                                                                                     |
| Colonia              | `fiscal_colonia`         |                                                                                                                                        |
| Localidad            | `fiscal_localidad`       | Opcional                                                                                                                               |
| Municipio o alcaldía | `fiscal_municipio`       | No usar “Ciudad”                                                                                                                       |
| Entidad federativa   | `fiscal_state`           | Ya existía                                                                                                                             |
| País                 | `fiscal_country`         | Clave SAT `c_Pais`, default `MEX` si hay domicilio                                                                                     |

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

`400` si el CP no son 5 dígitos o el país no es 3 letras. `email`, CP, país y tipo de persona vacíos (`""`) se omiten: no tumbar el alta.

---

## Validación al guardar (Crear / Editar)

Único obligatorio para **crear**: **Nombre**. Email, teléfono, fiscal y registro son opcionales.

Si el form es inválido (nombre vacío, email mal escrito, CP incompleto):

- toast `Faltan datos` con los nombres de campo (`Revisa: Nombre, Código postal.`)
- saltar a la pestaña del primer error y marcar en rojo
- no mandar `email: ""` ni CP a medias; vacío = omitir el campo

---

## Cargar constancia SAT (detalle del cliente)

En el tab **Información Fiscal** del detalle, botón **Cargar constancia SAT** (quien puede editar el cliente).

El usuario elige el PDF de la **Cédula de Identificación Fiscal** / Constancia de Situación Fiscal descargada del SAT. El API lee el texto y guarda:

| Dato CSF                                        | Campo                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| RFC                                             | `fiscal_rfc`                                                             |
| 12 caracteres / 13 caracteres                   | `fiscal_person_type` `moral` / `fisica`                                  |
| Denominación/Razón Social, o Nombre + apellidos | `fiscal_razon_social` (sin régimen de capital)                           |
| Código Postal                                   | `fiscal_postal_code`                                                     |
| Nombre de Vialidad                              | `fiscal_street`                                                          |
| Número Exterior                                 | `fiscal_exterior_number`                                                 |
| Número Interior                                 | `fiscal_interior_number` (`SIN NUMERO` → vacío)                          |
| Colonia / Localidad / Municipio / Entidad       | `fiscal_colonia`, `fiscal_localidad`, `fiscal_municipio`, `fiscal_state` |
| País                                            | `fiscal_country` = `MEX`                                                 |

`POST /api/tenant/customers/:id/fiscal-constancia`  
`multipart/form-data`, campo `file` (PDF, máx. 10 MB). Permiso `customers` / `Update`.

Respuesta: el cliente actualizado, igual que el `PUT`.

`400` si el archivo no es PDF, no tiene texto (foto o escaneo) o no se leen RFC, nombre y código postal. Una foto no sirve: tiene que ser el PDF del SAT.

Reemplaza los datos fiscales que ya tenía el cliente. No cambia empresa, crédito ni registro.

---

## Lectura (editar)

`GET /api/tenant/customers/:id` incluye los campos nuevos. Prefill el form con ellos.

Si `fiscal_street` / `fiscal_colonia` / `fiscal_municipio` vienen vacíos y sí hay `fiscal_address` o `fiscal_city` (clientes viejos): mostrar esos legado en **Calle** y **Municipio** como valor inicial para que el usuario los parta y guarde. No dejar el textarea único.

---

## Timbrado (OV)

En el XML CFDI 4.0:

| Atributo                            | Origen                |
| ----------------------------------- | --------------------- |
| `Receptor/@Nombre`                  | `fiscal_razon_social` |
| `Receptor/@DomicilioFiscalReceptor` | `fiscal_postal_code`  |

Calle, colonia y municipio **no** van en el XML del receptor 4.0; el PDF de la factura **sí** los muestra en Domicilio fiscal (junto con C.P.).

---

## Docs relacionados

- Quitar almacén / razón social en Crear Cliente: `src/api/customers/docs/UI_CUSTOMER_RAZON_SOCIAL.md`
- Tab Registro: `src/api/customers/docs/UI_CUSTOMER_REGISTRATION.md`
- Crédito y factura POS: `src/api/customers/docs/UI_CUSTOMER_CREDIT.md`
- Timbrado OV: `src/api/sales-orders/docs/UI_SALES_ORDER_INVOICING.md`
