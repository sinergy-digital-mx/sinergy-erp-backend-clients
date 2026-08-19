# UI — Configuración Finkok (por cliente)

Credenciales Finkok **a nivel de cliente del ERP**. Vive en **Configuración Fiscal → Integración Finkok**, no dentro de cada razón emisora.

Hay **dos cuentas independientes**: demo y producción. Guardar una **no** debe tocar la otra.

Las razones emisoras (RFC + CSD) se configuran aparte; Finkok las identifica por RFC al timbrar.

---

## 1. Pantalla Integración Finkok

Tres controles distintos. **No compartir el mismo `environment` ni el mismo form state.**

| Control | Qué es | API |
|---------|--------|-----|
| Dropdown **Ambiente activo para timbrar** | Default global de timbrado | `PATCH /stamping-environment` **solo** al cambiar este dropdown |
| Tab **Demo** | Usuario/contraseña de Integración (pruebas) | `PUT` con `"environment": "demo"` |
| Tab **Producción** | Usuario/contraseña productivos | `PUT` con `"environment": "production"` |

```
Estado UI (dos objetos, nunca uno solo):

demoForm  ← GET.environments.demo
prodForm  ← GET.environments.production
stamping  ← GET.stamping_environment   // solo el dropdown
```

**Prohibido:**

- Mandar el valor del dropdown “Ambiente activo” como `environment` del `PUT`. Si el tab es Demo y el dropdown está en Producción, el PUT sigue siendo `"environment": "demo"`.
- Un solo `form` compartido entre tabs. Al guardar Demo, **no** copiar usuario/password a Producción (ni al revés).
- Asignar la respuesta del `PUT` a ambos tabs. El PUT devuelve el **mismo bundle que GET**; hidratar `demoForm` / `prodForm` desde `environments.demo` / `environments.production`.
- Enviar `is_stamping_default` en el Guardar del tab. Eso lo hace el PATCH del dropdown.
- Exigir contraseña si `has_password === true`. Dejar el campo vacío y **omitir** `finkok_password` del body (no mandar `""`).
- Llamar `PATCH /stamping-environment` al hacer Guardar del tab.

**Guardar (tab Demo):**

```http
PUT /api/tenant/billing/finkok-configuration
```

```json
{
  "environment": "demo",
  "finkok_username": "madera",
  "is_active": 1
}
```

Incluir `finkok_password` **solo** si el usuario escribió una nueva. Alta (tab aún `null`): password obligatorio.

**Guardar (tab Producción):** igual, con `"environment": "production"` y el usuario productivo (`maderia-mzn`, no `madera`).

**Cambiar “Ambiente activo para timbrar”:**

```http
PATCH /api/tenant/billing/finkok-configuration/stamping-environment
{ "environment": "demo" }
```

**Probar conexión:** `POST /test-connection?environment=demo` o `=production` según **el tab abierto**, no según el dropdown.

### Por razón emisora (modal editar)

- Datos fiscales + CSD — ya existente
- Pestaña **Sucursales** — `UI_BILLING_BRANCHES.md`
- Badge + Vincular / Registrar — **no** guarda credenciales globales aquí

El dropdown de ambiente en ese modal es el de **consulta/alta Finkok**, distinto del “Ambiente activo para timbrar”.

---

## 2. Endpoints — credenciales Finkok (global cliente)

Base: `/api/tenant/billing/finkok-configuration`

| Acción | Método | Ruta | Permiso |
|--------|--------|------|---------|
| Obtener demo + prod | `GET` | `/` | `FiscalConfiguration:Read` |
| Guardar **un** ambiente | `PUT` | `/` | `FiscalConfiguration:Update` |
| Ambiente activo timbrado | `PATCH` | `/stamping-environment` | `FiscalConfiguration:Update` |
| Probar conexión | `POST` | `/test-connection?environment=demo` | `FiscalConfiguration:Update` |

Dos filas: `environments.demo` y `environments.production`. El `PUT.environment` es **obligatorio** y debe coincidir con el tab.

### GET / PUT — misma forma

```json
{
  "stamping_environment": "demo",
  "environments": {
    "demo": {
      "finkok_username": "madera",
      "environment": "demo",
      "is_active": 1,
      "is_stamping_default": 1,
      "has_password": true
    },
    "production": {
      "finkok_username": "maderia-mzn",
      "environment": "production",
      "is_active": 1,
      "is_stamping_default": 0,
      "has_password": true
    }
  }
}
```

Tras `PUT` de demo, `environments.production` **sigue igual**. Si Pollux ve el usuario demo en el tab Producción, el bug es de form state, no del API.

El wizard de OV **siempre** manda `environment` (`demo` | `production`) y **no** debe llamar el PATCH al cambiar el toggle. Ver `UI_SALES_ORDER_INVOICING.md` §9.

---

## 3. Vincular razón emisora existente en Finkok (sin borrar/recrear)

**La relación ERP ↔ Finkok es por RFC:**

`fiscal_configurations.rfc` = `taxpayer_id` en Finkok Registration API.

Ejemplo Madera: Finkok ya tiene `MZN980826EF2` (MADERERIA ZONA NORTE). En ERP la razón fiscal debe tener el **mismo RFC**. No hace falta `add` ni borrar en Finkok.

### Consultar estado (solo lectura)

```http
GET /api/tenant/fiscal-configurations/{id}/finkok-status?environment=demo
```

Respuesta:

```json
{
  "rfc": "MZN980826EF2",
  "exists_in_finkok": true,
  "finkok_registration_status": "pending",
  "finkok_remote_status": "A",
  "finkok_stamps_counter": 1,
  "finkok_stamps_credit": null,
  "environment": "demo",
  "message": "..."
}
```

### Vincular (RFC ya existe en Finkok)

```http
POST /api/tenant/fiscal-configurations/{id}/register-finkok
```

```json
{
  "mode": "verify",
  "environment": "demo"
}
```

- Llama Registration **get** con credenciales `madera` + RFC de la razón.
- Si Finkok responde el RFC → `finkok_registration_status = registered` (vinculado).

### Dar de alta en Finkok desde ERP (solo si NO existe)

```json
{
  "mode": "add",
  "environment": "demo",
  "add_if_missing": true
}
```

Requiere CSD (.cer, .key, password) en la razón. Si ya existe, hace **link** igual que `verify`.

### Vinculación manual (sin llamar Finkok)

```json
{ "mode": "link_only" }
```

Ya **no** marca `registered` ni `exists_in_finkok: true`. No usar este modo en los botones del modal.

### Botones UI en modal razón emisora

Siempre mandar el `environment` del dropdown (`demo` | `production`). Demo y producción son listados distintos en Finkok.

| Botón | API |
|-------|-----|
| Verificar en Finkok | `GET .../finkok-status?environment=` |
| Vincular con Finkok | `POST .../register-finkok` `{ "mode": "verify", "environment" }` |
| Registrar en Finkok | `POST .../register-finkok` `{ "mode": "add", "environment", "add_if_missing": true }` |

Toast de éxito **solo** si `exists_in_finkok === true`. Si es `false`, mostrar `message` / `finkok_registration_error` como error.

Badges:

| Condición | Badge |
|-----------|-------|
| `exists_in_finkok === true` | Registrada / vinculada |
| `finkok_registration_status === failed` | Error — texto `finkok_registration_error` |
| resto | Pendiente Finkok |

No pintar verde si `exists_in_finkok` es `false`. `EN FINKOK` en el detalle = `exists_in_finkok`.

WSDL Registration: [demo](https://demo-facturacion.finkok.com/servicios/soap/registration.wsdl) · [prod](https://facturacion.finkok.com/servicios/soap/registration.wsdl)

---

## 4. Onboarding (orden obligatorio)

1. **Integración Finkok** (UI) → tokens SOAP de **timbrado** (demo / production). Probar conexión usa esos tokens.
2. **Reseller en `.env`** (servidor, no UI) → alta/consulta de RFC (`register-finkok` / `finkok-status`):
   - `FINKOK_RESELLER_DEMO_USERNAME` / `FINKOK_RESELLER_DEMO_PASSWORD`
   - `FINKOK_RESELLER_PRODUCTION_USERNAME` / `FINKOK_RESELLER_PRODUCTION_PASSWORD`
   Usuario administrador del portal (correo de la Cuenta Integración), no el token `maderia-mzn`.
3. Razón emisora en ERP con el RFC a facturar (`MFH210729R84`). **Registrar** lo da de alta en Clientes Finkok de ese ambiente.
4. Timbrar desde OV con el token del tab Integración Finkok. Para MFH use un token activo **sin RFC amarrado**.

---

## 5. Impacto en otras pantallas

| Pantalla | Comportamiento |
|----------|----------------|
| OV → Tab Facturación | Si `GET finkok-configuration` es null → banner + link aquí |
| OV → Timbrar | Si razón `finkok_registration_status !== registered` → bloqueado |
| Ambiente demo | Banner en wizard si el toggle de timbrado es `demo`. No usar solo `stamping_environment`. |
| Toggle Demo/Prod al timbrar | Override por factura. Ver `UI_SALES_ORDER_INVOICING.md` §9. El default del toggle es hostname (`localhost` → demo, resto → production), no el PATCH global. |

---

## 6. Seguridad UI

- Campo password tipo `password`, sin autofill en logs.
- No cachear password en localStorage.
- Solo usuarios con `FiscalConfiguration:Update` ven formulario editable.

### Permisos en UI (importante)

Ver guía completa: `src/api/rbac/docs/UI_ROLES_PERMISSIONS.md`

El login devuelve `user.permissions_flat` con formato `entity:action` (**entity en minúsculas**).

| Acción UI | Permiso |
|-----------|---------|
| Ver tab / cargar config | `FiscalConfiguration:Read` → en JWT: `fiscalconfiguration:Read` |
| Editar / guardar / probar | `FiscalConfiguration:Update` → en JWT: `fiscalconfiguration:Update` |

Helper (comparación case-insensitive):

```ts
permissions_flat.some(p => p.toLowerCase() === 'fiscalconfiguration:Read')
```

**No usar** `fiscal_configurations:Read` — no existe en RBAC.

En Roles, asignar en **Finanzas → Facturación** (módulo `billing`), no en Facturación electrónica.

Mismo permiso que el listado de razones emisoras (`GET /api/tenant/fiscal-configurations`).

---

## 7. Doc relacionada

- Tab Facturación en OV: `src/api/sales-orders/docs/UI_SALES_ORDER_INVOICING.md`
- Sync SAT / endpoints core: `src/api/electronic-invoicing/docs/UI_ELECTRONIC_INVOICING.md`
