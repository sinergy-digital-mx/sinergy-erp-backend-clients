# UI — Módulo Metas

Metas mensuales de ventas por **sucursal** o por **rol de usuario** (ej. Vendedor, Vendedor área). Multi-tenant: cada cliente elige el rol que aplica.

---

## Menú

| Campo | Valor |
|-------|-------|
| Nombre | Metas |
| Código módulo | `goals` |
| Permisos | `Goals:ViewMenu`, `Goals:Read`, `Goals:Create`, `Goals:Update`, `Goals:Delete` |
| Ruta sugerida | `/goals` o `/metas` |

---

## Endpoints

Base: `/api/tenant/goals`

| Acción | Método | Ruta |
|--------|--------|------|
| **Config comisión** | `GET` | `/goals/settings` |
| **Guardar comisión** | `PATCH` | `/goals/settings` |
| Listar | `GET` | `/goals?billing_branch_id=&period_year=2026&period_month=6&is_active=true` |
| Detalle | `GET` | `/goals/:id` |
| Crear | `POST` | `/goals` |
| Actualizar | `PATCH` | `/goals/:id` |
| Eliminar | `DELETE` | `/goals/:id` |

---

## Comisión activa (%) — por tenant

Configurable en el módulo Metas. El reporte (`view=commissions`) la usa automáticamente (no hardcodear 1 ni 4.5 en el front). Vista ventas no muestra comisión.

### Leer

```http
GET /api/tenant/goals/settings
```

```json
{
  "commission_rate": 1,
  "is_default": true,
  "updated_at": null,
  "updated_by": null
}
```

| Campo | Significado |
|-------|-------------|
| `commission_rate` | % sobre monto vendido (1 = 1%) |
| `is_default` | `true` si aún no guardaron config (usa default 1%) |

### Guardar

```http
PATCH /api/tenant/goals/settings
Content-Type: application/json

{ "commission_rate": 1.5 }
```

Rango permitido: `0` – `100`.

### UI — sección en pantalla Metas

Arriba del listado de metas (o en un tab **Configuración**):

```
┌─────────────────────────────────────────────┐
│ Comisión activa                             │
│ [ 1.00 ] % sobre monto vendido    [Guardar] │
│ Se aplica al Reporte de Ventas Zona Norte   │
└─────────────────────────────────────────────┘
```

```typescript
// Al entrar a Metas
const settings = await api.get('/tenant/goals/settings');
this.commissionRate = settings.commission_rate;

// Guardar
await api.patch('/tenant/goals/settings', {
  commission_rate: this.commissionRate,
});
```

En el reporte Zona Norte: **no enviar** `commission_rate` en el query; el backend toma la del tenant.

Roles del tenant (para el select):

```
GET /api/tenant/roles
```

Sucursales:

```
GET /api/tenant/billing/branches
```

---

## Crear meta

```json
POST /api/tenant/goals
{
  "goal_scope": "branch",
  "billing_branch_id": "uuid-sucursal",
  "metric_type": "amount",
  "target_value": 100000,
  "period_type": "month",
  "period_year": 2026,
  "period_month": 6,
  "notes": "Meta junio CIMA Tijuana"
}
```

### Meta por vendedor (rol)

```json
{
  "goal_scope": "user_role",
  "billing_branch_id": "uuid-sucursal",
  "role_id": "uuid-rol-vendedor",
  "metric_type": "sales_count",
  "target_value": 50,
  "period_type": "month",
  "period_year": 2026,
  "period_month": 6
}
```

| Campo | Valores | Notas |
|-------|---------|-------|
| `goal_scope` | `branch` \| `user_role` | Sucursal completa vs cada usuario del rol |
| `role_id` | uuid | **Obligatorio** si `user_role` |
| `metric_type` | `sales_count` \| `amount` | # ventas o $ |
| `target_value` | number | Meta a alcanzar |
| `period_type` | `month` (default) | También existen `week`, `year`, `custom` (futuro) |
| `period_year` / `period_month` | int | Obligatorios en metas mensuales |

---

## UI — CRUD Metas

```
┌──────────────────────────────────────────────────────────┐
│ Metas                              [ + Nueva meta ]      │
├──────────────────────────────────────────────────────────┤
│ Filtros: [Sucursal ▼] [Año] [Mes] [Activas]              │
├──────────────────────────────────────────────────────────┤
│ Sucursal      Tipo        Métrica   Meta    Periodo      │
│ CIMA Tijuana  Sucursal    $         100,000 Jun 2026     │
│ CIMA Tijuana  Rol:Vend.   # ventas  50      Jun 2026     │
└──────────────────────────────────────────────────────────┘
```

Formulario:

1. Tipo: radio **Sucursal** / **Por rol de usuario**
2. Sucursal (select)
3. Si por rol → select de roles del tenant (`role_id`)
4. Métrica: **Cantidad de ventas** / **Monto $**
5. Valor meta
6. Periodo: mes/año (default mes actual)

---

## Editar meta (activas e inactivas)

**Las metas activas SÍ se pueden editar.** El backend no bloquea por `is_active`.

No deshabilitar campos del modal cuando `is_active === true`. Todos los campos del formulario deben quedar habilitados.

```http
PATCH /api/tenant/goals/:id
Content-Type: application/json
```

```json
{
  "goal_scope": "user_role",
  "billing_branch_id": "uuid",
  "role_id": "uuid",
  "metric_type": "amount",
  "target_value": 300000,
  "period_type": "month",
  "period_year": 2026,
  "period_month": 7,
  "is_active": true,
  "notes": "TEst"
}
```

| Campo | Editable |
|-------|----------|
| Tipo (`goal_scope`) | Sí |
| Sucursal | Sí |
| Rol | Sí (si `user_role`) |
| Métrica | Sí |
| Valor meta | Sí |
| Año / Mes | Sí |
| Estado (`is_active`) | Sí — Activa / Inactiva |
| Notas | Sí |

```typescript
// Modal "Editar meta" — NO hacer esto:
// disabled = goal.is_active

// Correcto: siempre editables
async saveGoal(id: string, form: UpdateGoalForm) {
  return api.patch(`/tenant/goals/${id}`, {
    goal_scope: form.goal_scope,
    billing_branch_id: form.billing_branch_id,
    role_id: form.goal_scope === 'user_role' ? form.role_id : null,
    metric_type: form.metric_type,
    target_value: form.target_value,
    period_type: 'month',
    period_year: form.period_year,
    period_month: form.period_month,
    is_active: form.is_active,
    notes: form.notes,
  });
}
```

---

## Checklist

- [ ] Entrada menú con `Goals:ViewMenu`
- [ ] Sección **Comisión activa %** (`GET/PATCH /goals/settings`)
- [ ] Listado con filtros sucursal / mes / año
- [ ] Crear meta branch y user_role
- [ ] Select de roles dinámico (no hardcodear "Vendedor")
- [ ] **Editar metas activas** (campos habilitados, no bloquear por `is_active`)
- [ ] Editar target / activar-desactivar
- [ ] Eliminar
- [ ] Reporte Zona Norte **sin** `commission_rate` en query

