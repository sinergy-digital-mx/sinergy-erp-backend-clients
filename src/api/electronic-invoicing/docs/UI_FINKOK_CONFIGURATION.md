# UI — Configuración Finkok (por cliente)

Credenciales Finkok **a nivel de cliente del ERP** (una sola cuenta Finkok por cliente). Vive dentro del módulo **Configuración Fiscal**, no dentro de cada razón emisora.

Las razones emisoras (RFC + CSD) se configuran aparte; Finkok las identifica por RFC al timbrar.

---

## 1. Ubicación en pantalla

### Opción recomendada: sección global en Configuración Fiscal

En la pantalla principal de **Configuración Fiscal** (`/fiscal-configurations`), agregar:

**A)** Botón o tab superior **Integración Finkok** (config global del cliente), **o**  
**B)** Panel/card fijo arriba del listado de razones emisoras.

```
┌──────────────────────────────────────────────────────────────┐
│  Configuración Fiscal                                        │
├──────────────────────────────────────────────────────────────┤
│  ┌─ Integración Finkok ────────────────────────────────────┐ │
│  │ Usuario:     [madera                    ]               │ │
│  │ Contraseña:  [••••••••                  ]               │ │
│  │ Ambiente:    (•) Demo  ( ) Producción                   │ │
│  │ Activo:      [✓]                                        │ │
│  │ Última prueba: connected · 2026-07-08 12:00             │ │
│  │ [Guardar]  [Probar conexión]                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  Razones emisoras (tabla existente)                          │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
```

### Por razón emisora (modal editar)

Dentro del modal **Editar configuración fiscal**, mantener:

- Datos fiscales + CSD (.cer / .key) — ya existente
- Pestaña **Sucursales** — ya existente (`UI_BILLING_BRANCHES.md`)
- **Nuevo:** badge + botón **Registrar en Finkok** (no guarda credenciales aquí)

| Elemento | Comportamiento |
|----------|----------------|
| Badge estado | `finkok_registration_status`: pending / registered / failed |
| Botón Registrar | `POST /api/tenant/fiscal-configurations/{id}/register-finkok` |
| NoCertificado | Campo `certificate_serial_number` (requerido para cancelar) |

---

## 2. Endpoints — credenciales Finkok (global cliente)

Base: `/api/tenant/billing/finkok-configuration`

| Acción | Método | Ruta | Permiso |
|--------|--------|------|---------|
| Obtener demo + prod | `GET` | `/` | `FiscalConfiguration:Read` |
| Guardar un ambiente | `PUT` | `/` | `FiscalConfiguration:Update` |
| Ambiente activo timbrado | `PATCH` | `/stamping-environment` | `FiscalConfiguration:Update` |
| Probar conexión | `POST` | `/test-connection?environment=demo` | `FiscalConfiguration:Update` |

**Dos credenciales por cliente:** una fila por `environment` (`demo` y `production`). El body de `PUT` **debe** incluir `environment`.

### GET — respuesta (ambos ambientes)

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
    "production": null
  }
}
```

### PUT — body (por ambiente)

```json
{
  "environment": "demo",
  "finkok_username": "madera",
  "finkok_password": "P4ssW0Rd",
  "is_active": 1,
  "is_stamping_default": 1
}
```

Repetir con `"environment": "production"` y credenciales productivas.

### PATCH stamping-environment

```json
{ "environment": "demo" }
```

Define qué credenciales usa el timbrado/cancelación por defecto.

### UI sugerida

Dos formularios (tabs **Demo** / **Producción**), cada uno con su usuario/contraseña. Selector **“Ambiente activo para timbrar”**.

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

### Botones UI en modal razón emisora

| Botón | API |
|-------|-----|
| Verificar en Finkok | `GET .../finkok-status` |
| Vincular con Finkok | `POST .../register-finkok` `{ "mode": "verify" }` |
| Registrar en Finkok | `POST .../register-finkok` `{ "mode": "add" }` |

Badges:

| Status | Badge |
|--------|-------|
| `pending` | Pendiente Finkok |
| `registered` | Registrada / vinculada |
| `failed` | Error — tooltip `finkok_registration_error` |

WSDL Registration: [demo](https://demo-facturacion.finkok.com/servicios/soap/registration.wsdl) · [prod](https://facturacion.finkok.com/servicios/soap/registration.wsdl)

---

## 4. Onboarding (orden obligatorio)

1. **Integración Finkok** → guardar credenciales **demo** (`madera`) y luego **production** (cuando existan).
2. Razón emisora en ERP con **mismo RFC** que en Finkok (`MZN980826EF2`).
3. **Vincular** → `POST register-finkok` con `mode: verify` (no requiere borrar en Finkok).
4. Si el RFC no existiera en Finkok → `mode: add` con CSD cargado.
5. Timbrar desde OV (tab Facturación).

---

## 5. Impacto en otras pantallas

| Pantalla | Comportamiento |
|----------|----------------|
| OV → Tab Facturación | Si `GET finkok-configuration` es null → banner + link aquí |
| OV → Timbrar | Si razón `finkok_registration_status !== registered` → bloqueado |
| Ambiente demo | Banner global “Modo pruebas Finkok” cuando `environment === 'demo'` |

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
