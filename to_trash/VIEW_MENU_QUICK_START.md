# View_Menu Permission - Quick Start

## ¿Qué es?

Un permiso especial `View_Menu` que controla qué módulos aparecen en el sidebar para cada usuario.

## Instalación Rápida

### Si encuentras error de entity_registry_id:

```bash
# 1. Primero corregir entity_registry
npx ts-node src/database/scripts/fix-entity-registry-for-modules.ts

# 2. Luego ejecutar el script principal
npx ts-node src/database/scripts/add-view-menu-permission.ts
```

### Instalación normal:

```bash
# Ejecutar el script TypeScript
npx ts-node src/database/scripts/add-view-menu-permission.ts
```

## Uso en Frontend

### Obtener módulos visibles

```typescript
// GET /api/tenant/modules/visible-menu
const response = await fetch('/api/tenant/modules/visible-menu', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId
  }
});

const { modules } = await response.json();
// modules = [{ code: 'customers', name: 'Customers', permissions: [...] }]
```

### Construir sidebar

```typescript
// Solo mostrar módulos que vienen en la respuesta
modules.forEach(module => {
  // Agregar item al sidebar
  sidebar.addItem({
    label: module.name,
    route: `/${module.code}`,
    icon: getIconForModule(module.code)
  });
});
```

## Uso en Backend

### Proteger endpoints

```typescript
import { RequireViewMenu } from '../decorators/require-permissions.decorator';

@Get('menu-config')
@RequireViewMenu('customers')  // Solo si tiene customers:View_Menu
async getMenuConfig() {
  return { /* config */ };
}
```

### Verificar programáticamente

```typescript
import { MenuPermissionService } from '../services/menu-permission.service';

constructor(private menuService: MenuPermissionService) {}

async checkAccess() {
  const canView = await this.menuService.canViewMenu('customers');
  if (canView) {
    // Mostrar módulo
  }
}
```

## Administración

### Asignar permiso a un rol

```sql
-- 1. Obtener IDs
SELECT r.id as role_id, p.id as permission_id
FROM rbac_roles r, rbac_permissions p
JOIN modules m ON p.module_id = m.id
WHERE r.name = 'Sales Manager'
AND m.code = 'customers'
AND p.action = 'View_Menu';

-- 2. Asignar
INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
VALUES (UUID(), 'ROLE_ID', 'PERMISSION_ID', NOW());
```

### Verificar permisos de un usuario

```sql
SELECT u.email, m.name as module, p.action
FROM users u
JOIN rbac_user_roles ur ON ur.user_id = u.id
JOIN rbac_roles r ON r.id = ur.role_id
JOIN rbac_role_permissions rp ON rp.role_id = r.id
JOIN rbac_permissions p ON p.id = rp.permission_id
JOIN modules m ON m.id = p.module_id
WHERE u.email = 'user@example.com'
AND p.action = 'View_Menu';
```

## Endpoints Disponibles

| Endpoint | Descripción |
|----------|-------------|
| `GET /tenant/modules/visible-menu` | Módulos que el usuario puede ver |
| `GET /tenant/modules/menu-permissions` | Todos los módulos con estado de permiso |
| `GET /tenant/modules` | Todos los módulos habilitados (requiere permisos) |

## Decorators Disponibles

```typescript
@RequireViewMenu('customers')    // Genérico
@RequireCustomerMenu()           // Customers
@RequireLeadMenu()               // Leads
@RequireVendorMenu()             // Vendors
@RequireProductMenu()            // Products
@RequireWarehouseMenu()          // Warehouse
@RequireContractMenu()           // Contracts
@RequireActivityMenu()           // Activities
@RequireReportMenu()             // Reports
```

## Troubleshooting

**Error: Column 'entity_registry_id' cannot be null:**
```bash
# Ejecutar primero el script de corrección
npx ts-node src/database/scripts/fix-entity-registry-for-modules.ts
# Luego el script principal
npx ts-node src/database/scripts/add-view-menu-permission.ts
```

**No aparecen módulos en el sidebar:**
```sql
-- Verificar que el script se ejecutó
SELECT COUNT(*) FROM rbac_permissions WHERE action = 'View_Menu';
-- Debe retornar > 0

-- Verificar permisos del usuario
SELECT m.name 
FROM rbac_permissions p
JOIN modules m ON p.module_id = m.id
JOIN rbac_role_permissions rp ON rp.permission_id = p.id
JOIN rbac_user_roles ur ON ur.role_id = rp.role_id
WHERE ur.user_id = 'USER_ID' AND p.action = 'View_Menu';
```

**Admin no ve todos los módulos:**
```sql
-- Re-asignar permisos a Admin
INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
SELECT UUID(), r.id, p.id, NOW()
FROM rbac_roles r
CROSS JOIN rbac_permissions p
WHERE r.is_admin = true AND p.action = 'View_Menu'
AND NOT EXISTS (
  SELECT 1 FROM rbac_role_permissions rp 
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);
```

## Documentación Completa

Ver `VIEW_MENU_PERMISSION_GUIDE.md` para documentación detallada.
