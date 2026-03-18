# Guía de Implementación: Permiso "Ver Menu"

## Descripción General

Se ha implementado un nuevo permiso `View_Menu` para todos los módulos del sistema. Este permiso controla la visibilidad de los elementos del sidebar/menú de navegación, permitiendo un control granular sobre qué módulos puede ver cada usuario.

## Arquitectura

### 1. Permiso View_Menu

Cada módulo ahora tiene un permiso adicional:
- **Acción**: `View_Menu`
- **Descripción**: "View [Module Name] menu in sidebar"
- **Tipo**: Sistema (is_system_permission = true)

### 2. Componentes Creados

#### Scripts de Base de Datos

**SQL Script**: `src/database/scripts/add-view-menu-permission.sql`
- Agrega el permiso View_Menu a todos los módulos existentes
- Asigna automáticamente el permiso a todos los roles Admin
- Incluye queries de verificación

**TypeScript Script**: `src/database/scripts/add-view-menu-permission.ts`
- Versión ejecutable del script SQL
- Maneja entity_registry automáticamente
- Proporciona logging detallado
- Incluye verificación y reporte

#### Servicios Backend

**MenuPermissionService**: `src/api/rbac/services/menu-permission.service.ts`

Métodos principales:
- `canViewMenu(moduleCode)`: Verifica si el usuario puede ver un módulo específico
- `getVisibleModulesForCurrentUser()`: Obtiene todos los módulos visibles con detalles
- `getAuthorizedMenuStructure()`: Obtiene estructura de menú filtrada
- `checkMultipleMenuPermissions(moduleCodes)`: Verificación en lote

#### Decorators

**Archivo**: `src/api/rbac/decorators/require-permissions.decorator.ts`

Nuevos decorators:
```typescript
@RequireViewMenu('customers')  // Genérico
@RequireCustomerMenu()         // Específico para customers
@RequireLeadMenu()             // Específico para leads
@RequireVendorMenu()           // Específico para vendors
@RequireProductMenu()          // Específico para products
@RequireWarehouseMenu()        // Específico para warehouse
@RequireContractMenu()         // Específico para contracts
@RequireActivityMenu()         // Específico para activities
@RequireReportMenu()           // Específico para reports
```

#### Endpoints API

**Controller**: `src/api/rbac/controllers/modules.controller.ts`

Nuevos endpoints:

1. **GET /tenant/modules/visible-menu**
   - Retorna solo los módulos que el usuario puede ver
   - Incluye permisos disponibles para cada módulo
   - Usar para construir el sidebar

2. **GET /tenant/modules/menu-permissions**
   - Retorna todos los módulos con estado de View_Menu
   - Incluye módulos no visibles (hasViewPermission: false)
   - Útil para debugging y administración

## Instalación

### Paso 0: Verificar Entity Registry (IMPORTANTE)

Si encuentras el error `Column 'entity_registry_id' cannot be null`, primero ejecuta:

**Opción A: SQL Directo**
```bash
mysql -u usuario -p nombre_db < src/database/scripts/fix-entity-registry-for-modules.sql
```

**Opción B: TypeScript Script**
```bash
npx ts-node src/database/scripts/fix-entity-registry-for-modules.ts
```

Este script asegura que todos los módulos tengan entradas en `entity_registry`.

### Paso 1: Ejecutar el Script de Base de Datos

**Opción A: SQL Directo**
```bash
# Conectar a la base de datos y ejecutar
mysql -u usuario -p nombre_db < src/database/scripts/add-view-menu-permission.sql
```

**Opción B: TypeScript Script (Recomendado)**
```bash
# Compilar y ejecutar
npm run build
node dist/database/scripts/add-view-menu-permission.js
```

O usando ts-node:
```bash
npx ts-node src/database/scripts/add-view-menu-permission.ts
```

### Paso 2: Verificar la Instalación

Ejecutar las queries de verificación incluidas en el script:

```sql
-- Ver permisos View_Menu creados
SELECT 
    m.name as module_name,
    m.code as module_code,
    p.action,
    p.description
FROM rbac_permissions p
JOIN modules m ON p.module_id = m.id
WHERE p.action = 'View_Menu'
ORDER BY m.name;

-- Ver roles con permisos View_Menu
SELECT 
    r.name as role_name,
    t.name as tenant_name,
    COUNT(p.id) as view_menu_permissions_count
FROM rbac_roles r
JOIN rbac_tenants t ON r.tenant_id = t.id
LEFT JOIN rbac_role_permissions rp ON rp.role_id = r.id
LEFT JOIN rbac_permissions p ON p.id = rp.permission_id AND p.action = 'View_Menu'
WHERE r.is_admin = true
GROUP BY r.id, r.name, t.name;
```

## Uso en el Backend

### Proteger Endpoints de Menú

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequireCustomerMenu } from '../decorators/require-permissions.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CustomersController {
  
  @Get('menu-config')
  @RequireCustomerMenu()  // Solo usuarios con customers:View_Menu
  async getMenuConfig() {
    return {
      title: 'Customers',
      icon: 'users',
      route: '/customers'
    };
  }
}
```

### Verificar Permisos Programáticamente

```typescript
import { MenuPermissionService } from '../services/menu-permission.service';

@Injectable()
export class MyService {
  constructor(private menuPermissionService: MenuPermissionService) {}

  async buildCustomMenu() {
    // Verificar un módulo específico
    const canViewCustomers = await this.menuPermissionService.canViewMenu('customers');
    
    // Obtener todos los módulos visibles
    const visibleModules = await this.menuPermissionService.getVisibleModulesForCurrentUser();
    
    // Obtener estructura de menú autorizada
    const menuStructure = await this.menuPermissionService.getAuthorizedMenuStructure();
    
    return menuStructure;
  }
}
```

## Uso en el Frontend

### 1. Obtener Módulos Visibles

```typescript
// Angular Service Example
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface MenuModule {
  code: string;
  name: string;
  description?: string;
  permissions: string[];
}

interface MenuResponse {
  modules: MenuModule[];
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  constructor(private http: HttpClient) {}

  getVisibleMenuItems(): Observable<MenuResponse> {
    return this.http.get<MenuResponse>('/api/tenant/modules/visible-menu');
  }
}
```

### 2. Construir el Sidebar

```typescript
// Angular Component Example
import { Component, OnInit } from '@angular/core';
import { MenuService } from './menu.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  visible: boolean;
}

@Component({
  selector: 'app-sidebar',
  template: `
    <nav class="sidebar">
      <ul>
        <li *ngFor="let item of menuItems">
          <a *ngIf="item.visible" [routerLink]="item.route">
            <i [class]="item.icon"></i>
            {{ item.label }}
          </a>
        </li>
      </ul>
    </nav>
  `
})
export class SidebarComponent implements OnInit {
  menuItems: MenuItem[] = [];

  constructor(private menuService: MenuService) {}

  ngOnInit() {
    this.loadMenu();
  }

  async loadMenu() {
    const response = await this.menuService.getVisibleMenuItems().toPromise();
    
    // Mapear módulos a items del menú
    const moduleToMenuItem: Record<string, Partial<MenuItem>> = {
      'customers': { label: 'Clientes', icon: 'fa-users', route: '/customers' },
      'leads': { label: 'Prospectos', icon: 'fa-user-plus', route: '/leads' },
      'vendors': { label: 'Proveedores', icon: 'fa-truck', route: '/vendors' },
      'products': { label: 'Productos', icon: 'fa-box', route: '/products' },
      'warehouse': { label: 'Almacén', icon: 'fa-warehouse', route: '/warehouse' },
      'contracts': { label: 'Contratos', icon: 'fa-file-contract', route: '/contracts' },
      'activities': { label: 'Actividades', icon: 'fa-tasks', route: '/activities' },
      'reports': { label: 'Reportes', icon: 'fa-chart-bar', route: '/reports' },
    };

    this.menuItems = response.modules.map(module => ({
      ...moduleToMenuItem[module.code],
      visible: true,
    } as MenuItem));
  }
}
```

### 3. React Example

```typescript
// React Hook Example
import { useState, useEffect } from 'react';
import axios from 'axios';

interface MenuModule {
  code: string;
  name: string;
  permissions: string[];
}

export function useSidebarMenu() {
  const [menuItems, setMenuItems] = useState<MenuModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMenu() {
      try {
        const response = await axios.get('/api/tenant/modules/visible-menu');
        setMenuItems(response.data.modules);
      } catch (error) {
        console.error('Error loading menu:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, []);

  return { menuItems, loading };
}

// Component
export function Sidebar() {
  const { menuItems, loading } = useSidebarMenu();

  if (loading) return <div>Loading...</div>;

  return (
    <nav className="sidebar">
      <ul>
        {menuItems.map(item => (
          <li key={item.code}>
            <a href={`/${item.code}`}>{item.name}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

## Administración de Permisos

### Asignar View_Menu a un Rol

```sql
-- Obtener el ID del permiso View_Menu para un módulo
SELECT p.id, m.name, p.action 
FROM rbac_permissions p
JOIN modules m ON p.module_id = m.id
WHERE m.code = 'customers' AND p.action = 'View_Menu';

-- Asignar a un rol específico
INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
VALUES (UUID(), 'ROLE_ID_AQUI', 'PERMISSION_ID_AQUI', NOW());
```

### Revocar View_Menu de un Rol

```sql
-- Revocar permiso View_Menu de customers para un rol
DELETE FROM rbac_role_permissions
WHERE role_id = 'ROLE_ID_AQUI'
AND permission_id IN (
  SELECT p.id 
  FROM rbac_permissions p
  JOIN modules m ON p.module_id = m.id
  WHERE m.code = 'customers' AND p.action = 'View_Menu'
);
```

## Testing

### Test Backend

```typescript
describe('MenuPermissionService', () => {
  let service: MenuPermissionService;

  it('should return visible modules for user', async () => {
    const modules = await service.getVisibleModulesForCurrentUser();
    expect(modules).toBeDefined();
    expect(Array.isArray(modules)).toBe(true);
  });

  it('should check View_Menu permission', async () => {
    const canView = await service.canViewMenu('customers');
    expect(typeof canView).toBe('boolean');
  });
});
```

### Test Frontend

```typescript
describe('SidebarComponent', () => {
  it('should only show modules with View_Menu permission', async () => {
    // Mock API response
    const mockResponse = {
      modules: [
        { code: 'customers', name: 'Customers', permissions: ['View_Menu'] },
        { code: 'leads', name: 'Leads', permissions: ['View_Menu'] }
      ]
    };

    // Test that sidebar only shows these modules
    // ...
  });
});
```

## Troubleshooting

### Problema: Column 'entity_registry_id' cannot be null

**Causa**: Algunos módulos no tienen entradas correspondientes en la tabla `entity_registry`.

**Solución**:
```bash
# Ejecutar el script de corrección primero
npx ts-node src/database/scripts/fix-entity-registry-for-modules.ts

# Luego ejecutar el script principal
npx ts-node src/database/scripts/add-view-menu-permission.ts
```

O usando SQL:
```bash
mysql -u usuario -p nombre_db < src/database/scripts/fix-entity-registry-for-modules.sql
mysql -u usuario -p nombre_db < src/database/scripts/add-view-menu-permission.sql
```

### Problema: No se muestran módulos en el sidebar

**Solución**:
1. Verificar que el script de permisos se ejecutó correctamente
2. Verificar que el usuario tiene el permiso View_Menu asignado
3. Revisar logs del backend para errores de permisos

```sql
-- Verificar permisos del usuario
SELECT 
    u.email,
    r.name as role_name,
    p.action,
    m.name as module_name
FROM users u
JOIN rbac_user_roles ur ON ur.user_id = u.id
JOIN rbac_roles r ON r.id = ur.role_id
JOIN rbac_role_permissions rp ON rp.role_id = r.id
JOIN rbac_permissions p ON p.id = rp.permission_id
JOIN modules m ON m.id = p.module_id
WHERE u.email = 'usuario@ejemplo.com'
AND p.action = 'View_Menu';
```

### Problema: Admin no puede ver todos los módulos

**Solución**:
Ejecutar la parte del script que asigna permisos a Admin:

```sql
INSERT INTO rbac_role_permissions (id, role_id, permission_id, created_at)
SELECT 
    UUID() as id,
    r.id as role_id,
    p.id as permission_id,
    NOW() as created_at
FROM rbac_roles r
CROSS JOIN rbac_permissions p
WHERE r.is_admin = true
AND p.action = 'View_Menu'
AND NOT EXISTS (
    SELECT 1 
    FROM rbac_role_permissions rp 
    WHERE rp.role_id = r.id 
    AND rp.permission_id = p.id
);
```

## Mejores Prácticas

1. **Siempre usar el endpoint `/visible-menu`** para construir el sidebar
2. **No hardcodear** la lista de módulos en el frontend
3. **Cachear** la respuesta del menú en el frontend (invalidar al cambiar roles)
4. **Verificar permisos** tanto en frontend como backend
5. **Asignar View_Menu** junto con otros permisos del módulo
6. **Documentar** qué roles tienen acceso a qué módulos

## Próximos Pasos

1. Actualizar el frontend para usar el nuevo endpoint
2. Configurar permisos View_Menu para roles no-admin
3. Agregar tests de integración
4. Documentar permisos por rol en la wiki del proyecto
5. Considerar agregar permisos View_Menu a nuevos módulos automáticamente

## Soporte

Para preguntas o problemas:
1. Revisar esta guía
2. Verificar logs del backend
3. Ejecutar queries de verificación
4. Contactar al equipo de desarrollo
