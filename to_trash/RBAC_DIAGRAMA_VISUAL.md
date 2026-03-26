# 📊 Diagrama Visual - Tenant RBAC Architecture

## 🏗️ Arquitectura de Tres Niveles

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ADMIN BACKEND (Futuro)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  POST /admin/modules                                                    │
│  ├── Leads                                                              │
│  ├── Customers                                                          │
│  ├── Reports                                                            │
│  └── Analytics                                                          │
│                                                                         │
│  POST /admin/modules/{id}/permissions                                   │
│  ├── Leads: Create, Read, Update, Delete                               │
│  ├── Customers: Create, Read, Update, Delete                           │
│  ├── Reports: Read, Export                                             │
│  └── Analytics: Read                                                    │
│                                                                         │
│  POST /admin/tenants/{id}/modules                                       │
│  ├── Tenant Divino: [Leads, Customers]                                 │
│  ├── Tenant Acme: [Leads, Reports]                                     │
│  └── Tenant XYZ: [Customers, Analytics]                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                        (Habilita módulos)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      TENANT BACKEND (Actual)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Tenant: Divino                                                         │
│  ├── Módulos Habilitados:                                              │
│  │   ├── ✅ Leads                                                       │
│  │   │   ├── Create                                                     │
│  │   │   ├── Read                                                       │
│  │   │   ├── Update                                                     │
│  │   │   └── Delete                                                     │
│  │   └── ✅ Customers                                                   │
│  │       ├── Create                                                     │
│  │       ├── Read                                                       │
│  │       ├── Update                                                     │
│  │       └── Delete                                                     │
│  │                                                                      │
│  ├── Roles Creados:                                                     │
│  │   ├── Sales Manager                                                  │
│  │   │   ├── leads:create                                              │
│  │   │   ├── leads:read                                                │
│  │   │   ├── leads:update                                              │
│  │   │   └── customers:read                                            │
│  │   │                                                                  │
│  │   └── Customer Support                                              │
│  │       ├── customers:read                                            │
│  │       └── customers:update                                          │
│  │                                                                      │
│  └── Usuarios:                                                          │
│      ├── John (Sales Manager)                                          │
│      │   └── Permisos: leads:create, leads:read, leads:update,        │
│      │                 customers:read                                   │
│      │                                                                  │
│      └── Jane (Customer Support)                                       │
│          └── Permisos: customers:read, customers:update               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                        (Usuarios acceden)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          USUARIOS FINALES                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  John (Sales Manager)                                                   │
│  ├── GET /leads                    ✅ (leads:read)                      │
│  ├── POST /leads                   ✅ (leads:create)                    │
│  ├── PUT /leads/{id}               ✅ (leads:update)                    │
│  ├── GET /customers                ✅ (customers:read)                  │
│  ├── POST /customers               ❌ (no tiene customers:create)       │
│  └── GET /reports                  ❌ (Reports no habilitado)           │
│                                                                         │
│  Jane (Customer Support)                                                │
│  ├── GET /customers                ✅ (customers:read)                  │
│  ├── PUT /customers/{id}           ✅ (customers:update)                │
│  ├── POST /customers               ❌ (no tiene customers:create)       │
│  ├── GET /leads                    ❌ (no tiene leads:read)             │
│  └── GET /reports                  ❌ (Reports no habilitado)           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ADMIN HABILITA MÓDULOS                            │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
                    POST /admin/tenants/{id}/modules
                    { "module_ids": ["leads", "customers"] }
                              ↓
                    ┌─────────────────────┐
                    │  tenant_modules     │
                    ├─────────────────────┤
                    │ tenant_id: divino   │
                    │ module_id: leads    │
                    │ is_enabled: true    │
                    │                     │
                    │ tenant_id: divino   │
                    │ module_id: customers│
                    │ is_enabled: true    │
                    └─────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                    TENANT VE MÓDULOS                                 │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
                    GET /tenant/modules
                              ↓
                    ModuleService.getEnabledModulesForCurrentTenant()
                              ↓
                    SELECT * FROM tenant_modules
                    WHERE tenant_id = 'divino'
                    AND is_enabled = true
                              ↓
                    Respuesta: [Leads, Customers]
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                    TENANT CREA ROLES                                 │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
                    POST /tenant/roles
                    {
                      "name": "Sales Manager",
                      "permission_ids": ["leads-create", "leads-read"]
                    }
                              ↓
                    RoleService.assignPermissionToRole()
                              ↓
                    ✅ Valida: ¿Permiso pertenece a módulo habilitado?
                    ├── leads-create → Leads habilitado ✅
                    └── leads-read → Leads habilitado ✅
                              ↓
                    ┌─────────────────────┐
                    │  rbac_roles         │
                    ├─────────────────────┤
                    │ id: sales-manager   │
                    │ name: Sales Manager │
                    │ tenant_id: divino   │
                    └─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  rbac_role_permissions
                    ├─────────────────────┤
                    │ role_id: sales-mgr  │
                    │ permission_id: leads-create
                    │                     │
                    │ role_id: sales-mgr  │
                    │ permission_id: leads-read
                    └─────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                    TENANT ASIGNA ROLES A USUARIOS                    │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
                    POST /tenant/users/john/roles/sales-manager
                              ↓
                    ┌─────────────────────┐
                    │  rbac_user_roles    │
                    ├─────────────────────┤
                    │ user_id: john       │
                    │ role_id: sales-mgr  │
                    │ tenant_id: divino   │
                    └─────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                    USUARIO OBTIENE PERMISOS                          │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
                    GET /tenant/users/john/permissions
                              ↓
                    PermissionService.getUserPermissions()
                              ↓
                    SELECT permissions
                    FROM rbac_permissions p
                    JOIN rbac_role_permissions rp ON p.id = rp.permission_id
                    JOIN rbac_roles r ON rp.role_id = r.id
                    JOIN rbac_user_roles ur ON r.id = ur.role_id
                    WHERE ur.user_id = 'john'
                    AND ur.tenant_id = 'divino'
                              ↓
                    Respuesta: ["leads:create", "leads:read"]
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                    USUARIO ACCEDE A ENDPOINTS                        │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
                    GET /leads
                              ↓
                    PermissionGuard.canActivate()
                              ↓
                    ✅ Valida: ¿Usuario tiene leads:read?
                    ├── Obtiene permisos de usuario
                    ├── Busca "leads:read"
                    └── ✅ Encontrado → Acceso permitido
                              ↓
                    200 OK - Respuesta con leads
```

---

## 🔐 Validaciones en Cascada

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. TENANT SOLO VE MÓDULOS HABILITADOS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ GET /tenant/modules                                             │
│         ↓                                                       │
│ WHERE tenant_id = 'divino' AND is_enabled = true               │
│         ↓                                                       │
│ Respuesta: Solo Leads y Customers                              │
│ ❌ NO ve: Reports, Analytics                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. TENANT SOLO PUEDE ASIGNAR PERMISOS HABILITADOS               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ POST /tenant/roles                                              │
│ { "permission_ids": ["leads-create", "reports-read"] }         │
│         ↓                                                       │
│ Para cada permiso:                                              │
│   ├── leads-create                                              │
│   │   └── ¿Módulo Leads habilitado? ✅ SÍ → Permitido          │
│   └── reports-read                                              │
│       └── ¿Módulo Reports habilitado? ❌ NO → Error             │
│         ↓                                                       │
│ Error: "Permission belongs to a module that is not enabled"    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. USUARIO SOLO OBTIENE PERMISOS DE SUS ROLES                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ GET /tenant/users/john/permissions                              │
│         ↓                                                       │
│ Usuario → UserRoles → Roles → RolePermissions → Permissions    │
│         ↓                                                       │
│ Respuesta: Solo permisos de roles asignados                    │
│ ❌ NO ve: Permisos de otros usuarios                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. TENANT CONTEXT PREVIENE CROSS-TENANT ACCESS                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ GET /tenant/modules                                             │
│         ↓                                                       │
│ JWT Token: { tenant_id: 'divino', user_id: 'john' }            │
│         ↓                                                       │
│ Middleware: Extrae tenant_id del JWT                           │
│         ↓                                                       │
│ Endpoint: Valida tenant_id coincida                            │
│         ↓                                                       │
│ ✅ Acceso permitido solo a datos de 'divino'                    │
│ ❌ Imposible acceder a datos de 'acme' o 'xyz'                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Tabla de Relaciones

```
┌──────────────────────────────────────────────────────────────────┐
│                        MÓDULOS                                   │
├──────────────────────────────────────────────────────────────────┤
│ id | name      | code      | description                         │
├────┼───────────┼───────────┼─────────────────────────────────────┤
│ 1  │ Leads     │ leads     │ Lead management module              │
│ 2  │ Customers │ customers │ Customer management module          │
│ 3  │ Reports   │ reports   │ Reporting and analytics module      │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    (1:N relationship)
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      PERMISSIONS                                 │
├──────────────────────────────────────────────────────────────────┤
│ id | module_id | entity_type | action | description             │
├────┼───────────┼─────────────┼────────┼─────────────────────────┤
│ 1  │ 1         │ leads       │ Create │ Create new leads        │
│ 2  │ 1         │ leads       │ Read   │ View leads              │
│ 3  │ 1         │ leads       │ Update │ Update leads            │
│ 4  │ 1         │ leads       │ Delete │ Delete leads            │
│ 5  │ 2         │ customers   │ Create │ Create new customers    │
│ 6  │ 2         │ customers   │ Read   │ View customers          │
│ 7  │ 3         │ reports     │ Read   │ View reports            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    (1:N relationship)
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    TENANT_MODULES                                │
├──────────────────────────────────────────────────────────────────┤
│ id | tenant_id | module_id | is_enabled                          │
├────┼───────────┼───────────┼────────────────────────────────────┤
│ 1  │ divino    │ 1         │ true   (Leads habilitado)           │
│ 2  │ divino    │ 2         │ true   (Customers habilitado)       │
│ 3  │ divino    │ 3         │ false  (Reports deshabilitado)      │
│ 4  │ acme      │ 1         │ true   (Leads habilitado)           │
│ 5  │ acme      │ 3         │ true   (Reports habilitado)         │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    (N:M relationship)
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      ROLES                                       │
├──────────────────────────────────────────────────────────────────┤
│ id | name            | tenant_id | is_system_role              │
├────┼─────────────────┼───────────┼────────────────────────────┤
│ 1  │ Sales Manager   │ divino    │ false                      │
│ 2  │ Support Agent   │ divino    │ false                      │
│ 3  │ Admin           │ divino    │ true                       │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    (N:M relationship)
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                  ROLE_PERMISSIONS                                │
├──────────────────────────────────────────────────────────────────┤
│ id | role_id | permission_id                                    │
├────┼─────────┼──────────────────────────────────────────────────┤
│ 1  │ 1       │ 1 (leads:create)                                 │
│ 2  │ 1       │ 2 (leads:read)                                   │
│ 3  │ 1       │ 3 (leads:update)                                 │
│ 4  │ 1       │ 6 (customers:read)                               │
│ 5  │ 2       │ 6 (customers:read)                               │
│ 6  │ 2       │ 5 (customers:create)                             │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    (N:M relationship)
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    USER_ROLES                                    │
├──────────────────────────────────────────────────────────────────┤
│ id | user_id | role_id | tenant_id                              │
├────┼─────────┼─────────┼──────────────────────────────────────┤
│ 1  │ john    │ 1       │ divino (Sales Manager)               │
│ 2  │ jane    │ 2       │ divino (Support Agent)               │
│ 3  │ bob     │ 1       │ divino (Sales Manager)               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Resumen Visual

```
ADMIN
  ↓
Habilita: Leads, Customers para Tenant Divino
  ↓
TENANT DIVINO
  ├── Ve: Leads, Customers (no Reports)
  ├── Crea: Sales Manager (leads:create, leads:read, customers:read)
  └── Asigna: John → Sales Manager
      ↓
USUARIO JOHN
  ├── Permisos: leads:create, leads:read, customers:read
  ├── Acceso: GET /leads ✅, POST /leads ✅, GET /customers ✅
  └── Denegado: GET /reports ❌
```

---

**Diagrama Visual Completo - Tenant RBAC Architecture**
