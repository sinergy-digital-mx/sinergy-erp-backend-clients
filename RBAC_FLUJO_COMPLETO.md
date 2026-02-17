# 🔐 Flujo Completo: Admin → Tenant → Usuarios

## 📊 Diagrama del Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN BACKEND (Futuro)                     │
├─────────────────────────────────────────────────────────────────┤
│ 1. Crear Módulos: Leads, Customers, Reports, Analytics         │
│ 2. Definir Permisos por Módulo: Create, Read, Update, Delete   │
│ 3. Habilitar Módulos para Tenant                               │
│    POST /admin/tenants/{tenantId}/modules                      │
│    { "module_ids": ["leads", "customers"] }                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    TENANT BACKEND (Actual)                      │
├─────────────────────────────────────────────────────────────────┤
│ 1. Ver Módulos Habilitados                                      │
│    GET /tenant/modules                                          │
│    ✅ Ve: Leads, Customers                                      │
│    ❌ No ve: Reports, Analytics                                 │
│                                                                 │
│ 2. Crear Roles con Permisos de Módulos Habilitados             │
│    POST /tenant/roles                                           │
│    {                                                            │
│      "name": "Sales Manager",                                   │
│      "permission_ids": [                                        │
│        "leads-create",    ✅ Válido                             │
│        "leads-read",      ✅ Válido                             │
│        "customers-read"   ✅ Válido                             │
│      ]                                                          │
│    }                                                            │
│                                                                 │
│ 3. Asignar Roles a Usuarios                                     │
│    POST /tenant/users/{userId}/roles/{roleId}                  │
│                                                                 │
│ 4. Usuarios Obtienen Permisos de Sus Roles                     │
│    GET /tenant/users/{userId}/permissions                      │
│    Respuesta: ["leads:create", "leads:read", "customers:read"] │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIOS FINALES                             │
├─────────────────────────────────────────────────────────────────┤
│ Acceden a endpoints con sus permisos:                           │
│ GET /leads          ✅ Permitido (tiene leads:read)             │
│ POST /leads         ✅ Permitido (tiene leads:create)           │
│ GET /reports        ❌ Denegado (no tiene reports:read)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Paso a Paso: Ejemplo Real

### **Paso 1: Admin Habilita Módulos (Admin Backend - Futuro)**

```bash
# Admin crea módulos (una sola vez)
POST /admin/modules
{
  "name": "Leads",
  "code": "leads",
  "description": "Lead management"
}

# Admin define permisos para Leads (una sola vez)
POST /admin/modules/{leadsModuleId}/permissions
{ "action": "Create", "description": "Create new leads" }
{ "action": "Read", "description": "View leads" }
{ "action": "Update", "description": "Update leads" }
{ "action": "Delete", "description": "Delete leads" }

# Admin habilita Leads para Tenant Divino
POST /admin/tenants/{divinoTenantId}/modules
{
  "module_ids": ["leads-module-id", "customers-module-id"]
}

# Resultado en BD:
tenant_modules:
├── id: uuid1, tenant_id: divino, module_id: leads, is_enabled: true
└── id: uuid2, tenant_id: divino, module_id: customers, is_enabled: true
```

### **Paso 2: Tenant Ve Sus Módulos (Tenant Backend - YA EXISTE)**

```bash
# Tenant hace login y obtiene su JWT
POST /auth/login
{
  "email": "admin@divino.com",
  "password": "123"
}
# Respuesta: { "access_token": "eyJhbGc..." }

# Tenant ve qué módulos tiene habilitados
GET /tenant/modules
Authorization: Bearer eyJhbGc...

# Respuesta:
{
  "modules": [
    {
      "id": "leads-module-id",
      "name": "Leads",
      "code": "leads",
      "is_enabled": true,
      "permissions": [
        { "id": "perm-1", "action": "Create", "description": "..." },
        { "id": "perm-2", "action": "Read", "description": "..." },
        { "id": "perm-3", "action": "Update", "description": "..." },
        { "id": "perm-4", "action": "Delete", "description": "..." }
      ]
    },
    {
      "id": "customers-module-id",
      "name": "Customers",
      "code": "customers",
      "is_enabled": true,
      "permissions": [...]
    }
  ]
}

# ⚠️ IMPORTANTE: Solo ve Leads y Customers
# ❌ NO ve Reports, Analytics, etc (no están habilitados)
```

### **Paso 3: Tenant Crea Roles (Tenant Backend - YA EXISTE)**

```bash
# Tenant crea rol "Sales Manager" con permisos de Leads y Customers
POST /tenant/roles
Authorization: Bearer eyJhbGc...
{
  "name": "Sales Manager",
  "description": "Manages sales team",
  "permission_ids": [
    "perm-1",  // leads:create ✅
    "perm-2",  // leads:read ✅
    "perm-3",  // leads:update ✅
    "perm-4"   // leads:delete ✅
  ]
}

# ⚠️ VALIDACIÓN AUTOMÁTICA:
# Si intenta asignar un permiso de "Reports" (no habilitado):
# ❌ Error: "Permission belongs to a module that is not enabled for this tenant"

# Respuesta exitosa:
{
  "role": {
    "id": "role-sales-manager",
    "name": "Sales Manager",
    "description": "Manages sales team",
    "is_system_role": false,
    "created_at": "2024-01-27T14:30:00Z"
  },
  "permissions": [
    { "id": "perm-1", "module": "leads", "action": "Create" },
    { "id": "perm-2", "module": "leads", "action": "Read" },
    { "id": "perm-3", "module": "leads", "action": "Update" },
    { "id": "perm-4", "module": "leads", "action": "Delete" }
  ]
}
```

### **Paso 4: Tenant Asigna Roles a Usuarios (Tenant Backend - YA EXISTE)**

```bash
# Tenant asigna rol "Sales Manager" a usuario "John"
POST /tenant/users/{johnUserId}/roles/{salesManagerRoleId}
Authorization: Bearer eyJhbGc...

# Respuesta:
{
  "message": "Role assigned successfully",
  "user_role": {
    "id": "user-role-1",
    "user_id": "john-user-id",
    "role_id": "sales-manager-role-id",
    "tenant_id": "divino-tenant-id"
  }
}
```

### **Paso 5: Usuario Obtiene Sus Permisos (Tenant Backend - YA EXISTE)**

```bash
# John hace login
POST /auth/login
{
  "email": "john@divino.com",
  "password": "123"
}
# Respuesta: { "access_token": "eyJhbGc..." }

# John ve sus permisos
GET /tenant/users/{johnUserId}/permissions
Authorization: Bearer eyJhbGc...

# Respuesta:
{
  "user": {
    "id": "john-user-id",
    "email": "john@divino.com"
  },
  "permissions": [
    "leads:create",
    "leads:read",
    "leads:update",
    "leads:delete"
  ]
}

# ⚠️ IMPORTANTE: John SOLO tiene permisos de Leads
# ❌ NO tiene permisos de Reports, Analytics, etc
```

### **Paso 6: Usuario Accede a Endpoints (Tenant Backend - YA EXISTE)**

```bash
# John intenta acceder a Leads (tiene permiso)
GET /leads
Authorization: Bearer eyJhbGc...
# ✅ 200 OK - Acceso permitido

# John intenta acceder a Reports (NO tiene permiso)
GET /reports
Authorization: Bearer eyJhbGc...
# ❌ 403 Forbidden - Acceso denegado
```

---

## 🔐 Validaciones Implementadas

### **Validación 1: Tenant Solo Ve Sus Módulos Habilitados**
```typescript
// ModuleService.getEnabledModulesForCurrentTenant()
.where('tm.tenant_id = :tenantId', { tenantId })
.andWhere('tm.is_enabled = :isEnabled', { isEnabled: true })
```
✅ Filtra por tenant_id y is_enabled = true

### **Validación 2: Tenant Solo Puede Asignar Permisos de Módulos Habilitados**
```typescript
// RoleService.assignPermissionToRole()
if (tenantId && permission.module_id) {
  const tenantModule = await this.tenantModuleRepository.findOne({
    where: {
      tenant_id: tenantId,
      module_id: permission.module_id,
      is_enabled: true,
    },
  });

  if (!tenantModule) {
    throw new BadRequestException(
      `Permission belongs to a module that is not enabled for this tenant`,
    );
  }
}
```
✅ Verifica que el permiso pertenece a un módulo habilitado

### **Validación 3: Usuario Solo Obtiene Permisos de Sus Roles**
```typescript
// PermissionService.getUserPermissions()
// Obtiene permisos a través de:
// Usuario → UserRoles → Roles → RolePermissions → Permissions
```
✅ Cadena de relaciones garantiza que solo obtiene permisos asignados

### **Validación 4: Tenant Context Previene Cross-Tenant Access**
```typescript
// TenantContextMiddleware
// Extrae tenant_id del JWT y lo valida
// Todos los endpoints verifican que el tenant_id coincida
```
✅ Imposible acceder a datos de otro tenant

---

## 📋 Tabla de Control

| Acción | Quién | Dónde | Validación |
|--------|-------|-------|-----------|
| Crear Módulos | Admin | Admin Backend | N/A (futuro) |
| Definir Permisos | Admin | Admin Backend | N/A (futuro) |
| Habilitar Módulos | Admin | Admin Backend | N/A (futuro) |
| Ver Módulos | Tenant | GET /tenant/modules | ✅ Solo habilitados |
| Crear Roles | Tenant | POST /tenant/roles | ✅ Solo con permisos habilitados |
| Asignar Roles | Tenant | POST /tenant/users/{id}/roles/{id} | ✅ Validación de módulo |
| Ver Permisos | Usuario | GET /tenant/users/{id}/permissions | ✅ Solo de sus roles |
| Acceder Endpoint | Usuario | GET /leads, etc | ✅ PermissionGuard valida |

---

## 🎯 Resumen: Cómo Controlas Todo

### **Como Admin:**
1. ✅ Creas módulos (Leads, Customers, Reports)
2. ✅ Defines permisos por módulo (Create, Read, Update, Delete)
3. ✅ Habilitas módulos para cada tenant
4. ✅ El tenant SOLO ve y puede usar esos módulos

### **Como Tenant:**
1. ✅ Ve qué módulos tiene habilitados
2. ✅ Crea roles con permisos de esos módulos
3. ✅ Asigna roles a usuarios
4. ✅ NO puede crear permisos de módulos no habilitados

### **Como Usuario:**
1. ✅ Obtiene permisos de sus roles
2. ✅ Accede solo a endpoints permitidos
3. ✅ NO puede acceder a módulos no habilitados

---

## 🚀 Próximos Pasos

1. **Crear Admin Backend** con endpoints:
   - `POST /admin/modules` - Crear módulos
   - `POST /admin/modules/{id}/permissions` - Crear permisos
   - `POST /admin/tenants/{id}/modules` - Habilitar módulos

2. **Seed Data** - Crear módulos y permisos iniciales

3. **Testing** - Verificar que las validaciones funcionan

4. **UI** - Construir interfaz para tenant
