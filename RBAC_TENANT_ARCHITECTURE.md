# 🔐 RBAC Tenant Architecture - Propuesta Completa

## 📋 Problema Actual

1. **Permisos globales**: Los permisos se crean a nivel global, no por tenant
2. **Flujo confuso**: No está claro cómo el admin habilita módulos y el tenant asigna permisos
3. **Endpoints complejos**: Los endpoints RBAC no son user-friendly
4. **Falta de módulos**: No hay concepto de "módulos habilitados por tenant"

---

## 🎯 Solución Propuesta

### Nivel 1: Admin Backend (Separado)
```
Admin controla:
- Crear tenants
- Habilitar/deshabilitar MÓDULOS por tenant
- Definir permisos disponibles por módulo
```

### Nivel 2: Tenant Backend (Este)
```
Tenant controla:
- Crear roles personalizados
- Asignar permisos a roles (solo de módulos habilitados)
- Asignar roles a usuarios
- Ver/gestionar usuarios
```

---

## 🏗️ Arquitectura Propuesta

### 1. **Entidad: Módulo (Module)**

```typescript
@Entity('modules')
export class Module {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;  // "Leads", "Customers", "Reports"

    @Column()
    code: string;  // "leads", "customers", "reports"

    @Column()
    description: string;

    @OneToMany(() => Permission, p => p.module)
    permissions: Permission[];

    @OneToMany(() => TenantModule, tm => tm.module)
    tenant_modules: TenantModule[];

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
```

### 2. **Entidad: Tenant Module (Módulos habilitados por tenant)**

```typescript
@Entity('tenant_modules')
@Index('tenant_module_index', ['tenant_id', 'module_id'], { unique: true })
export class TenantModule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: RBACTenant;

    @Column()
    tenant_id: string;

    @ManyToOne(() => Module, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'module_id' })
    module: Module;

    @Column()
    module_id: string;

    @Column({ default: true })
    is_enabled: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
```

### 3. **Actualizar: Permission Entity**

```typescript
@Entity('rbac_permissions')
@Index('module_action_index', ['module_id', 'action'], { unique: true })
export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Module, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'module_id' })
    module: Module;

    @Column()
    module_id: string;

    @Column()
    action: string;  // "Create", "Read", "Update", "Delete"

    @Column()
    description: string;

    @Column({ default: false })
    is_system_permission: boolean;

    @OneToMany(() => RolePermission, rp => rp.permission)
    role_permissions: RolePermission[];

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
```

---

## 🔄 Flujo Completo

### Admin Backend (Nivel 1)
```
1. Admin crea tenant
2. Admin habilita módulos para el tenant
   POST /admin/tenants/{tenantId}/modules
   {
     "module_ids": ["leads", "customers", "reports"]
   }
```

### Tenant Backend (Este) - Endpoints Propuestos

#### 1. **Gestión de Módulos (Read-Only)**
```
GET /tenant/modules
Respuesta:
{
  "modules": [
    {
      "id": "uuid",
      "name": "Leads",
      "code": "leads",
      "is_enabled": true,
      "permissions": [
        { "id": "uuid", "action": "Create", "description": "..." },
        { "id": "uuid", "action": "Read", "description": "..." },
        { "id": "uuid", "action": "Update", "description": "..." },
        { "id": "uuid", "action": "Delete", "description": "..." }
      ]
    }
  ]
}
```

#### 2. **Gestión de Roles**
```
GET /tenant/roles
Respuesta:
{
  "roles": [
    {
      "id": "uuid",
      "name": "Sales Manager",
      "description": "...",
      "is_system_role": false,
      "permissions": ["leads:create", "leads:read", "leads:update"],
      "user_count": 5,
      "created_at": "2024-01-27T..."
    }
  ]
}

POST /tenant/roles
{
  "name": "Sales Representative",
  "description": "Can manage leads and activities",
  "permission_ids": ["uuid1", "uuid2", "uuid3"]
}

PUT /tenant/roles/{roleId}
{
  "name": "Updated Name",
  "description": "Updated description",
  "permission_ids": ["uuid1", "uuid2"]
}

DELETE /tenant/roles/{roleId}
```

#### 3. **Gestión de Permisos por Rol**
```
GET /tenant/roles/{roleId}/permissions
Respuesta:
{
  "role": {
    "id": "uuid",
    "name": "Sales Manager"
  },
  "permissions": [
    {
      "id": "uuid",
      "module": "Leads",
      "action": "Create",
      "description": "..."
    }
  ]
}

POST /tenant/roles/{roleId}/permissions
{
  "permission_ids": ["uuid1", "uuid2", "uuid3"]
}

DELETE /tenant/roles/{roleId}/permissions/{permissionId}
```

#### 4. **Gestión de Usuarios**
```
GET /tenant/users
Respuesta:
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "roles": [
        { "id": "uuid", "name": "Sales Manager" }
      ],
      "created_at": "2024-01-27T..."
    }
  ]
}

POST /tenant/users
{
  "email": "newuser@example.com",
  "name": "New User",
  "role_ids": ["uuid1", "uuid2"]
}

PUT /tenant/users/{userId}
{
  "name": "Updated Name",
  "role_ids": ["uuid1", "uuid2"]
}

DELETE /tenant/users/{userId}

GET /tenant/users/{userId}
Respuesta:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "roles": [
      {
        "id": "uuid",
        "name": "Sales Manager",
        "permissions": ["leads:create", "leads:read", ...]
      }
    ]
  }
}
```

#### 5. **Gestión de Permisos de Usuario**
```
GET /tenant/users/{userId}/permissions
Respuesta:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "permissions": [
    "leads:create",
    "leads:read",
    "leads:update",
    "customers:read",
    ...
  ]
}
```

---

## 📁 Estructura de Carpetas Propuesta

```
src/api/rbac/
├── controllers/
│   ├── modules.controller.ts          ✨ NUEVO
│   ├── roles.controller.ts            ✨ NUEVO (refactorizado)
│   ├── permissions.controller.ts      ✨ NUEVO (refactorizado)
│   ├── users-roles.controller.ts      ✨ NUEVO
│   └── audit-log.controller.ts        ✅ MANTENER
├── services/
│   ├── module.service.ts              ✨ NUEVO
│   ├── role.service.ts                ⚠️ REFACTORIZAR
│   ├── permission.service.ts          ⚠️ REFACTORIZAR
│   ├── user-role.service.ts           ✨ NUEVO
│   └── audit-log.service.ts           ✅ MANTENER
├── dto/
│   ├── create-role.dto.ts             ✨ NUEVO
│   ├── update-role.dto.ts             ✨ NUEVO
│   ├── assign-permissions.dto.ts      ✨ NUEVO
│   └── ...
└── entities/
    ├── module.entity.ts               ✨ NUEVO
    ├── tenant-module.entity.ts        ✨ NUEVO
    └── ...
```

---

## 🎨 UI Tenant - Pantallas Propuestas

### 1. **Dashboard RBAC**
```
┌─────────────────────────────────────┐
│ Gestión de Acceso                   │
├─────────────────────────────────────┤
│ Módulos Habilitados: 3              │
│ Roles: 5                            │
│ Usuarios: 12                        │
└─────────────────────────────────────┘
```

### 2. **Pantalla de Roles**
```
┌─────────────────────────────────────┐
│ Roles                    [+ Nuevo]   │
├─────────────────────────────────────┤
│ Sales Manager      [Editar] [Borrar] │
│ ├─ Leads: Create, Read, Update      │
│ ├─ Customers: Read                  │
│ └─ 5 usuarios asignados             │
│                                     │
│ Sales Rep          [Editar] [Borrar] │
│ ├─ Leads: Create, Read              │
│ └─ 3 usuarios asignados             │
└─────────────────────────────────────┘
```

### 3. **Pantalla de Usuarios**
```
┌─────────────────────────────────────┐
│ Usuarios                 [+ Nuevo]   │
├─────────────────────────────────────┤
│ john@example.com                    │
│ ├─ Roles: Sales Manager             │
│ ├─ Permisos: 8                      │
│ └─ [Editar] [Borrar]                │
│                                     │
│ jane@example.com                    │
│ ├─ Roles: Sales Rep                 │
│ ├─ Permisos: 5                      │
│ └─ [Editar] [Borrar]                │
└─────────────────────────────────────┘
```

### 4. **Pantalla de Crear/Editar Rol**
```
┌─────────────────────────────────────┐
│ Crear Rol                           │
├─────────────────────────────────────┤
│ Nombre: [Sales Manager]             │
│ Descripción: [...]                  │
│                                     │
│ Módulos Habilitados:                │
│ ☑ Leads                             │
│   ☑ Create                          │
│   ☑ Read                            │
│   ☑ Update                          │
│   ☐ Delete                          │
│                                     │
│ ☑ Customers                         │
│   ☑ Read                            │
│   ☐ Create                          │
│   ☐ Update                          │
│   ☐ Delete                          │
│                                     │
│ [Guardar] [Cancelar]                │
└─────────────────────────────────────┘
```

---

## 🔑 Ventajas de Esta Arquitectura

1. **Claridad**: Separación clara entre admin y tenant
2. **Escalabilidad**: Fácil agregar nuevos módulos
3. **Seguridad**: Tenant solo ve sus módulos habilitados
4. **User-Friendly**: Endpoints intuitivos para UI
5. **Flexibilidad**: Roles personalizados por tenant
6. **Auditoría**: Logs de cambios de permisos

---

## 📊 Comparación: Antes vs Después

### ANTES (Confuso)
```
GET /rbac/roles
GET /rbac/permissions
POST /rbac/role-permissions
DELETE /rbac/role-permissions
```

### DESPUÉS (Claro)
```
GET /tenant/modules (qué puedo usar)
GET /tenant/roles (mis roles)
POST /tenant/roles (crear rol)
PUT /tenant/roles/{id}/permissions (asignar permisos)
GET /tenant/users (mis usuarios)
POST /tenant/users (crear usuario)
```

---

## 🚀 Implementación Recomendada

### Fase 1: Crear Entidades
- [ ] Module entity
- [ ] TenantModule entity
- [ ] Actualizar Permission entity

### Fase 2: Crear Servicios
- [ ] ModuleService
- [ ] RoleService (refactorizar)
- [ ] PermissionService (refactorizar)
- [ ] UserRoleService

### Fase 3: Crear Controladores
- [ ] ModulesController
- [ ] RolesController (refactorizar)
- [ ] PermissionsController (refactorizar)
- [ ] UsersRolesController

### Fase 4: DTOs
- [ ] CreateRoleDto
- [ ] UpdateRoleDto
- [ ] AssignPermissionsDto
- [ ] CreateUserDto

### Fase 5: UI
- [ ] Dashboard RBAC
- [ ] Gestión de Roles
- [ ] Gestión de Usuarios
- [ ] Asignación de Permisos