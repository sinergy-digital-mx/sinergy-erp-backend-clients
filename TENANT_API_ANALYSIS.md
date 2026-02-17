# 🔍 Análisis: Tenant API vs Admin API

## 📊 Estado Actual

Este backend está **MEZCLADO** entre:
- ✅ **Tenant-level** (lo que debería quedarse)
- ❌ **Admin-level** (lo que debería removerse)

---

## ✅ MANTENER - Tenant Level

### 1. **Auth Module**
```
POST /auth/login
```
- ✅ Login de usuarios del tenant
- ✅ Generación de JWT
- ✅ Extracción de tenant_id de la sesión

### 2. **Leads Module** (CORE)
```
GET /leads (con paginación y búsqueda)
GET /leads/:id (con addresses y activities)
POST /leads
PUT /leads/:id
DELETE /leads/:id
POST /leads/:leadId/activities
GET /leads/:leadId/activities
PATCH /leads/:leadId/activities/:id
DELETE /leads/:leadId/activities/:id
```
- ✅ Gestión de leads del tenant
- ✅ Actividades de leads
- ✅ Direcciones de leads

### 3. **Customers Module** (CORE)
```
GET /customers
GET /customers/:id
POST /customers
PUT /customers/:id
DELETE /customers/:id
```
- ✅ Gestión de clientes del tenant
- ✅ Direcciones de clientes

### 4. **Users Module** (Tenant Users)
```
GET /users (solo del tenant)
GET /users/:id (solo del tenant)
POST /users (crear usuario en el tenant)
PUT /users/:id (actualizar usuario del tenant)
DELETE /users/:id (eliminar usuario del tenant)
```
- ✅ Gestión de usuarios DENTRO del tenant
- ✅ Asignación de roles DENTRO del tenant
- ✅ Permisos DENTRO del tenant

### 5. **RBAC - Roles & Permissions** (Tenant Level)
```
GET /rbac/roles (roles del tenant)
POST /rbac/roles (crear rol en el tenant)
PUT /rbac/roles/:id (actualizar rol del tenant)
DELETE /rbac/roles/:id (eliminar rol del tenant)

GET /rbac/permissions (permisos disponibles)
POST /rbac/role-permissions (asignar permisos a rol)
DELETE /rbac/role-permissions/:id

GET /rbac/audit-logs (logs del tenant)
```
- ✅ Gestión de roles DENTRO del tenant
- ✅ Asignación de permisos a roles
- ✅ Auditoría de acciones del tenant

---

## ❌ REMOVER - Admin Level

### 1. **Tenant Controller** (COMPLETO)
```
POST /rbac/tenants (crear tenant)
GET /rbac/tenants/:tenantId (obtener tenant)
PUT /rbac/tenants/:tenantId/status (activar/desactivar)
DELETE /rbac/tenants/:tenantId (eliminar tenant)
POST /rbac/tenants/:tenantId/initialize-roles
GET /rbac/tenants/:tenantId/validate-references
```
- ❌ **REMOVER COMPLETAMENTE**
- ❌ Esto es admin-level (crear/eliminar tenants)
- ❌ Debe estar en backend separado

### 2. **Data Cleanup Controller**
```
POST /rbac/cleanup/perform
POST /rbac/cleanup/integrity-check
GET /rbac/cleanup/last-cleanup
GET /rbac/cleanup/status
```
- ❌ **REMOVER COMPLETAMENTE**
- ❌ Esto es admin-level (limpieza de datos)
- ❌ Debe estar en backend separado

### 3. **Tenant Context Middleware**
```
src/api/rbac/middleware/tenant-context.middleware.ts
```
- ❌ **REMOVER**
- ❌ No es necesario si el tenant viene del JWT
- ❌ El JWT ya contiene tenant_id

---

## 🔄 REFACTORIZAR - Cambios Necesarios

### 1. **Users Module**
**Cambio**: Asegurar que SOLO gestiona usuarios del tenant actual
```typescript
// ✅ CORRECTO
findAll(tenantId: string) // Filtra por tenant_id del JWT

// ❌ INCORRECTO
findAll() // Sin filtro de tenant
```

### 2. **RBAC Module**
**Cambio**: Remover endpoints de tenant, mantener roles/permisos
```typescript
// ✅ MANTENER
POST /rbac/roles (crear rol en el tenant)
POST /rbac/permissions (asignar permisos)

// ❌ REMOVER
POST /rbac/tenants (crear tenant)
DELETE /rbac/tenants (eliminar tenant)
```

### 3. **Audit Logs**
**Cambio**: Solo mostrar logs del tenant actual
```typescript
// ✅ CORRECTO
GET /rbac/audit-logs?tenant_id=current_tenant

// ❌ INCORRECTO
GET /rbac/audit-logs (sin filtro)
```

---

## 📋 Checklist de Limpieza

### Archivos a REMOVER:
- [ ] `src/api/rbac/controllers/tenant.controller.ts`
- [ ] `src/api/rbac/controllers/data-cleanup.controller.ts`
- [ ] `src/api/rbac/middleware/tenant-context.middleware.ts`
- [ ] `src/api/rbac/services/data-cleanup.service.ts`
- [ ] `src/api/rbac/scripts/complete-setup.script.ts`
- [ ] `src/api/rbac/scripts/simple-complete-setup.script.ts`
- [ ] `src/api/rbac/scripts/simple-setup.script.ts`

### Archivos a MANTENER:
- [ ] `src/api/auth/` (completo)
- [ ] `src/api/leads/` (completo)
- [ ] `src/api/customers/` (completo)
- [ ] `src/api/users/` (con validación de tenant)
- [ ] `src/api/rbac/services/role.service.ts`
- [ ] `src/api/rbac/services/permission.service.ts`
- [ ] `src/api/rbac/services/audit-log.service.ts`
- [ ] `src/api/rbac/controllers/audit-log.controller.ts` (solo logs del tenant)

### Archivos a REFACTORIZAR:
- [ ] `src/api/rbac/controllers/audit-log.controller.ts` (filtrar por tenant)
- [ ] `src/api/users/users.service.ts` (validar tenant)
- [ ] `src/app.module.ts` (remover imports innecesarios)

---

## 🎯 Estructura Final Recomendada

```
src/api/
├── auth/                    ✅ MANTENER
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── jwt-auth.guard.ts
├── leads/                   ✅ MANTENER
│   ├── leads.controller.ts
│   ├── leads.service.ts
│   ├── lead-activities.controller.ts
│   ├── lead-activities.service.ts
│   └── dto/
├── customers/              ✅ MANTENER
│   ├── customers.controller.ts
│   ├── customers.service.ts
│   └── dto/
├── users/                  ✅ MANTENER (refactorizar)
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
└── rbac/                   ⚠️ REFACTORIZAR
    ├── controllers/
    │   ├── audit-log.controller.ts  ✅ (solo tenant logs)
    │   ├── tenant.controller.ts     ❌ REMOVER
    │   └── data-cleanup.controller.ts ❌ REMOVER
    ├── services/
    │   ├── role.service.ts          ✅ MANTENER
    │   ├── permission.service.ts    ✅ MANTENER
    │   ├── audit-log.service.ts     ✅ MANTENER
    │   ├── tenant.service.ts        ❌ REMOVER
    │   └── data-cleanup.service.ts  ❌ REMOVER
    ├── guards/
    │   └── permission.guard.ts      ✅ MANTENER
    ├── decorators/
    │   └── require-permissions.decorator.ts ✅ MANTENER
    └── middleware/
        └── tenant-context.middleware.ts ❌ REMOVER
```

---

## 🚀 Beneficios de la Limpieza

1. **Seguridad**: No hay endpoints admin en el tenant API
2. **Claridad**: Código más enfocado en tenant-level
3. **Mantenibilidad**: Menos código innecesario
4. **Escalabilidad**: Separación clara de responsabilidades
5. **Performance**: Menos rutas y servicios innecesarios