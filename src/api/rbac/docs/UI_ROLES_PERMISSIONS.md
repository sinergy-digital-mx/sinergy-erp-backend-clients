# UI — Roles y permisos (guía para Pollux)

Cómo consumir la API de RBAC: qué endpoint usar en cada pantalla, cómo agrupar permisos y cómo validar acceso en runtime (incluye Finkok / facturación electrónica).

---

## 1. Regla de oro: un endpoint por caso de uso

| Pantalla / acción | Endpoint | Qué devuelve |
|-------------------|----------|--------------|
| Listado de roles (sidebar izquierda) | `GET /api/tenant/roles` | Solo metadatos: `name`, `permission_count`, `is_admin`. **No trae permisos.** |
| Editor de permisos de un rol | `GET /api/tenant/roles/:roleId/permissions/available` | Árbol completo: `modules` + `categories` con `assigned: true/false`. **Usar este.** |
| Catálogo global (sin rol) | `GET /api/tenant/roles/permissions/available` | Igual estructura, sin flags `assigned`. |
| Guardar cambios de un rol | `PUT /api/tenant/roles/:roleId/permissions` | Body: `{ "permission_ids": ["uuid", ...] }` |
| Permisos del usuario logueado | Login → `user.permissions_flat` | Array plano `entity:action` (entity en **minúsculas**). |
| Refrescar permisos tras editar rol | `POST /api/auth/refresh` | Nuevo token con `permissions_flat` actualizado. |

**Error común:** usar `GET /api/tenant/roles` para pintar checkboxes. Ese JSON **nunca** incluirá `FiscalConfiguration`.

---

## 2. Respuesta del editor de permisos (estructura)

```http
GET /api/tenant/roles/{roleId}/permissions/available
```

```json
{
  "role": { "id": "uuid", "name": "Admin" },
  "modules": [ "... lista plana ordenada ..." ],
  "categories": [
    {
      "code": "finance",
      "label": "Finanzas",
      "sort_order": 6,
      "modules": [
        {
          "id": "uuid",
          "code": "billing",
          "name": "Facturación",
          "category": "finance",
          "permissions": [
            { "id": "uuid", "entity": "billing", "action": "ViewMenu", "assigned": true },
            { "id": "uuid", "entity": "FiscalConfiguration", "action": "Read", "assigned": true },
            { "id": "uuid", "entity": "FiscalConfiguration", "action": "Update", "assigned": true }
          ]
        },
        {
          "code": "electronic_invoicing",
          "name": "Facturación electrónica",
          "permissions": [
            { "entity": "electronic_invoicing", "action": "ViewMenu" },
            { "entity": "electronic_invoices", "action": "Stamp" }
          ]
        }
      ]
    }
  ]
}
```

### Cómo renderizar

1. Iterar **`categories`** (no hardcodear solo Ventas/Compras/Catálogos).
2. Mostrar `category.label` como encabezado (ej. **Finanzas**).
3. Dentro, un acordeón por `module.name` (ej. **Facturación**, **Facturación electrónica**).
4. Checkboxes por `permission.id` — al guardar, enviar los IDs marcados.

### Categorías posibles (`category.code` → label)

| code | label UI |
|------|----------|
| `sales` | Ventas |
| `purchases` | Compras |
| `catalogs` | Catálogos |
| `operations` | Operaciones |
| `crm` | CRM |
| `finance` | Finanzas |
| `real_estate` | Inmobiliario |
| `admin` | Administración |
| `settings` | Configuración |

Si el backend agrega una categoría nueva, **mostrarla igual** — no filtrar por lista fija.

---

## 3. FiscalConfiguration ≠ Facturación electrónica

Confusión frecuente en UI y búsquedas:

| Módulo en Roles (`module.code`) | Nombre UI | Entidad RBAC | Para qué sirve |
|---------------------------------|-----------|--------------|----------------|
| `billing` | **Facturación** | `FiscalConfiguration` | Razones emisoras, CSD, sucursales, **credenciales Finkok** |
| `electronic_invoicing` | **Facturación electrónica** | `electronic_invoices` | Timbrar, cancelar, sync SAT desde OV |

**Credenciales Finkok** (`GET/PUT /api/tenant/billing/finkok-configuration`) usan permiso:

- Ver: `FiscalConfiguration:Read`
- Editar: `FiscalConfiguration:Update`

Están en **Finanzas → Facturación**, no en Facturación electrónica.

Buscar `"fiscal"` en la pantalla puede dar 0 resultados si solo se busca en labels; la entidad en JSON es `FiscalConfiguration` y el módulo se llama **Facturación**.

---

## 4. Validar permisos en runtime (menús, tabs, botones)

### Fuente de verdad: login

```json
{
  "user": {
    "permissions_flat": [
      "fiscalconfiguration:Read",
      "fiscalconfiguration:Update",
      "electronic_invoices:Stamp"
    ]
  }
}
```

**Importante:** en `permissions_flat` la entidad va en **minúsculas** (`fiscalconfiguration`, no `FiscalConfiguration` ni `fiscal_configurations`).

### Helper recomendado

```ts
function hasPermission(
  permissionsFlat: string[],
  entity: string,
  action: string,
  options?: { isAdmin?: boolean },
): boolean {
  if (options?.isAdmin) return true;

  const needle = `${entity.toLowerCase()}:${action}`;
  return permissionsFlat.some((p) => p.toLowerCase() === needle);
}

// Tab Integración Finkok — ver formulario
hasPermission(perms, 'FiscalConfiguration', 'Read', { isAdmin: user.hasAdminRole });

// Tab Integración Finkok — guardar / probar
hasPermission(perms, 'FiscalConfiguration', 'Update', { isAdmin: user.hasAdminRole });

// OV → timbrar CFDI
hasPermission(perms, 'electronic_invoices', 'Stamp', { isAdmin: user.hasAdminRole });
```

### Admin

- JWT incluye `hasAdminRole: true` si el usuario tiene rol Admin.
- `GET /api/tenant/roles` devuelve `is_admin: true` en el objeto rol.
- Admin **bypasea** permisos en backend; en UI conviene respetar `hasAdminRole` para no mostrar banners falsos.

### Claves que NO existen (no usar)

| Incorrecto | Correcto |
|------------|----------|
| `fiscal_configurations:Read` | `FiscalConfiguration:Read` |
| `finkok:Read` | `FiscalConfiguration:Read` |
| `electronic_invoicing:Read` (para creds Finkok) | `FiscalConfiguration:Read` |

Comparación siempre **case-insensitive** en la parte `entity`.

---

## 5. Mapa pantalla → permiso → dónde asignarlo en Roles

| Pantalla | Permiso runtime | Módulo en editor Roles |
|----------|-----------------|------------------------|
| Configuración Fiscal → Razones sociales | `FiscalConfiguration:Read` | Finanzas → **Facturación** |
| Configuración Fiscal → Integración Finkok | `FiscalConfiguration:Read` / `Update` | Finanzas → **Facturación** |
| Modal razón → Registrar en Finkok | `FiscalConfiguration:Update` | Finanzas → **Facturación** |
| OV → Tab Facturación (ver) | `electronic_invoices:Read` | Finanzas → **Facturación electrónica** |
| OV → Timbrar | `electronic_invoices:Stamp` | Finanzas → **Facturación electrónica** |
| OV → Cancelar CFDI | `electronic_invoices:Cancel` | Finanzas → **Facturación electrónica** |
| OV → Sync SAT | `electronic_invoices:SyncSat` | Finanzas → **Facturación electrónica** |
| Usuarios → restablecer contraseña ajena | `User:Reset_Password` | Administración → **Usuarios** |

Onboarding Finkok requiere **ambos** módulos según la acción:

1. Credenciales globales → **Facturación** (`FiscalConfiguration:Update`).
2. Timbrar desde OV → **Facturación electrónica** (`electronic_invoices:Stamp`).

---

## 6. Flujo pantalla Roles (paso a paso)

```
1. GET /api/tenant/roles
   → pintar lista izquierda (Admin, Vendedor, …)

2. Usuario selecciona rol
   → GET /api/tenant/roles/{roleId}/permissions/available

3. Pintar categories[] completo
   → expandir Finanzas
   → Facturación: marcar FiscalConfiguration Read/Update si aplica
   → Facturación electrónica: marcar Stamp/Read/etc.

4. Guardar
   → recolectar permission.id de checkboxes marcados
   → PUT /api/tenant/roles/{roleId}/permissions
      { "permission_ids": ["uuid", ...] }

5. Usuarios afectados deben re-login o POST /auth/refresh
```

---

## 7. Flujo tab Integración Finkok (paso a paso)

```
1. Al montar tab:
   if (!hasPermission(flat, 'FiscalConfiguration', 'Read') && !hasAdminRole)
     → banner "Sin permisos" + no llamar API
   else
     → GET /api/tenant/billing/finkok-configuration

2. Si response null → formulario vacío (primera vez)

3. Guardar:
   if (!hasPermission(flat, 'FiscalConfiguration', 'Update') && !hasAdminRole)
     → deshabilitar botón
   else
     → PUT /api/tenant/billing/finkok-configuration

4. Probar conexión:
   → POST /api/tenant/billing/finkok-configuration/test-connection
   (requiere config guardada + Update)
```

No bloquear con `electronic_invoicing` ni `fiscal_configurations`.

---

## 8. Doc relacionada

- Credenciales Finkok: `src/api/electronic-invoicing/docs/UI_FINKOK_CONFIGURATION.md`
- Tab Facturación OV: `src/api/sales-orders/docs/UI_SALES_ORDER_INVOICING.md`
- Core CFDI: `src/api/electronic-invoicing/docs/UI_ELECTRONIC_INVOICING.md`
- Restablecer contraseña: `src/api/users/docs/UI_CHANGE_PASSWORD.md`
